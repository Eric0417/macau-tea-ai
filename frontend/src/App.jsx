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

      {/* 葡式拉花 SVG — 手繪青花瓷流線 */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
        viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
        fill="none" stroke="#4A7BC8" strokeWidth="2.5" strokeLinecap="round">

        {/* 左上角 — 大型螺旋拉花 */}
        <path d="M-20,80 C100,20 200,60 250,120 C300,180 280,260 220,300 C160,340 100,300 80,240 C60,180 90,130 140,120" />
        <path d="M-20,80 C100,20 200,60 250,120 C300,180 280,260 220,300" opacity="0.5" strokeWidth="1.5" />

        {/* 右上角 — 流線捲草紋 */}
        <path d="M1480,40 C1380,60 1320,120 1280,180 C1240,240 1220,320 1260,370 C1300,420 1360,400 1400,360 C1440,320 1460,280 1440,240" />
        <path d="M1480,40 C1380,60 1320,120 1280,180" opacity="0.5" strokeWidth="1.5" />

        {/* 左下角 — 雙層 S 形拉花 */}
        <path d="M-40,750 C60,700 120,680 180,720 C240,760 260,820 220,860 C180,900 120,920 60,880" />
        <path d="M40,780 C100,740 160,730 200,760 C240,790 250,830 220,860" opacity="0.4" strokeWidth="1.5" />

        {/* 右下角 — 渦旋花飾 */}
        <path d="M1480,600 C1400,580 1350,620 1320,670 C1290,720 1300,780 1350,810 C1400,840 1450,820 1470,780 C1490,740 1480,700 1440,680" />
        <path d="M1480,600 C1400,580 1350,620 1320,670 C1290,720 1300,780 1350,810" opacity="0.5" strokeWidth="1.5" />

        {/* 中左 — 垂直流動拉花 */}
        <path d="M60,300 C80,350 70,400 90,450 C110,500 100,550 120,600" strokeWidth="2" />
        <path d="M80,320 C95,370 85,410 105,460 C125,510 115,550 130,590" opacity="0.4" strokeWidth="1" />

        {/* 中右 — 水波紋拉花 */}
        <path d="M1380,200 C1340,230 1320,270 1340,310 C1360,350 1400,340 1420,300" strokeWidth="2" />
        <path d="M1350,220 C1320,245 1305,275 1320,310 C1335,345 1365,335 1380,305" opacity="0.4" strokeWidth="1" />

        {/* 上方中部 — 小藤蔓裝飾 */}
        <path d="M600,-10 C620,30 580,60 600,90 C620,120 590,140 610,170" strokeWidth="1.8" />
        <path d="M840,-10 C820,30 860,60 840,90 C820,120 850,140 830,170" strokeWidth="1.8" />

        {/* 底部中間 — 海浪邊飾 */}
        <path d="M300,920 C330,890 370,890 400,920 C430,950 470,950 500,920 C530,890 570,890 600,920 C630,950 670,950 700,920 C730,890 770,890 800,920 C830,950 870,950 900,920 C930,890 970,890 1000,920 C1030,950 1070,950 1100,920" strokeWidth="2" opacity="0.5" />
        <path d="M350,910 C380,885 420,885 450,910 C480,935 520,935 550,910 C580,885 620,885 650,910 C680,935 720,935 750,910 C780,885 820,885 850,910 C880,935 920,935 950,910" strokeWidth="1.2" opacity="0.3" />

        {/* 中心裝飾 — 較淡的橢圓流線 */}
        <ellipse cx="720" cy="450" rx="300" ry="200" strokeWidth="1.5" opacity="0.15" strokeDasharray="8 12" />
        <ellipse cx="720" cy="450" rx="240" ry="160" strokeWidth="1" opacity="0.10" strokeDasharray="4 8" />

        {/* 左上角小拉花 — 奶泡 swirl */}
        <circle cx="180" cy="60" r="30" strokeWidth="1.5" opacity="0.25" />
        <circle cx="180" cy="60" r="18" strokeWidth="1" opacity="0.20" />
        <path d="M160,45 C170,30 190,30 200,45" strokeWidth="1.5" opacity="0.20" />

        {/* 右下小圓花飾 */}
        <circle cx="1260" cy="840" r="25" strokeWidth="1.5" opacity="0.25" />
        <circle cx="1260" cy="840" r="15" strokeWidth="1" opacity="0.20" />
        <path d="M1245,828 C1255,818 1265,818 1275,828" strokeWidth="1.5" opacity="0.20" />
      </svg>

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
