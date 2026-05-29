import { useState, useCallback } from 'react';
import { RotateCcw, Grid3X3, Shuffle } from 'lucide-react';
import '../styles/azulejo-wall.css';

/* ═══════════════════════════════════════════════════════════
   花磚互動牆 Azulejo Interactive Wall
   葡式花磚 × React CSS Grid × 純 SVG 繪製
   ═══════════════════════════════════════════════════════════ */

const PATTERNS = [
  { id: 'circles',  label: '環環相扣' },
  { id: 'diamond',  label: '菱格花紋' },
  { id: 'star',     label: '星芒萬花' },
  { id: 'vine',     label: '藤蔓卷草' },
];

/**
 * 生成 size×size 的二維花磚陣列
 * 每格包含 patternId 與初始旋轉角度
 */
function generateTiles(size, patternIds) {
  const tiles = [];
  for (let row = 0; row < size; row++) {
    const rowTiles = [];
    for (let col = 0; col < size; col++) {
      rowTiles.push({
        id:       `${row}-${col}`,
        pattern:  patternIds[Math.floor(Math.random() * patternIds.length)],
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
      });
    }
    tiles.push(rowTiles);
  }
  return tiles;
}

/* ═══════════════════════════════════════════════════════════
   單一花磚
   所有狀態由父層管理，確保旋轉同步
   ═══════════════════════════════════════════════════════════ */
function Tile({ tile, onRotate }) {
  const patternLabel = PATTERNS.find(p => p.id === tile.pattern)?.label || tile.pattern;

  return (
    <div
      className="az-tile"
      onClick={() => onRotate(tile.id)}
      title={`${patternLabel} — 目前 ${tile.rotation}°，點擊旋轉`}
    >
      {/* 圖案層 — inline transform 由父層 state 控制 */}
      <div
        className={`az-tile-bg az-pattern-${tile.pattern}`}
        style={{ transform: `rotate(${tile.rotation}deg)` }}
      />

      {/* 陶瓷釉面 */}
      <div className="az-glaze" />

      {/* 光澤流動層 */}
      <div className="az-shine" />

      {/* 旋轉角度標記 */}
      {tile.rotation > 0 && (
        <span className="absolute top-1.5 right-1.5 z-10 text-[10px] text-white/35 font-mono">
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
  initialSize   = 4,
  patternIds    = ['circles', 'diamond', 'star', 'vine'],
  showControls  = true,
}) {
  const [size, setSize] = useState(initialSize);
  const [tiles, setTiles] = useState(() => generateTiles(initialSize, patternIds));

  /* ── 旋轉單一花磚（+90°）── */
  const rotateTile = useCallback((tileId) => {
    setTiles(prev => prev.map(row =>
      row.map(t =>
        t.id === tileId
          ? { ...t, rotation: (t.rotation + 90) % 360 }
          : t
      )
    ));
  }, []);

  /* ── 隨機重新生成 ── */
  const reshuffle = useCallback(() => {
    setTiles(generateTiles(size, patternIds));
  }, [size, patternIds]);

  /* ── 切換網格尺寸 ── */
  const toggleSize = useCallback(() => {
    const newSize = size === 4 ? 6 : 4;
    setSize(newSize);
    setTiles(generateTiles(newSize, patternIds));
  }, [size, patternIds]);

  /* ── 全部復位（歸零所有旋轉）── */
  const resetAll = useCallback(() => {
    setTiles(prev => prev.map(row =>
      row.map(t => ({ ...t, rotation: 0 }))
    ));
  }, []);

  const flatTiles = tiles.flat();

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
        </div>
      )}

      {/* ── 花磚牆網格 ── */}
      <div
        className="az-wall rounded-2xl overflow-hidden border border-white/10"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {flatTiles.map(tile => (
          <Tile
            key={tile.id}
            tile={tile}
            onRotate={rotateTile}
          />
        ))}
      </div>

      {/* 底部提示 */}
      <p className="text-center text-white/25 text-xs mt-4">
        點擊花磚旋轉 90° · 懸停查看光澤特效 · 使用純 SVG 繪製可無限放大
      </p>
    </div>
  );
}

export { PATTERNS, generateTiles };
