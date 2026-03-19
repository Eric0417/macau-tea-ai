import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Leaf, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserId } from '../utils/userId';

export default function TeaRecognition() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const pick = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImage(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(null);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', image);
      fd.append('user_id', getUserId());
      const res = await fetch('/api/tea/recognize', { method: 'POST', body: fd });
      const data = await res.json();
      data.error ? setError(data.error) : setResult(data);
    } catch { setError('分析失敗，請重試'); }
    finally { setLoading(false); }
  };

  const reset = () => { setPreview(null); setImage(null); setResult(null); };

  const details = result ? [
    { label: '功效',   value: result.effects,    emoji: '✨' },
    { label: '適合人群', value: result.suitable,   emoji: '👍' },
    { label: '注意事項', value: result.avoid,      emoji: '⚠️' },
    { label: '飲用建議', value: result.suggestion, emoji: '💡' },
  ] : [];

  return (
    <div className="px-5 pt-12 pb-8 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-2.5 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">茶飲辨識</h1>
            <p className="text-white/50 text-sm">拍照或上傳茶飲照片</p>
          </div>
        </div>

        {/* Upload / Preview */}
        {!preview ? (
          <div onClick={() => fileRef.current?.click()}
            className="bg-white/5 backdrop-blur-xl border-2 border-dashed border-white/20 rounded-3xl p-12 text-center cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all">
            <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Camera size={28} className="text-white/60" />
            </div>
            <p className="text-white/60 mb-2">點擊上傳茶飲照片</p>
            <p className="text-white/30 text-sm">支援 JPG、PNG 格式</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden border border-white/20">
            <img src={preview} alt="" className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
              <button onClick={reset}
                className="flex-1 bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl py-3 text-white text-sm font-medium hover:bg-white/30 transition-all">
                重新選擇
              </button>
              <button onClick={analyze} disabled={loading}
                className="flex-1 bg-emerald-500/70 backdrop-blur-lg border border-emerald-400/30 rounded-2xl py-3 text-white text-sm font-medium hover:bg-emerald-500/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={16} className="animate-spin" />分析中...</> : <><Leaf size={16} />AI 分析</>}
              </button>
            </div>
          </motion.div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 bg-red-500/20 backdrop-blur-lg border border-red-400/30 rounded-2xl p-4 text-red-200 text-sm">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                  <span className="bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1 text-emerald-300 text-sm font-medium">
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <p className="text-white/60 text-sm">{result.properties}</p>
              </div>
              {details.map((d, i) => (
                <motion.div key={d.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <p className="text-white/80 font-medium text-sm mb-1">{d.emoji} {d.label}</p>
                  <p className="text-white/55 text-sm leading-relaxed">{d.value}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}