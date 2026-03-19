import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Leaf, Scan, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserId } from '../utils/userId';

export default function History() {
  const navigate = useNavigate();
  const userId = getUserId();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/history?user_id=${userId}`);
        setRecords(await r.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const del = async id => {
    try { await fetch(`/api/history/${id}?user_id=${userId}`, { method: 'DELETE' }); } catch {}
    setRecords(p => p.filter(r => r.id !== id));
  };

  const clearAll = async () => {
    try { await fetch(`/api/history?user_id=${userId}`, { method: 'DELETE' }); } catch {}
    setRecords([]);
  };

  const fmt = s => {
    const d = new Date(s);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="px-5 pt-12 pb-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="glass glass-thin rounded-2xl p-2.5 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} className="relative z-10" />
          </button>
          <h1 className="text-2xl font-bold text-white">歷史紀錄</h1>
        </div>
        {records.length > 0 && (
          <button onClick={clearAll}
            className="glass glass-thin rounded-2xl px-3 py-2 text-white/50 text-xs hover:text-red-300 transition-colors">
            <span className="relative z-10">清空全部</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center pt-24">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center pt-24">
          <Clock size={48} className="text-white/15 mx-auto mb-4" />
          <p className="text-white/30">還沒有任何紀錄</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {records.map((r, i) => (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -80 }}
                transition={{ delay: i * 0.04 }}
                className="glass glass-thin rounded-2xl p-4 flex items-center gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${r.type === 'tea' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                  {r.type === 'tea' ? <Leaf size={18} className="text-emerald-300" /> : <Scan size={18} className="text-rose-300" />}
                </div>
                <button onClick={() => navigate(`/result/${r.id}`)} className="flex-1 text-left min-w-0 relative z-10">
                  <p className="text-white font-medium text-sm truncate">{r.type === 'tea' ? r.name : r.constitution}</p>
                  <p className="text-white/35 text-xs mt-0.5">{fmt(r.created_at)}</p>
                </button>
                <button onClick={() => del(r.id)} className="text-white/15 hover:text-red-400 transition-colors p-1 relative z-10"><Trash2 size={15} /></button>
                <ChevronRight size={15} className="text-white/15 relative z-10" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}