import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  currentPersona,
  installedModels = [],
  activeModel,
  onSelectModel,
  onClose,
}) {
  const [temperature, setTemperature] = useState(currentPersona?.temperature || 0.7);
  const [topP, setTopP] = useState(currentPersona?.top_p || 0.9);
  const [selectedModel, setSelectedModel] = useState(activeModel || 'llama3:8b');

  useEffect(() => {
    if (currentPersona) {
      setTemperature(currentPersona.temperature);
      setTopP(currentPersona.top_p);
      setSelectedModel(activeModel || currentPersona.model || 'llama3:8b');
    }
  }, [currentPersona, activeModel]);

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal"
      className="modal--open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target.id === 'settings-modal') onClose();
      }}
    >
      <div className="modal">
        <div className="modal__header">
          <h2
            className="modal__title"
            id="modal-title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Settings size={18} />
            <span>K.I.R.A Settings</span>
          </h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="modal__body">
          {/* Current Persona info */}
          <div className="field">
            <label className="field__label">Active Character</label>
            <input
              type="text"
              value={`${currentPersona?.display_name || 'K.I.R.A'} (${currentPersona?.role || ''})`}
              disabled
              style={{ opacity: 0.85 }}
            />
            <span className="field__sub">Switch characters anytime from the main screen dropdown.</span>
          </div>

          {/* Model info & Selector */}
          <div className="field">
            <label className="field__label">Ollama Model</label>
            <select
              value={selectedModel}
              onChange={(e) => {
                const newModel = e.target.value;
                setSelectedModel(newModel);
                onSelectModel?.(newModel);
              }}
            >
              {installedModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="field__sub">Runs locally via Ollama on your machine.</span>
          </div>

          {/* Temperature */}
          <div className="field">
            <label className="field__label">Temperature</label>
            <div className="slider-row">
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <span className="slider-value">{temperature.toFixed(2)}</span>
            </div>
            <span className="field__sub">Higher values make responses more creative; lower values make them more focused.</span>
          </div>

          {/* Top P */}
          <div className="field">
            <label className="field__label">Top P</label>
            <div className="slider-row">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
              />
              <span className="slider-value">{topP.toFixed(2)}</span>
            </div>
            <span className="field__sub">Nucleus sampling threshold.</span>
          </div>

          {/* Memory Namespace */}
          <div className="field">
            <label className="field__label">Memory Namespace</label>
            <input
              type="text"
              value={currentPersona?.memory_namespace || 'assistant_core'}
              disabled
              style={{ opacity: 0.8 }}
            />
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
