import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserId } from '../utils/userId';

export default function AiConsultation() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const userId = getUserId();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/chat/history?user_id=${userId}`);
        setMessages(await r.json());
      } catch {}
    })();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(p => [...p, { role: 'user', content: text }]);
    setInput(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('message', text);
      fd.append('user_id', userId);
      fd.append('language', i18n.language);
      const r = await fetch('/api/chat', { method: 'POST', body: fd });
      const d = await r.json();
      setMessages(p => [...p, { role: 'assistant', content: d.reply }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: t('chat.error') }]);
    } finally { setLoading(false); }
  };

  const clear = async () => {
    try { await fetch(`/api/chat/history?user_id=${userId}`, { method: 'DELETE' }); } catch {}
    setMessages([]);
  };

  const quickQs = [t('chat.q1'), t('chat.q2'), t('chat.q3'), t('chat.q4')];

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto">
      {/* Header */}
      <div className="shrink-0 px-5 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="glass-btn glass-btn-ghost rounded-2xl p-2.5">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-azulejo-900">{t('chat.title')}</h1>
            <p className="text-azulejo-500 text-xs">{t('chat.subtitle')}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear}
            className="glass-btn glass-btn-ghost rounded-2xl p-2.5 text-azulejo-400 hover:text-cinnabar-500">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
        {messages.length === 0 && !loading && (
          <div className="text-center pt-20">
            <p className="text-5xl mb-4">🍵</p>
            <p className="text-azulejo-500 text-sm mb-6">{t('chat.empty')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickQs.map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="glass-btn glass-btn-cream glass-btn-sm rounded-2xl px-3 py-2 text-azulejo-600 text-xs">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs text-sm leading-relaxed ${
              m.role === 'user' ? 'glass-bubble glass-bubble-user' : 'glass-bubble glass-bubble-ai'
            }`}>
              <p className="whitespace-pre-wrap relative z-10">{m.content}</p>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass-bubble glass-bubble-ai flex gap-1.5">
              <span className="w-2 h-2 bg-azulejo-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-azulejo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 bg-azulejo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 pb-28">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={t('chat.placeholder')}
            className="flex-1 glass-input rounded-2xl px-4 py-3 text-sm" />
          <button onClick={send} disabled={!input.trim() || loading}
            className="glass-btn glass-btn-azulejo rounded-2xl px-4 disabled:opacity-30">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
