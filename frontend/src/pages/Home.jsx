import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Scan, MessageCircle, Clock, Sparkles, Grid3X3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    { path: '/tea',     icon: Leaf,           title: t('home.features.tea.title'),     desc: t('home.features.tea.desc'),     color: 'from-azulejo-500/25 to-azulejo-700/20', tile: 'azulejo-diamond' },
    { path: '/tongue',  icon: Scan,           title: t('home.features.tongue.title'),   desc: t('home.features.tongue.desc'),  color: 'from-cinnabar-500/20 to-cinnabar-700/20', tile: 'azulejo-circles' },
    { path: '/chat',    icon: MessageCircle,  title: t('home.features.chat.title'),     desc: t('home.features.chat.desc'),    color: 'from-azulejo-400/20 to-herbal-gold-500/20', tile: 'azulejo-cross' },
    { path: '/history', icon: Clock,          title: t('home.features.history.title'),  desc: t('home.features.history.desc'), color: 'from-herbal-gold-500/20 to-herbal-gold-700/20', tile: 'azulejo-star' },
  ];

  return (
    <div className="px-5 pt-16 pb-8 max-w-lg mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="text-center mb-10">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="glass glass-thin azulejo-circles inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6">
          <Sparkles size={16} className="text-azulejo-300 relative z-10" />
          <span className="text-sm text-white/80 relative z-10">{t('home.badge')}</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">{t('home.title')}</h1>
        <p className="text-white/50 text-lg leading-relaxed">{t('home.subtitle1')}<br />{t('home.subtitle2')}</p>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((f, i) => (
          <motion.button key={f.path}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            onClick={() => navigate(f.path)}
            className="glass glass-card rounded-3xl p-5 text-left active:scale-95">
            <div className={`absolute inset-0 bg-gradient-to-br ${f.color} ${f.tile} rounded-3xl pointer-events-none z-0`} />
            <div className="bg-white/12 rounded-2xl w-12 h-12 flex items-center justify-center mb-3 relative z-10">
              <f.icon size={24} className="text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1 relative z-10">{f.title}</h3>
            <p className="text-white/45 text-xs leading-relaxed relative z-10">{f.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* 花磚互動牆入口卡片 */}
      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        onClick={() => navigate('/wall')}
        className="w-full mt-3 glass glass-card rounded-3xl p-5 text-left active:scale-[0.98] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-azulejo-500/20 via-azulejo-400/10 to-herbal-gold-500/15 azulejo-circles rounded-3xl pointer-events-none z-0" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-azulejo-500/25 rounded-2xl w-12 h-12 flex items-center justify-center shrink-0">
            <Grid3X3 size={24} className="text-azulejo-200" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-0.5">花磚互動牆</h3>
            <p className="text-white/40 text-xs leading-relaxed">純 SVG 繪製 · 無縫拼接 · 懸停光澤 · 點擊旋轉</p>
          </div>
          <div className="ml-auto text-white/20 text-xl">→</div>
        </div>
      </motion.button>
    </div>
  );
}
