import { useState, useEffect, useCallback } from 'react';
import { Brain, Plus } from 'lucide-react';
import { fetchMemories, addMemory } from '../../api/client';

export default function MemoryModal({ isOpen, onClose, currentPersona }) {
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState('user_core');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personaNamespace = currentPersona?.memory_namespace || 'assistant_core';

  const loadMemories = useCallback(async () => {
    try {
      const data = await fetchMemories(filter === 'all' ? null : filter);
      setMemories(data);
    } catch (e) {
      console.error('Error fetching memories:', e);
    }
  }, [filter]);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, loadMemories]);

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addMemory({
        namespace: filter === 'all' ? 'user_core' : filter,
        content: newContent.trim(),
        category: 'user_note',
      });
      setNewContent('');
      await loadMemories();
    } catch (err) {
      console.error('Failed to add memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal"
      className="modal--open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target.id === 'settings-modal') onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal__header">
          <h2
            className="modal__title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Brain size={18} style={{ color: 'var(--clr-accent-2)' }} />
            <span>K.I.R.A Memory Bank</span>
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 20px', borderBottom: '1px solid var(--clr-border)' }}>
          <button
            onClick={() => setFilter('user_core')}
            className={`btn-copy ${filter === 'user_core' ? 'btn-copy--success' : ''}`}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
          >
            Shared Core Memory
          </button>
          <button
            onClick={() => setFilter(personaNamespace)}
            className={`btn-copy ${filter === personaNamespace ? 'btn-copy--success' : ''}`}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
          >
            {currentPersona?.display_name || 'Persona'} Memory
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`btn-copy ${filter === 'all' ? 'btn-copy--success' : ''}`}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
          >
            All Entries
          </button>
        </div>

        {/* Memory List */}
        <div style={{ maxHeight: 300, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {memories.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--clr-text-3)', fontSize: 13, padding: 20 }}>
              No memories in this namespace yet. Add one below!
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'var(--clr-surface)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: 13,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--clr-text-3)' }}>
                  <span style={{ color: 'var(--clr-accent-2)', fontFamily: 'monospace' }}>{m.namespace}</span>
                  <span>{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
                <div>{m.content}</div>
              </div>
            ))
          )}
        </div>

        {/* Add Memory Form */}
        <form
          onSubmit={handleAddMemory}
          style={{
            display: 'flex',
            gap: 8,
            padding: '16px 20px',
            borderTop: '1px solid var(--clr-border)',
            background: 'var(--clr-surface)',
          }}
        >
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={`Add fact to ${filter === 'all' ? 'user_core' : filter}...`}
            style={{
              flex: 1,
              background: 'var(--clr-bg)',
              border: '1px solid var(--clr-border-2)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              color: 'var(--clr-text)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!newContent.trim() || isSubmitting}
            className="new-chat-btn"
            style={{ width: 'auto', margin: 0, padding: '8px 16px', gap: 4 }}
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </form>
      </div>
    </div>
  );
}
