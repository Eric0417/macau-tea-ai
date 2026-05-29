import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Grid3X3, Shuffle } from 'lucide-react';
import '../styles/azulejo-wall.css';

/* ═══════════════════════════════════════════════════════════
   花磚互動牆 Azulejo Interactive Wall
   葡式花磚 × React CSS Grid × 純 SVG 繪製
   ═══════════════════════════════════════════════════════════ */

/* ── 四種花磚圖案定義 ── */
const PATTERNS = [
  { id: 'circles',  label: '環環相扣' },
  { id: 'diamond',  label: '菱格花紋' },
  { id: 'star',     label: '星芒萬花' },
  { id: 'vine',     label: '藤蔓卷草' },
];

/* ── 預設顏色主題 ── */
const DEFAULT_COLORS = {
  blue:   '#0055A5',
  sky:    '#8EBAE5',
  cream:  '#FDFBF7',
  gold:   '#F4C430',
};

/**
 * 生成隨機花磚陣列
 * 返回 size×size 的二維陣列，每格包含 patternId 與旋轉角度
 */
function generateTiles(size, patternIds) {
  const tiles = [];
  for (let row = 0; row < size; row++) {
    tiles.push([]);
    for (let col = 0; col < size; col++) {
      tiles[row].push({
        id:    `${row}-${col}`,
        pattern: patternIds[Math.floor(Math.random() * patternIds.length)],
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
      });
    }
  }
  return tiles;
}

/* ═══════════════════════════════════════════════════════════
   單一花磚組件
   ═══════════════════════════════════════════════════════════ */
function Tile({ tile, colors, onClick }) {
  const [rotated, setRotated] = useState(false);

  const handleClick = () => {
    setRotated(r => !r);
    if (onClick) onClick(tile.id);
  };

  return (
    <div
      className={`az-tile ${rotated ? 'rotated' : ''}`}
      onClick={handleClick}
      title={`${PATTERNS.find(p => p.id === tile.pattern)?.label || tile.pattern} — 點擊旋轉`}
      style={{
        /* 傳遞主題色到 CSS 變數 */
        '--tile-blue':  colors.blue,
        '--tile-sky':   colors.sky,
        '--tile-cream': colors.cream,
        '--tile-gold':  colors.gold,
      }}
    >
      {/* 花磚圖案層 — SVG 純向量背景 */}
      <div
        className={`az-tile-bg az-pattern-${tile.pattern}`}
        style={{ transform: `rotate(${tile.rotation}deg)` }}
      />

      {/* 陶瓷釉面層 — 高光 + 微暗 + 冰裂紋質感 */}
      <div className="az-glaze" />

      {/* 光澤流動層 — hover 時的光澤掃過 */}
      <div className="az-shine" />

      {/* 旋轉角度標記 */}
      {tile.rotation > 0 && (
        <span className="absolute top-1.5 right-1.5 z-10 text-[10px] text-white/40 font-mono">
          {tile.rotation}°
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   花磚互動牆主組件
   ═══════════════════════════════════════════════════════════ */
export default function AzulejoWall({
  initialSize   = 4,       // 網格尺寸 (4 → 4×4, 6 → 6×6)
  patternIds    = ['circles', 'diamond', 'star', 'vine'],
  colors        = DEFAULT_COLORS,
  showControls  = true,    // 是否顯示控制面板
}) {
  const [size, setSize] = useState(initialSize);
  const [tiles, setTiles] = useState(() => generateTiles(initialSize, patternIds));

  /* ── 隨機重新生成花磚牆 ── */
  const reshuffle = useCallback(() => {
    setTiles(generateTiles(size, patternIds));
  }, [size, patternIds]);

  /* ── 切換網格尺寸 ── */
  const toggleSize = useCallback(() => {
    const newSize = size === 4 ? 6 : 4;
    setSize(newSize);
    setTiles(generateTiles(newSize, patternIds));
  }, [size, patternIds]);

  /* ── 全部復位 (移除旋轉) ── */
  const resetAll = useCallback(() => {
    setTiles(prev => prev.map(row =>
      row.map(tile => ({ ...tile, rotation: 0 }))
    ));
  }, []);

  /* ── 點擊花磚時記錄 ── */
  const handleTileClick = (tileId) => {
    // 可在這裡擴展：儲存組合、解鎖成就等
    console.log(`Tile clicked: ${tileId}`);
  };

  const gridCols = { gridTemplateColumns: `repeat(${size}, 1fr)` };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── 控制面板 ── */}
      {showControls && (
        <div className="az-controls mb-6 px-4">
          <button
            onClick={reshuffle}
            className="glass glass-thin rounded-xl px-4 py-2 flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            <Shuffle size={16} className="relative z-10" />
            <span className="relative z-10">隨機排列</span>
          </button>

          <button
            onClick={toggleSize}
            className="glass glass-thin rounded-xl px-4 py-2 flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            <Grid3X3 size={16} className="relative z-10" />
            <span className="relative z-10">{size}×{size}</span>
          </button>

          <button
            onClick={resetAll}
            className="glass glass-thin rounded-xl px-4 py-2 flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            <RotateCcw size={16} className="relative z-10" />
            <span className="relative z-10">全部復位</span>
          </button>

          {/* 圖案圖例 */}
          <div className="hidden sm:flex items-center gap-3 ml-2">
            {PATTERNS.map(p => (
              <div key={p.id} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded-sm az-pattern-${p.id}`}
                  style={{
                    backgroundImage: `var(--az-pattern-${p.id})`,
                    backgroundSize: '100% 100%',
                  }}
                />
                <span className="text-white/35 text-xs">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 花磚牆網格 ── */}
      <motion.div
        className="az-wall rounded-2xl overflow-hidden border border-white/10"
        style={gridCols}
        layout
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {tiles.flat().map(tile => (
          <Tile
            key={tile.id}
            tile={tile}
            colors={colors}
            onClick={handleTileClick}
          />
        ))}
      </motion.div>

      {/* 底部提示 */}
      <p className="text-center text-white/25 text-xs mt-4">
        點擊花磚旋轉 90° · 懸停查看光澤特效 · 所有圖案皆純 SVG/CSS 繪製可無限放大
      </p>
    </div>
  );
}

export { PATTERNS, DEFAULT_COLORS, generateTiles };
