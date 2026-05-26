import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Home as HomeIcon, Leaf, Scan, MessageCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Home from './pages/Home';
import TeaRecognition from './pages/TeaRecognition';
import TongueDiagnosis from './pages/TongueDiagnosis';
import AiConsultation from './pages/AiConsultation';
import History from './pages/History';
import ResultPage from './pages/ResultPage';
import LanguageSwitcher from './components/LanguageSwitcher';

/* ── Liquid Glass 動畫設定 ────────────── */
const LG_EASE = [0.2, 0.8, 0.2, 1];
const LG_DURATION = 0.24;

/* ── 葡式花磚 × 中式草藥 背景 ──────────── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#060E1A] via-[#0A1628] to-[#0D1117]">
      {/* Azulejo 藍色光暈 — 花磚之海 */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-azulejo-500/18 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-azulejo-400/12 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '2s' }} />
      {/* 草藥金色光暈 — 中藥之暖 */}
      <div className="absolute top-2/3 left-1/3 w-80 h-80 bg-herbal-gold-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '4s' }} />
      <div className="absolute -top-20 right-1/4 w-72 h-72 bg-azulejo-300/8 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }} />
      {/* 草藥青綠 — 茶韻 */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-herbal-sage-500/6 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '3s' }} />
    </div>
  );
}

/* ── 底部導航 ──────────────────────────── */
function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { path: '/',        icon: HomeIcon,       label: t('nav.home') },
    { path: '/tea',     icon: Leaf,           label: t('nav.tea') },
    { path: '/tongue',  icon: Scan,           label: t('nav.tongue') },
    { path: '/chat',    icon: MessageCircle,  label: t('nav.chat') },
    { path: '/history', icon: Clock,          label: t('nav.history') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-4">
      <LayoutGroup>
        <nav className="glass glass-r-xl azulejo-frame mx-auto max-w-md p-1.5 flex justify-around">
          {tabs.map(t => {
            const active = pathname === t.path;
            return (
              <button key={t.path} onClick={() => navigate(t.path)}
                className={`relative z-10 flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-colors duration-200
                  ${active ? 'text-white' : 'text-white/40 hover:text-white/60'}`}>
                {active && (
                  <motion.div layoutId="tab-bg"
                    className="absolute inset-0 bg-azulejo-500/25 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                )}
                <t.icon size={20} className="relative z-10" />
                <span className="text-xs relative z-10">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </LayoutGroup>
    </div>
  );
}

/* ── App ───────────────────────────────── */
function AppContent() {
  const location = useLocation();
  return (
    <div className="min-h-screen">
      <Background />
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname}
          initial={{ opacity: 0, y: 6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.99 }}
          transition={{ duration: LG_DURATION, ease: LG_EASE }}
          style={{ willChange: 'opacity, transform' }}
          className="pb-28 min-h-screen">
          <Routes location={location}>
            <Route path="/"        element={<Home />} />
            <Route path="/tea"     element={<TeaRecognition />} />
            <Route path="/tongue"  element={<TongueDiagnosis />} />
            <Route path="/chat"    element={<AiConsultation />} />
            <Route path="/history" element={<History />} />
            <Route path="/result/:id" element={<ResultPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
