import { useRef, useEffect, useState } from 'react';
import { Menu, ChevronDown, Check, Sparkles, Compass, MessageCircleHeart, Flame, Bot } from 'lucide-react';
import MessageBubble, { TypingIndicator, ErrorMessage } from './MessageBubble';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';

// Cheerful icons and color badges per persona
const PERSONA_BADGES = {
  assistant: {
    icon: Sparkles,
    badgeText: 'Intelligent',
    gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    glow: 'rgba(59, 130, 246, 0.4)',
    tag: '⚡ Pro Assistant',
  },
  mentor: {
    icon: Compass,
    badgeText: 'Coach',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    glow: 'rgba(16, 185, 129, 0.4)',
    tag: '🎯 Career & DSA',
  },
  friend: {
    icon: Flame,
    badgeText: 'Banter',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    glow: 'rgba(245, 158, 11, 0.4)',
    tag: '☕ Casual Vibes',
  },
  companion: {
    icon: MessageCircleHeart,
    badgeText: 'Empathetic',
    gradient: 'linear-gradient(135deg, #ec4899, #d946ef)',
    glow: 'rgba(236, 72, 153, 0.4)',
    tag: '💖 Warm Companion',
  },
};

export default function ChatView({
  chat,
  messages,
  streamingContent,
  isStreaming,
  isTyping,
  error,
  onSend,
  onOpenSidebar,
  currentPersona,
  personas = [],
  onSelectPersona,
}) {
  const feedRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, streamingContent, isTyping]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const currentBadge = PERSONA_BADGES[currentPersona?.id] || {
    icon: Bot,
    badgeText: 'Persona',
    gradient: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
    glow: 'rgba(124, 58, 237, 0.4)',
    tag: 'AI',
  };
  const CurrentIcon = currentBadge.icon;

  const handleSelectCharacter = (persona, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onSelectPersona) {
      onSelectPersona(persona);
    }
    setDropdownOpen(false);
  };

  return (
    <main id="main" role="main">
      {/* Chat Header */}
      <header id="chat-header" style={{ position: 'relative', zIndex: 50 }}>
        <button id="mobile-sidebar-btn" aria-label="Open sidebar" onClick={onOpenSidebar}>
          <Menu size={20} />
        </button>
        <span id="chat-title">{chat?.title || currentPersona?.display_name || 'K.I.R.A'}</span>

        {/* Cheerful Character Selection Dropdown (Replacing Model Selector) */}
        <div
          className="model-selector-container"
          ref={dropdownRef}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 60 }}
        >
          {/* Main screen Character Selector Button with Cheerful Avatar & Badge */}
          <button
            type="button"
            className="model-selector-btn"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((prev) => !prev);
            }}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            style={{
              padding: '5px 14px 5px 8px',
              gap: '8px',
              border: `1px solid ${currentPersona?.accent_color || 'rgba(124, 58, 237, 0.35)'}66`,
              boxShadow: `0 0 14px ${currentBadge.glow}`,
            }}
          >
            {/* Cheerful Animated Icon Avatar */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: currentBadge.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: `0 2px 8px ${currentBadge.glow}`,
                flexShrink: 0,
              }}
            >
              <CurrentIcon size={12} />
            </div>

            <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>
              {currentPersona?.display_name || 'K.I.R.A'}
            </span>

            <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
          </button>

          {/* Character Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="model-selector-menu"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 280,
                maxHeight: '75vh',
                overflowY: 'auto',
                zIndex: 999,
                padding: '6px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--clr-border-2)',
                background: 'var(--clr-bg-2)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              }}
            >
              <div
                style={{
                  padding: '8px 12px 6px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--clr-text-3)',
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={12} style={{ color: 'var(--clr-accent-2)' }} />
                <span>Choose Character</span>
              </div>

              {personas.map((p) => {
                const isActive = p.id === currentPersona?.id;
                const badge = PERSONA_BADGES[p.id] || {
                  icon: Bot,
                  gradient: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  glow: 'rgba(124, 58, 237, 0.4)',
                  tag: 'AI',
                };
                const IconComponent = badge.icon;

                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`model-selector-item ${isActive ? 'model-selector-item--active' : ''}`}
                    onMouseDown={(e) => handleSelectCharacter(p, e)}
                    onClick={(e) => handleSelectCharacter(p, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 3,
                      transition: 'all var(--t-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, pointerEvents: 'none' }}>
                      {/* Character avatar badge */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: badge.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          flexShrink: 0,
                          boxShadow: `0 2px 10px ${badge.glow}`,
                        }}
                      >
                        <IconComponent size={15} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.display_name}</span>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: `${p.accent_color || '#3b82f6'}22`,
                              color: p.accent_color || '#3b82f6',
                              fontWeight: 600,
                            }}
                          >
                            {badge.tag}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--clr-text-3)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: 1,
                          }}
                        >
                          {p.role}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <Check
                        size={15}
                        style={{ color: p.accent_color || 'var(--clr-accent-2)', flexShrink: 0, marginLeft: 6, pointerEvents: 'none' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Server Status Badge */}
          <span
            className="server-status-badge server-status-badge--ready"
            title="Local Ollama Inference"
          >
            online
          </span>
        </div>
      </header>

      {/* Message Feed */}
      <div id="chat-feed" ref={feedRef} role="log" aria-live="polite" aria-label="Chat messages" style={{ position: 'relative', zIndex: 1 }}>
        {(!messages || messages.length === 0) && !streamingContent ? (
          <EmptyState onSendPrompt={onSend} currentPersona={currentPersona} />
        ) : (
          <>
            {messages.map((msg, i) => {
              if (msg.role === 'system') return null;
              return (
                <MessageBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  currentPersona={currentPersona}
                />
              );
            })}

            {/* Streaming AI response */}
            {streamingContent !== null && (
              <MessageBubble
                role="assistant"
                content={streamingContent}
                isStreaming
                currentPersona={currentPersona}
              />
            )}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator currentPersona={currentPersona} />}

            {/* Error message */}
            {error && <ErrorMessage message={error} />}
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        disabled={isStreaming}
        placeholder={`Message ${currentPersona?.display_name || 'K.I.R.A'}...`}
      />
    </main>
  );
}
