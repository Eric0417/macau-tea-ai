import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Leaf, Scan, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserId } from '../utils/userId';

export default function History() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
            className="glass-btn glass-btn-ghost rounded-2xl p-2.5">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-azulejo-900">{t('history.title')}</h1>
        </div>
        {records.length > 0 && (
          <button onClick={clearAll}
            className="glass-btn glass-btn-cream glass-btn-sm rounded-2xl px-3 py-2 text-azulejo-600 text-xs hover:text-cinnabar-500">
            {t('history.clearAll')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center pt-24">
          <div className="w-8 h-8 border-2 border-azulejo-200 border-t-azulejo-500 rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center pt-24">
          <Clock size={48} className="text-azulejo-200 mx-auto mb-4" />
          <p className="text-azulejo-400">{t('history.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {records.map((r, i) => (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -80 }}
                transition={{ delay: i * 0.04 }}
                className="glass glass-thin rounded-2xl p-4 flex items-center gap-3 bg-white/70">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${r.type === 'tea' ? 'bg-azulejo-50' : 'bg-cinnabar-50'}`}>
                  {r.type === 'tea' ? <Leaf size={18} className="text-azulejo-600" /> : <Scan size={18} className="text-cinnabar-500" />}
                </div>
                <button onClick={() => navigate(`/result/${r.id}`)} className="flex-1 text-left min-w-0 relative z-10">
                  <p className="text-azulejo-900 font-medium text-sm truncate">{r.type === 'tea' ? r.name : r.constitution}</p>
                  <p className="text-azulejo-400 text-xs mt-0.5">{fmt(r.created_at)}</p>
                </button>
                <button onClick={() => del(r.id)} className="text-azulejo-300 hover:text-cinnabar-500 p-1"><Trash2 size={15} /></button>
                <ChevronRight size={15} className="text-azulejo-300" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
