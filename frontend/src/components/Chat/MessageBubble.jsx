import { useState } from 'react';
import { Bot, Copy, Check } from 'lucide-react';
import { renderMarkdown } from '../../utils/markdown';

// AI Avatar featuring persona accent or Lucide Bot Icon
function AiAvatar({ currentPersona }) {
  const accentColor = currentPersona?.accent_color || 'var(--clr-accent-1)';
  return (
    <div
      className="msg__avatar msg__avatar--ai"
      style={{
        background: 'var(--grad-accent-dim)',
        borderColor: accentColor,
      }}
    >
      <Bot size={16} style={{ color: 'var(--clr-accent-2)' }} />
    </div>
  );
}

function CopyButton({ content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="msg__actions">
      <button
        className={`btn-copy msg__copy-btn ${copied ? 'btn-copy--success' : ''}`}
        onClick={handleCopy}
        title="Copy message"
      >
        {copied ? (
          <>
            <Check size={13} />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={13} />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function MessageBubble({ role, content, isStreaming, currentPersona }) {
  if (role === 'user') {
    return (
      <div className="msg msg--user">
        <div className="msg__bubble msg__bubble--user">
          <div className="msg__text">
            {escapeHtml(content).split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < content.split('\n').length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>
        <div className="msg__avatar msg__avatar--user">You</div>
      </div>
    );
  }

  // AI message
  return (
    <div className="msg msg--ai">
      <AiAvatar currentPersona={currentPersona} />
      <div className="msg__bubble msg__bubble--ai">
        <div
          className="msg__text"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        {!isStreaming && content && <CopyButton content={content} />}
      </div>
    </div>
  );
}

export function TypingIndicator({ currentPersona }) {
  return (
    <div className="msg msg--ai msg--typing">
      <AiAvatar currentPersona={currentPersona} />
      <div className="msg__bubble">
        <div className="typing-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div className="msg msg--ai">
      <div className="msg__bubble" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}>
        <div className="msg__text" style={{ color: '#f87171' }}>
          ⚠️ {message}
        </div>
      </div>
    </div>
  );
}
