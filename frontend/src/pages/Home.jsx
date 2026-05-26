import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Scan, MessageCircle, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    { path: '/tea',     icon: Leaf,           title: t('home.features.tea.title'),     desc: t('home.features.tea.desc'),     color: 'from-azulejo-500/20 to-herbal-sage-600/20' },
    { path: '/tongue',  icon: Scan,           title: t('home.features.tongue.title'),   desc: t('home.features.tongue.desc'),  color: 'from-cinnabar-500/20 to-cinnabar-700/20' },
    { path: '/chat',    icon: MessageCircle,  title: t('home.features.chat.title'),     desc: t('home.features.chat.desc'),    color: 'from-azulejo-400/20 to-herbal-gold-500/20' },
    { path: '/history', icon: Clock,          title: t('home.features.history.title'),  desc: t('home.features.history.desc'), color: 'from-herbal-gold-500/20 to-herbal-gold-700/20' },
  ];

  return (
    <div className="px-5 pt-16 pb-8 max-w-lg mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="text-center mb-10">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="glass glass-thin inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6">
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
            {/* 色彩漸層底層 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${f.color} rounded-3xl pointer-events-none z-0`} />
            <div className="bg-white/12 rounded-2xl w-12 h-12 flex items-center justify-center mb-3 relative z-10">
              <f.icon size={24} className="text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1 relative z-10">{f.title}</h3>
            <p className="text-white/45 text-xs leading-relaxed relative z-10">{f.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
