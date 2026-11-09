import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import ChatView from './components/Chat/ChatView';
import SettingsModal from './components/Settings/SettingsModal';
import MemoryModal from './components/Settings/MemoryModal';
import {
  fetchPersonas,
  fetchSessions,
  fetchSessionHistory,
  fetchInstalledModels,
  deleteSession,
  renameSession,
  streamChat,
} from './api/client';

export default function App() {
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [installedModels, setInstalledModels] = useState(['llama3:8b']);
  const [activeModel, setActiveModel] = useState('llama3:8b');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [streamingContent, setStreamingContent] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);

  // Load personas, installed Ollama models, and past sessions
  useEffect(() => {
    async function init() {
      try {
        const personaList = await fetchPersonas();
        setPersonas(personaList);
        if (personaList.length > 0) {
          setSelectedPersona(personaList[0]);
          setActiveModel(personaList[0].model || 'llama3:8b');
        }

        const models = await fetchInstalledModels();
        if (models && models.length > 0) {
          setInstalledModels(models);
        }

        const sessionList = await fetchSessions();
        setChats(sessionList);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Handle selecting a persona on the main screen
  const handleSelectPersona = (persona) => {
    if (!persona) return;
    setSelectedPersona(persona);
    setActiveModel(persona.model || activeModel || 'llama3:8b');
    // If inside an active session, update its persona association
    if (activeChatId) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId ? { ...c, persona_id: persona.id } : c
        )
      );
    }
  };

  // Handle selecting an Ollama model directly in settings
  const handleSelectModel = (modelName) => {
    setActiveModel(modelName);
    setSelectedPersona((prev) => (prev ? { ...prev, model: modelName } : prev));
  };

  // Chat Selection
  const handleSelectChat = useCallback(
    async (chatId) => {
      try {
        setActiveChatId(chatId);
        setStreamingContent(null);
        setChatError(null);
        const data = await fetchSessionHistory(chatId);
        setLocalMessages(data.messages || []);

        if (data.session && personas.length > 0) {
          const matched = personas.find((p) => p.id === data.session.persona_id);
          if (matched) {
            setSelectedPersona(matched);
            setActiveModel(matched.model || 'llama3:8b');
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    },
    [personas]
  );

  // New Chat
  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setLocalMessages([]);
    setStreamingContent(null);
    setChatError(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Delete chat
  const handleDeleteChat = useCallback(
    async (id) => {
      try {
        await deleteSession(id);
        setChats((prev) => prev.filter((c) => c.id !== id));
        if (activeChatId === id) {
          handleNewChat();
        }
      } catch (err) {
        console.error('Failed to delete chat:', err);
      }
    },
    [activeChatId, handleNewChat]
  );

  // Rename chat
  const handleRenameChat = useCallback(
    async (id, newTitle) => {
      try {
        await renameSession(id, newTitle);
        setChats((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
      } catch (err) {
        console.error('Failed to rename chat:', err);
      }
    },
    []
  );

  // Send message and stream response
  const handleSend = useCallback(
    async (text) => {
      if (!selectedPersona || isStreaming) return;

      const userMsg = { role: 'user', content: text };
      setLocalMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setIsTyping(true);
      setStreamingContent('');
      setChatError(null);

      let accumulatedTokens = '';
      let isFinished = false;

      const finalize = () => {
        if (isFinished) return;
        isFinished = true;
        if (accumulatedTokens) {
          setLocalMessages((prev) => [
            ...prev,
            { role: 'assistant', content: accumulatedTokens },
          ]);
        }
        setStreamingContent(null);
        setIsStreaming(false);
        setIsTyping(false);
        fetchSessions().then(setChats).catch(console.error);
      };

      await streamChat({
        personaId: selectedPersona.id,
        message: text,
        sessionId: activeChatId,
        model: activeModel || selectedPersona.model,
        onStart: (data) => {
          if (!activeChatId && data.session_id) {
            setActiveChatId(data.session_id);
            fetchSessions().then(setChats).catch(console.error);
          }
        },
        onToken: (token) => {
          setIsTyping(false);
          accumulatedTokens += token;
          setStreamingContent(accumulatedTokens);
        },
        onDone: finalize,
        onError: (err) => {
          console.error('Streaming error:', err);
          setChatError(err || 'Failed to generate response');
          setStreamingContent(null);
          setIsStreaming(false);
          setIsTyping(false);
        },
      });
    },
    [selectedPersona, activeModel, isStreaming, activeChatId]
  );

  // Keyboard shortcuts (Ctrl+B to toggle sidebar, Ctrl+N for new chat, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTypingTag = ['INPUT', 'TEXTAREA'].includes(e.target?.tagName);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !isTypingTag) {
        e.preventDefault();
        handleNewChat();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setMemoryOpen(false);
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  return (
    <div id="app" className={sidebarOpen ? '' : 'sidebar-closed'}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMemory={() => setMemoryOpen(true)}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <ChatView
        chat={activeChat}
        messages={localMessages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        isTyping={isTyping}
        error={chatError}
        onSend={handleSend}
        onOpenSidebar={() => setSidebarOpen(true)}
        currentPersona={selectedPersona}
        personas={personas}
        onSelectPersona={handleSelectPersona}
      />

      <SettingsModal
        isOpen={settingsOpen}
        currentPersona={selectedPersona}
        installedModels={installedModels}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
        onClose={() => setSettingsOpen(false)}
      />

      <MemoryModal
        isOpen={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        currentPersona={selectedPersona}
      />
    </div>
  );
}
