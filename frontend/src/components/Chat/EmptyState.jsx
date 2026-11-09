import { Lightbulb, Code, Sparkles, Brain } from 'lucide-react';

const SUGGESTIONS = [
  { Icon: Code, text: 'Help me debug or write high-performance Python code' },
  { Icon: Lightbulb, text: 'Explain how vector memory and full-text search work' },
  { Icon: Brain, text: 'What do you remember about my stack and preferences?' },
  { Icon: Sparkles, text: 'Brainstorm ideas for optimizing my local AI workflow' },
];

export default function EmptyState({ onSendPrompt, currentPersona }) {
  const name = currentPersona?.display_name || 'K.I.R.A';
  const role = currentPersona?.role || 'Intelligent AI Assistant';

  return (
    <div className="empty-state">
      <div className="empty-state__logo">
        <img src="/logo.svg" alt="KIRA logo" width="64" height="64" />
      </div>
      <h2 className="empty-state__title">How can {name} help you today?</h2>
      <p className="empty-state__sub">{role}. Type a message below or choose a prompt to get started.</p>
      <div className="empty-state__prompts">
        {SUGGESTIONS.map((prompt) => {
          const PromptIcon = prompt.Icon;
          return (
            <button
              key={prompt.text}
              className="prompt-card"
              onClick={() => onSendPrompt(prompt.text)}
            >
              <span className="prompt-card__icon" style={{ display: 'flex', color: 'var(--clr-accent-2)' }}>
                <PromptIcon size={16} />
              </span>
              <span className="prompt-card__text">{prompt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
