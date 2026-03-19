import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Leaf, Scan } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserId } from '../utils/userId';

export default function ResultPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/history/${id}?user_id=${getUserId()}`);
        const d = await r.json();
        if (!d.error) setRecord(d);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center pt-40"><div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /></div>
  );
  if (!record) return (
    <div className="text-center pt-32 px-5">
      <p className="text-white/40 mb-4">找不到紀錄</p>
      <button onClick={() => navigate('/history')} className="text-emerald-300 text-sm">返回歷史紀錄</button>
    </div>
  );

  const tea = record.type === 'tea';

  const items = tea
    ? [
        { l: '茶性', v: record.properties, e: '🍃' },
        { l: '功效', v: record.effects, e: '✨' },
        { l: '適合人群', v: record.suitable, e: '👍' },
        { l: '注意事項', v: record.avoid, e: '⚠️' },
        { l: '飲用建議', v: record.suggestion, e: '💡' },
      ]
    : [
        { l: '舌象', v: record.diagnosis, e: '👅' },
        { l: '詳細分析', v: record.detail, e: '🔍' },
        { l: '常見症狀', v: record.symptoms, e: '📋' },
        { l: '調理建議', v: record.recommendation, e: '💡' },
      ];

  return (
    <div className="px-5 pt-12 pb-8 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft size={18} /> 返回
        </button>

        {/* Header */}
        <div className="glass glass-card rounded-3xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tea ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
              {tea ? <Leaf size={24} className="text-emerald-300" /> : <Scan size={24} className="text-rose-300" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{tea ? record.name : record.constitution}</h1>
              <p className="text-white/40 text-xs">{new Date(record.created_at).toLocaleString('zh-TW')}</p>
            </div>
          </div>
          {tea && record.confidence && (
            <span className="inline-block bg-emerald-500/15 border border-emerald-400/20 rounded-full px-3 py-1 text-emerald-300 text-sm relative z-10">
              辨識信心度 {Math.round(record.confidence * 100)}%
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3">
          {items.map((d, i) => (
            <motion.div key={d.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
              className="glass glass-thin rounded-2xl p-4">
              <p className="text-white/80 font-medium text-sm mb-1 relative z-10">{d.e} {d.l}</p>
              <p className="text-white/55 text-sm leading-relaxed relative z-10">{d.v}</p>
            </motion.div>
          ))}

          {!tea && record.teas?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="glass glass-thin rounded-2xl p-4">
              <p className="text-white/80 font-medium text-sm mb-3 relative z-10">🍵 推薦茶飲</p>
              <div className="flex flex-wrap gap-2 relative z-10">
                {record.teas.map(t => (
                  <span key={t} className="bg-emerald-500/15 border border-emerald-400/20 rounded-full px-3 py-1.5 text-emerald-300 text-sm">{t}</span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}