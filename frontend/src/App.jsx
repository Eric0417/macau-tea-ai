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

const LG_EASE = [0.2, 0.8, 0.2, 1];
const LG_DURATION = 0.24;

/* ── 白底藍花葡式瓷磚背景 ──────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* 白底 */}
      <div className="absolute inset-0 bg-[#FAF8F5]" />

      {/* 幾何菱格紋 — 青花瓷磚 pattern */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            conic-gradient(from 45deg at 50% 50%,
              transparent 0deg, transparent 87deg,
              rgba(74,123,200,0.35) 87deg, rgba(74,123,200,0.35) 93deg,
              transparent 93deg, transparent 180deg,
              rgba(74,123,200,0.35) 180deg, rgba(74,123,200,0.35) 186deg,
              transparent 186deg, transparent 270deg,
              rgba(74,123,200,0.35) 270deg, rgba(74,123,200,0.35) 276deg,
              transparent 276deg, transparent 360deg
            )
          `,
          backgroundSize: '56px 56px',
        }} />

      {/* 鈷藍釉面光暈 */}
      <div className="absolute top-1/4 -left-32 w-[22rem] h-[22rem] bg-azulejo-200/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 -right-24 w-[20rem] h-[20rem] bg-azulejo-100/40 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-azulejo-50/50 rounded-full blur-[80px]" />

      {/* 底部瓷白漸層 */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/50 to-transparent" />
    </div>
  );
}

/* ── 底部導航 — 白底藍花瓷磚 ──────────────── */
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
        <nav className="glass glass-r-xl mx-auto max-w-md p-1.5 flex justify-around shadow-lg shadow-azulejo-900/5">
          {tabs.map(t => {
            const active = pathname === t.path;
            return (
              <button key={t.path} onClick={() => navigate(t.path)}
                className={`relative z-10 flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-colors duration-200
                  ${active ? 'text-azulejo-700' : 'text-azulejo-400 hover:text-azulejo-500'}`}>
                {active && (
                  <motion.div layoutId="tab-bg"
                    className="absolute inset-0 bg-azulejo-100/80 rounded-2xl"
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
