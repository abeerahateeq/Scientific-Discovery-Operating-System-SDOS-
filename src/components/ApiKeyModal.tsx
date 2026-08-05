import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, Shield, X, RefreshCw, Eye, EyeOff, Cpu } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onKeyUpdated }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [mode, setMode] = useState<'default' | 'custom'>('default');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('user_gemini_api_key') || '';
      setApiKey(savedKey);
      setMode(savedKey ? 'custom' : 'default');
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (mode === 'default') {
      localStorage.removeItem('user_gemini_api_key');
      setStatusMessage({ text: 'Reverted to shared developer API key quota.', type: 'info' });
    } else {
      const trimmed = apiKey.trim();
      if (!trimmed) {
        setStatusMessage({ text: 'Please enter a valid Gemini API Key or select Default mode.', type: 'error' });
        return;
      }
      localStorage.setItem('user_gemini_api_key', trimmed);
      setStatusMessage({ text: 'Personal Gemini API key saved! Future requests will use your quota.', type: 'success' });
    }
    if (onKeyUpdated) onKeyUpdated();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKey('');
    setMode('default');
    setStatusMessage({ text: 'Personal key cleared. Restored shared developer key quota.', type: 'info' });
    if (onKeyUpdated) onKeyUpdated();
  };

  const handleTestKey = async () => {
    const keyToTest = mode === 'custom' ? apiKey.trim() : '';
    if (mode === 'custom' && !keyToTest) {
      setStatusMessage({ text: 'Enter a key before testing.', type: 'error' });
      return;
    }
    setIsTesting(true);
    setStatusMessage({ text: 'Testing Gemini API Key connection...', type: 'info' });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (keyToTest) {
        headers['x-user-gemini-key'] = keyToTest;
      }

      const res = await fetch('/api/guide/ask', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: 'Hello! Verify connection.',
          currentTab: 'settings'
        })
      });

      if (res.ok) {
        setStatusMessage({ 
          text: mode === 'custom' 
            ? 'Success! Your personal Gemini API key is active and functional.' 
            : 'Success! Shared developer API key is active.', 
          type: 'success' 
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusMessage({ 
          text: `Key test failed: ${data.error || res.statusText || 'Invalid API key or quota exceeded.'}`, 
          type: 'error' 
        });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Network error testing key: ${err.message}`, type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#12151C] border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 font-sans">Gemini API Key & Quota Settings</h3>
            <p className="text-xs text-slate-400">Manage user vs. developer API quota allocation</p>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="mb-5 p-3 rounded-lg bg-[#0A0C10] border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">Current Quota Mode:</span>
          {apiKey ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-mono font-semibold text-[11px] border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
              User Personal Key (User Quota)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 font-mono font-semibold text-[11px] border border-cyan-500/30">
              <Cpu className="w-3.5 h-3.5" />
              Shared Developer Key (Server Quota)
            </span>
          )}
        </div>

        {/* Selection Options */}
        <div className="space-y-3 mb-5">
          <label 
            onClick={() => setMode('default')}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              mode === 'default'
                ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-200'
                : 'bg-[#0F1218] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="keyMode"
              checked={mode === 'default'}
              onChange={() => setMode('default')}
              className="mt-1 text-cyan-500"
            />
            <div>
              <span className="font-semibold text-xs text-slate-200 block">Use Shared Developer Key (Default)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Uses the pre-configured environment key. Recommended for quick testing without using your own quota.
              </span>
            </div>
          </label>

          <label 
            onClick={() => setMode('custom')}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              mode === 'custom'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-200'
                : 'bg-[#0F1218] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="keyMode"
              checked={mode === 'custom'}
              onChange={() => setMode('custom')}
              className="mt-1 text-emerald-500"
            />
            <div className="w-full">
              <span className="font-semibold text-xs text-slate-200 block">Bring Your Own Key (User Quota)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Enter your Google AI Studio API key. All AI operations will be billed against your individual rate limits.
              </span>
            </div>
          </label>
        </div>

        {/* Input Field when Custom Mode selected */}
        {mode === 'custom' && (
          <div className="mb-5 space-y-2 animate-in fade-in duration-150">
            <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>Gemini API Key:</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-emerald-400 hover:underline text-[11px]"
              >
                Get API Key from Google AI Studio &rarr;
              </a>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#0A0C10] border border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Security & Privacy Callout */}
        <div className="mb-5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Privacy Note:</strong> Your API key is stored strictly in your browser&apos;s local storage and sent in encrypted request headers (`x-user-gemini-key`) directly to the backend proxy for API calls. It is never logged or written to disk.
          </span>
        </div>

        {/* Status Feedback Message */}
        {statusMessage && (
          <div className={`mb-4 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
            statusMessage.type === 'error' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' :
            'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
          }`}>
            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-mono"
              >
                Clear Saved Key
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-emerald-900/20"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
