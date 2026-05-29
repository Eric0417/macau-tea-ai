import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Scan, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserId } from '../utils/userId';

export default function TongueDiagnosis() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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
      fd.append('language', i18n.language);
      const res = await fetch('/api/tongue/diagnose', { method: 'POST', body: fd });
      const data = await res.json();
      data.error ? setError(data.error) : setResult(data);
    } catch { setError(t('tongue.error')); }
    finally { setLoading(false); }
  };

  const reset = () => { setPreview(null); setImage(null); setResult(null); };

  return (
    <div className="px-5 pt-12 pb-8 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')}
            className="glass glass-thin rounded-2xl p-2.5 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} className="relative z-10" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('tongue.title')}</h1>
            <p className="text-white/50 text-sm">{t('tongue.subtitle')}</p>
          </div>
        </div>

        {/* Upload / Preview */}
        {!preview ? (
          <div onClick={() => fileRef.current?.click()}
            className="glass azulejo-circles rounded-3xl p-12 text-center cursor-pointer border-2 border-dashed border-white/20 hover:border-white/30 transition-all">
            <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 relative z-10">
              <Camera size={28} className="text-white/60" />
            </div>
            <p className="text-white/60 mb-2 relative z-10">{t('tongue.upload')}</p>
            <p className="text-white/30 text-sm relative z-10">{t('tongue.tip')}</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden border border-white/20">
            <img src={preview} alt="" className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex gap-3 z-10">
              <button onClick={reset}
                className="flex-1 glass glass-thin rounded-2xl py-3 text-white text-sm font-medium">
                <span className="relative z-10">{t('tongue.retry')}</span>
              </button>
              <button onClick={analyze} disabled={loading}
                className="flex-1 glass glass-thin rounded-2xl py-3 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                <div className="absolute inset-0 bg-cinnabar-500/45 rounded-2xl pointer-events-none z-0" />
                {loading
                  ? <><Loader2 size={16} className="animate-spin relative z-10" /><span className="relative z-10">{t('tongue.analyzing')}</span></>
                  : <><Scan size={16} className="relative z-10" /><span className="relative z-10">{t('tongue.diagnose')}</span></>}
              </button>
            </div>
          </motion.div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 glass glass-thin rounded-2xl p-4">
              <div className="absolute inset-0 bg-red-500/20 rounded-2xl pointer-events-none z-0" />
              <p className="text-red-200 text-sm relative z-10">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
              <div className="glass glass-card azulejo-circles rounded-3xl p-6 azulejo-frame">
                <h2 className="text-2xl font-bold text-white mb-2 relative z-10">{result.constitution}</h2>
                <p className="text-white/60 text-sm relative z-10">{result.diagnosis}</p>
              </div>

              {[
                { label: t('tongue.analysis'), value: result.detail,          emoji: '🔍' },
                { label: t('tongue.symptoms'), value: result.symptoms,        emoji: '📋' },
                { label: t('tongue.advice'),   value: result.recommendation,  emoji: '💡' },
              ].map((d, i) => (
                <motion.div key={d.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                  className="glass glass-thin rounded-2xl p-4">
                  <p className="text-white/80 font-medium text-sm mb-1 relative z-10">{d.emoji} {d.label}</p>
                  <p className="text-white/55 text-sm leading-relaxed relative z-10">{d.value}</p>
                </motion.div>
              ))}

              {result.teas?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="glass glass-thin rounded-2xl p-4">
                  <p className="text-white/80 font-medium text-sm mb-3 relative z-10">{t('tongue.recommended')}</p>
                  <div className="flex flex-wrap gap-2 relative z-10">
                    {result.teas.map(t => (
                      <span key={t} className="bg-herbal-sage-500/15 border border-herbal-sage-400/20 rounded-full px-3 py-1.5 text-herbal-sage-300 text-sm">{t}</span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
