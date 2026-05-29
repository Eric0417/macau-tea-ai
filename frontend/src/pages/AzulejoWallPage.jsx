import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AzulejoWall from '../components/AzulejoWall';

/** 花磚互動牆頁面 */
export default function AzulejoWallPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="px-4 pt-12 pb-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="glass glass-thin rounded-2xl p-2.5 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="relative z-10" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">花磚互動牆</h1>
            <p className="text-white/40 text-sm">Azulejo Interactive Wall</p>
          </div>
        </div>

        {/* 花磚牆 */}
        <AzulejoWall initialSize={4} showControls={true} />

      </motion.div>
    </div>
  );
}
