import { useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';

export default function ChatInput({ onSend, disabled, placeholder }) {
  const inputRef = useRef(null);

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [autoResize]);

  // Refocus input whenever it gets re-enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (disabled) return;
    const content = inputRef.current?.value?.trim();
    if (!content) return;
    onSend(content);
    if (inputRef.current) {
      inputRef.current.value = '';
      autoResize();
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) {
        handleSend();
      }
    }
  };

  return (
    <div id="input-area">
      <div className="input-wrapper">
        <textarea
          ref={inputRef}
          id="chat-input"
          placeholder={placeholder || 'Reply to K.I.R.A...'}
          rows={1}
          aria-label="Chat input"
          autoComplete="off"
          spellCheck="true"
          onInput={autoResize}
          onKeyDown={handleKeyDown}
        />

        <div className="input-wrapper__bottom-row">
          <div className="input-wrapper__actions-left">
            <button
              type="button"
              className="input-action-btn"
              title="Attach files (decorative)"
            >
              <Paperclip size={16} />
            </button>
          </div>

          <button
            id="send-btn"
            aria-label="Send message"
            title="Send (Enter)"
            disabled={disabled}
            className={disabled ? 'send-btn--loading' : ''}
            onClick={handleSend}
          >
            {disabled ? (
              <div className="spinner" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>
      <p className="input-hint">K.I.R.A runs 100% locally on your hardware. Verify important info.</p>
    </div>
  );
}
