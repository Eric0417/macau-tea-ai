import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Home as HomeIcon, Leaf, Scan, MessageCircle, Clock } from 'lucide-react';

import Home from './pages/Home';
import TeaRecognition from './pages/TeaRecognition';
import TongueDiagnosis from './pages/TongueDiagnosis';
import AiConsultation from './pages/AiConsultation';
import History from './pages/History';
import ResultPage from './pages/ResultPage';

/* ── Liquid Glass 動畫設定 ────────────── */
const LG_EASE = [0.2, 0.8, 0.2, 1];
const LG_DURATION = 0.24;

/* ── 背景 ─────────────────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '2s' }} />
      <div className="absolute top-2/3 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '4s' }} />
      <div className="absolute -top-20 right-1/4 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }} />
    </div>
  );
}

/* ── 底部導航 ──────────────────────────── */
function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    { path: '/',        icon: HomeIcon,       label: '首頁' },
    { path: '/tea',     icon: Leaf,           label: '茶飲' },
    { path: '/tongue',  icon: Scan,           label: '舌診' },
    { path: '/chat',    icon: MessageCircle,  label: '問診' },
    { path: '/history', icon: Clock,          label: '歷史' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-4">
      <LayoutGroup>
        <nav className="glass glass-r-xl mx-auto max-w-md p-1.5 flex justify-around">
          {tabs.map(t => {
            const active = pathname === t.path;
            return (
              <button key={t.path} onClick={() => navigate(t.path)}
                className={`relative z-10 flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-colors duration-200
                  ${active ? 'text-white' : 'text-white/40 hover:text-white/60'}`}>
                {active && (
                  <motion.div layoutId="tab-bg"
                    className="absolute inset-0 bg-white/15 rounded-2xl"
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