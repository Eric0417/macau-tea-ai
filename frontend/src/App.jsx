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

/* ── 葡式瓷磚拉花背景 ──────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#040B18] via-[#060F22] to-[#040A14]">
      {/* SVG 拉花濾鏡 — 將圓形扭曲成有機流動形狀 */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="blob-marble">
            <feTurbulence type="turbulence" baseFrequency="0.012" numOctaves="4" result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="50" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="blob-marble-sm">
            <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="3" result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="35" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* 鈷藍花磚光暈 — 拉花大理石紋 */}
      <div className="absolute top-1/4 -left-32 w-[28rem] h-[28rem] bg-azulejo-600/20 rounded-full blur-3xl animate-pulse"
        style={{ filter: 'url(#blob-marble)', animationDelay: '0s' }} />
      <div className="absolute bottom-1/3 -right-32 w-[24rem] h-[24rem] bg-azulejo-500/15 rounded-full blur-3xl animate-pulse"
        style={{ filter: 'url(#blob-marble)', animationDelay: '2.5s' }} />

      {/* 奶油白拉花光暈 */}
      <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"
        style={{ filter: 'url(#blob-marble-sm)', animationDelay: '1.5s' }} />
      <div className="absolute -top-16 right-1/5 w-64 h-64 bg-azulejo-400/8 rounded-full blur-3xl animate-pulse"
        style={{ filter: 'url(#blob-marble-sm)', animationDelay: '3.5s' }} />

      {/* 金色點綴光暈 — 巴洛克金邊 */}
      <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-herbal-gold-500/8 rounded-full blur-3xl animate-pulse"
        style={{ filter: 'url(#blob-marble-sm)', animationDelay: '5s' }} />

      {/* 深層花磚藍 — 底部幽光 */}
      <div className="absolute top-2/3 left-2/3 w-48 h-48 bg-azulejo-700/18 rounded-full blur-3xl animate-pulse"
        style={{ filter: 'url(#blob-marble-sm)', animationDelay: '4s' }} />
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
