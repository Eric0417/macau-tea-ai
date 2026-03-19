import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Scan, MessageCircle, Clock, Sparkles } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    { path: '/tea',     icon: Leaf,           title: '茶飲辨識', desc: 'AI 智能辨識茶飲種類與功效',      color: 'from-emerald-500/20 to-green-600/20' },
    { path: '/tongue',  icon: Scan,           title: '舌象分析', desc: 'AI 舌診體質辨識與茶飲建議',      color: 'from-rose-500/20 to-pink-600/20' },
    { path: '/chat',    icon: MessageCircle,  title: 'AI 問診',  desc: '與茶博士對話，諮詢養生建議',     color: 'from-blue-500/20 to-cyan-600/20' },
    { path: '/history', icon: Clock,          title: '歷史紀錄', desc: '查看過去的辨識與問診紀錄',       color: 'from-amber-500/20 to-orange-600/20' },
  ];

  return (
    <div className="px-5 pt-16 pb-8 max-w-lg mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="text-center mb-10">
        <div className="glass glass-thin inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6">
          <Sparkles size={16} className="text-emerald-300 relative z-10" />
          <span className="text-sm text-white/80 relative z-10">AI 智能養生助手</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">澳門茶飲 AI</h1>
        <p className="text-white/50 text-lg leading-relaxed">結合中醫智慧與人工智能<br />為您推薦最適合的茶飲</p>
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
            <div className="bg-white/15 rounded-2xl w-12 h-12 flex items-center justify-center mb-3 relative z-10">
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