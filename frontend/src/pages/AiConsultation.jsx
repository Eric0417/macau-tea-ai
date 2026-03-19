import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserId } from '../utils/userId';

export default function AiConsultation() {
  const navigate = useNavigate();
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
      const r = await fetch('/api/chat', { method: 'POST', body: fd });
      const d = await r.json();
      setMessages(p => [...p, { role: 'assistant', content: d.reply }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: '抱歉，發生了錯誤 😞' }]);
    } finally { setLoading(false); }
  };

  const clear = async () => {
    try { await fetch(`/api/chat/history?user_id=${userId}`, { method: 'DELETE' }); } catch {}
    setMessages([]);
  };

  const quickQs = ['我容易上火，喝什麼茶好？', '普洱茶有什麼功效？', '晚上適合喝什麼茶？', '手腳冰冷怎麼調理？'];

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto">
      {/* Header */}
      <div className="shrink-0 px-5 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="glass glass-thin rounded-2xl p-2.5 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} className="relative z-10" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">AI 茶博士</h1>
            <p className="text-white/40 text-xs">您的養生茶飲顧問</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear}
            className="glass glass-thin rounded-2xl p-2.5 text-white/40 hover:text-red-300 transition-colors">
            <Trash2 size={18} className="relative z-10" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
        {messages.length === 0 && !loading && (
          <div className="text-center pt-20">
            <p className="text-5xl mb-4">🍵</p>
            <p className="text-white/40 text-sm mb-6">向茶博士提問任何茶飲和養生問題</p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickQs.map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="glass glass-thin rounded-2xl px-3 py-2 text-white/50 text-xs">
                  <span className="relative z-10">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed glass glass-thin ${
              m.role === 'user' ? 'text-white' : 'text-white/80'
            }`}>
              {m.role === 'user' && (
                <div className="absolute inset-0 bg-emerald-500/25 rounded-2xl pointer-events-none z-0" />
              )}
              <p className="whitespace-pre-wrap relative z-10">{m.content}</p>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass glass-thin rounded-2xl px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce relative z-10" />
              <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce relative z-10" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce relative z-10" style={{ animationDelay: '0.3s' }} />
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
            placeholder="輸入您的問題…"
            className="flex-1 glass glass-thin rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/40 transition-all relative z-10" />
          <button onClick={send} disabled={!input.trim() || loading}
            className="glass glass-thin rounded-2xl px-4 text-white disabled:opacity-30 transition-all">
            <div className="absolute inset-0 bg-emerald-500/50 rounded-2xl pointer-events-none z-0" />
            <Send size={18} className="relative z-10" />
          </button>
        </div>
      </div>
    </div>
  );
}