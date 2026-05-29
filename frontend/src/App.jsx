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
import AzulejoWallPage from './pages/AzulejoWallPage';

/* ── Liquid Glass 動畫設定 ────────────── */
const LG_EASE = [0.2, 0.8, 0.2, 1];
const LG_DURATION = 0.24;

/* ── 葡式花磚背景 ────────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#040A18] via-[#060E22] to-[#040914]">
      {/* 方格花磚底紋 — 整齊排列的光點形成規律的磁磚網格 */}
      <div className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(74,123,200,0.5) 1px, transparent 1.5px),
            radial-gradient(circle at 0 0, rgba(74,123,200,0.3) 1.5px, transparent 2px),
            radial-gradient(circle at 100% 0, rgba(74,123,200,0.3) 1.5px, transparent 2px),
            radial-gradient(circle at 0 100%, rgba(74,123,200,0.3) 1.5px, transparent 2px),
            radial-gradient(circle at 100% 100%, rgba(74,123,200,0.3) 1.5px, transparent 2px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* 鈷藍光暈 — 規律分布的花磚色塊 */}
      <div className="absolute top-1/4 -left-28 w-80 h-80 bg-azulejo-600/12 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -right-28 w-72 h-72 bg-azulejo-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-herbal-gold-500/6 rounded-full blur-3xl" />
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
            <Route path="/wall" element={<AzulejoWallPage />} />
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
