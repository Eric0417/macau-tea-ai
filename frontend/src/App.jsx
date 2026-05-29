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

/* ── Liquid Glass 動畫設定 ────────────── */
const LG_EASE = [0.2, 0.8, 0.2, 1];
const LG_DURATION = 0.24;

/* ── 幾何葡式瓷磚背景 ──────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#040B18] via-[#060F22] to-[#040A14]">
      {/* 幾何菱形格紋背景 — 規則葡式瓷磚花紋 */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            conic-gradient(from 45deg at 50% 50%,
              transparent 0deg, transparent 87deg,
              rgba(74,123,200,0.5) 87deg, rgba(74,123,200,0.5) 93deg,
              transparent 93deg, transparent 180deg,
              rgba(74,123,200,0.5) 180deg, rgba(74,123,200,0.5) 186deg,
              transparent 186deg, transparent 270deg,
              rgba(74,123,200,0.5) 270deg, rgba(74,123,200,0.5) 276deg,
              transparent 276deg, transparent 360deg
            )
          `,
          backgroundSize: '48px 48px',
        }} />

      {/* 深層鈷藍光暈 */}
      <div className="absolute top-1/3 -left-24 w-[26rem] h-[26rem] bg-azulejo-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-24 w-[22rem] h-[22rem] bg-azulejo-500/10 rounded-full blur-[120px]" />

      {/* 瓷白色光暈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/4 rounded-full blur-[100px]" />

      {/* 底部深藍描邊 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-azulejo-950/20 to-transparent" />
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
                    className="absolute inset-0 bg-azulejo-500/30 rounded-2xl"
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
