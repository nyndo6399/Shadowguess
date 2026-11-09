/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Classroom, GameItem } from '../types/game';
import { Volume2, Settings, RotateCcw, Sparkles, Wand2, Shuffle, Eye, EyeOff } from 'lucide-react';
import { soundEngine, speakWord } from '../utils/audio';
import { generateSolidSilhouette } from '../utils/imageProcessing';
import confetti from 'canvas-confetti';

// Cute animated Paintbrush matching image_f78a4823.png with pink handle, golden ferrule and purple wet paint tip
const PaintBrushIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Soft brush drop shadow */}
    <ellipse cx="44" cy="54" rx="22" ry="7" fill="rgba(0,0,0,0.25)" filter="blur(3px)" />

    {/* Pink Rounded Ergonomic Handle (exactly like image_f78a4823.png) */}
    <path
      d="M45 42 C52 52 58 66 52 72 C48 76 40 75 35 69 C30 62 36 49 41 42 Z"
      fill="#f472b6"
      stroke="#db2777"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Handle Shine Highlight */}
    <path
      d="M39 67 C36 62 39 53 42 47"
      stroke="#fbcfe8"
      strokeWidth="2.2"
      strokeLinecap="round"
    />

    {/* Golden Double Ferrule Ring */}
    <rect
      x="37"
      y="34"
      width="15"
      height="8"
      rx="2"
      fill="#fbbf24"
      stroke="#d97706"
      strokeWidth="1.6"
      transform="rotate(-15 44.5 38)"
    />
    <line
      x1="39"
      y1="38"
      x2="50"
      y2="35"
      stroke="#fef08a"
      strokeWidth="1.2"
    />

    {/* White Bristles */}
    <path
      d="M42 33 C40 25 44 18 50 12 C57 16 58 24 54 30 Z"
      fill="#ffffff"
      stroke="#cbd5e1"
      strokeWidth="1.6"
    />

    {/* Wet Paint Tip (Purple/Lilac matching image_f78a4823.png) */}
    <path
      d="M45 22 C46 17 48 14 50 12 C52 14 55 18 54 22 C52 24 47 24 45 22 Z"
      fill="#c084fc"
      stroke="#9333ea"
      strokeWidth="1.4"
    />
    <circle cx="49" cy="15" r="1.2" fill="#ffffff" />
  </svg>
);

interface PaintingState {
  itemId: string;
  progress: number; // 0 to 100
}

interface GameCanvasProps {
  classroom: Classroom;
  isEditMode: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateItemPosition: (id: string, x: number, y: number) => void;
  onOpenEditModal: () => void;
  onRestartGame: () => void;
  onToggleRevealAll?: () => void;
  revealedItemIds: string[];
  mistakesCount: number;
  currentQuestionItem: GameItem | null;
  onGuessItem: (item: GameItem) => void;
  isShuffleMode?: boolean;
  onToggleShuffleMode?: () => void;
  onReshuffleWords?: () => void;
  onAutoRemoveAllBackgrounds?: () => Promise<void>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  classroom,
  isEditMode,
  selectedItemId,
  onSelectItem,
  onUpdateItemPosition,
  onOpenEditModal,
  onRestartGame,
  onToggleRevealAll,
  revealedItemIds,
  mistakesCount,
  currentQuestionItem,
  onGuessItem,
  isShuffleMode = true,
  onToggleShuffleMode,
  onReshuffleWords,
  onAutoRemoveAllBackgrounds,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [wigglingItemId, setWigglingItemId] = useState<string | null>(null);
  const [paintingState, setPaintingState] = useState<PaintingState | null>(null);
  const [silhouetteCache, setSilhouetteCache] = useState<Record<string, string>>({});
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  // Clarity enhancement mode to make background crystal clear & vivid
  const [isVividBackground, setIsVividBackground] = useState<boolean>(true);

  // Precompute 100% solid, hole-filled silhouettes for all classroom items (không lốm đốm, đều đen như ảnh 1)
  useEffect(() => {
    let isCancelled = false;
    classroom.items.forEach((it) => {
      if (!it.silhouetteUrl && !silhouetteCache[it.id]) {
        generateSolidSilhouette(it.imageUrl, it.silhouetteColor || '#000000')
          .then((url) => {
            if (!isCancelled && url && url !== it.imageUrl) {
              setSilhouetteCache((prev) => ({ ...prev, [it.id]: url }));
            }
          })
          .catch(() => {});
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [classroom.items]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Play English TTS pronunciation when question changes
  useEffect(() => {
    if (currentQuestionItem && !isEditMode) {
      speakWord(currentQuestionItem.word);
    }
  }, [currentQuestionItem?.id, isEditMode]);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentQuestionItem) return;
    setIsSpeaking(true);
    speakWord(currentQuestionItem.word).finally(() => setIsSpeaking(false));
  };

  const handleItemClick = (item: GameItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) {
      onSelectItem(item.id);
      soundEngine.playClick();
      return;
    }

    // Play Mode
    if (revealedItemIds.includes(item.id)) {
      speakWord(item.word);
      return;
    }

    if (!currentQuestionItem) return;
    // Prevent double clicks during painting
    if (paintingState) return;

    if (item.id === currentQuestionItem.id) {
      // Correct guess! Start Paintbrush Animation ("hiệu ứng cây bút vẽ hiện hình ra")
      soundEngine.playPaintBrush();
      setPaintingState({ itemId: item.id, progress: 0 });

      const startTime = performance.now();
      const duration = 1150; // ms for smooth brush sweep

      const step = (now: number) => {
        const elapsed = now - startTime;
        const rawProgress = Math.min(1, elapsed / duration);
        // Smooth easeInOut
        const eased = rawProgress < 0.5
          ? 2 * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

        const progressPct = Math.round(eased * 100);
        setPaintingState({ itemId: item.id, progress: progressPct });

        if (rawProgress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          // Painting sequence complete!
          soundEngine.playCorrect();

          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = (rect.left + (rect.width * item.x) / 100) / window.innerWidth;
            const y = (rect.top + (rect.height * item.y) / 100) / window.innerHeight;
            confetti({
              particleCount: 45,
              spread: 80,
              origin: { x, y },
              colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#a855f7'],
              disableForReducedMotion: true,
            });
          }

          setPaintingState(null);
          onGuessItem(item);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    } else {
      soundEngine.playWrong();
      setWigglingItemId(item.id);
      setTimeout(() => setWigglingItemId(null), 450);
      onGuessItem(item);
    }
  };

  // Drag-and-drop pointer controls
  const handlePointerDown = (item: GameItem, e: React.PointerEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    onSelectItem(item.id);
    setDraggedItemId(item.id);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isEditMode || !draggedItemId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(8, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));
    onUpdateItemPosition(draggedItemId, Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedItemId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDraggedItemId(null);
    }
  };

  const totalItems = classroom.items.length;
  const revealedCount = revealedItemIds.length;

  return (
    <div className="w-full flex-1 max-w-[1720px] mx-auto px-1 sm:px-2 pb-1 flex flex-col justify-center select-none">
      {/* Full-Height Screen-Filling Game Frame (Khung nền to đều màn hình luôn) */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => isEditMode && onSelectItem(null)}
        className="relative w-full flex-1 min-h-[540px] h-[calc(100vh-108px)] bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-2 ring-amber-300/40 select-none touch-none transition-all"
      >
        {/* Crisp & Pure Background Layer (Làm nền trong vắt, sắc nét không bị ám mờ) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-300 pointer-events-none"
          style={{
            backgroundImage: `url("${classroom.backgroundImageUrl}")`,
            imageRendering: '-webkit-optimize-contrast',
            filter: isVividBackground
              ? 'contrast(1.07) brightness(1.03) saturate(1.10)'
              : 'contrast(1.02) brightness(1.01) saturate(1.03)',
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* --- Top HUD: Question Banner & Badges --- */}
        <div className="absolute top-2.5 inset-x-2.5 sm:top-3.5 sm:inset-x-5 flex items-center justify-between z-20 pointer-events-none">
          {/* Progress Badge + Flip All Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md px-3 sm:px-3.5 py-1 rounded-full shadow-md border border-slate-200/80">
              <span className="font-extrabold text-xs sm:text-sm text-slate-800 tracking-wide font-fun">
                {revealedCount} / {totalItems}
              </span>
            </div>

            {/* Quick Reveal All / Hide All Button in HUD */}
            {onToggleRevealAll && totalItems > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleRevealAll();
                }}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold shadow-md border transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                  revealedCount === totalItems
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                    : 'bg-white/95 hover:bg-emerald-50 text-emerald-700 border-emerald-300 hover:text-emerald-800'
                }`}
                title={revealedCount === totalItems ? 'Úp lại thành bóng đen' : 'Lật mở tất cả các hình lên'}
              >
                {revealedCount === totalItems ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                    <span className="hidden sm:inline">Úp bóng</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Lật tất cả</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Central Question Target (Đọc xáo trộn) */}
          {currentQuestionItem ? (
            <div className="bg-white/95 backdrop-blur-md px-3 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-xl border border-slate-200 flex items-center gap-2 sm:gap-3 pointer-events-auto animate-float">
              {/* Shuffle Indicator & Button */}
              {isShuffleMode && onReshuffleWords && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReshuffleWords();
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] sm:text-xs font-bold transition-colors cursor-pointer"
                  title="Xáo trộn lại các từ đọc tiếp theo"
                >
                  <Shuffle className="w-3 h-3 text-amber-700" />
                  <span className="hidden sm:inline">Xáo trộn</span>
                </button>
              )}

              <span className="font-extrabold text-sm sm:text-xl md:text-2xl text-slate-900 tracking-wide font-fun drop-shadow-xs">
                {currentQuestionItem.word}
              </span>

              <button
                onClick={handleSpeak}
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                  isSpeaking
                    ? 'bg-sky-500 text-white scale-110 shadow-md ring-4 ring-sky-200'
                    : 'bg-sky-400 hover:bg-sky-500 text-white shadow-xs hover:scale-105 active:scale-95 cursor-pointer'
                }`}
                title="Nghe phát âm tiếng Anh"
                aria-label="Phát âm"
              >
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full shadow-xl border border-amber-300 flex items-center gap-2 sm:gap-2.5 pointer-events-auto animate-bounce-subtle">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-950 bg-amber-400 px-3 py-1 rounded-full">
                <Sparkles className="w-4 h-4 text-amber-900" />
                <span>Đã mở toàn bộ ({totalItems}/{totalItems})!</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestartGame();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                title="Chơi lại bài này"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Chơi lại</span>
              </button>
            </div>
          )}

          {/* Mistakes Counter & Quick Auto-Remove Backgrounds */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {onAutoRemoveAllBackgrounds && totalItems > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAutoRemoveAllBackgrounds();
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-md border border-teal-300 bg-white/95 hover:bg-teal-50 text-teal-800 transition-all cursor-pointer backdrop-blur-md active:scale-95"
                title="Tự động xóa sạch viền trắng của tất cả hình trên màn hình thành ảnh trong suốt chuẩn đẹp"
              >
                <Wand2 className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Tách nền ảnh</span>
              </button>
            )}

            <div className="bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-full shadow-md border border-slate-200/80">
              <span
                className={`font-extrabold text-xs sm:text-sm font-fun ${
                  mistakesCount > 0 ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                Sai: {mistakesCount}
              </span>
            </div>
          </div>
        </div>

        {/* --- Edit Mode Banner Indicator --- */}
        {isEditMode && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-amber-500/95 text-white text-xs sm:text-sm font-bold px-4 py-1 rounded-full shadow-lg border border-amber-300 flex items-center gap-2 z-20 whitespace-nowrap">
            <span>Kéo thả trực tiếp hình trên màn hình (đã căn lề không bị che khuất)</span>
          </div>
        )}

        {/* --- Canvas Items: Pixel-Perfect Silhouettes & Paintbrush Revealed Characters --- */}
        {classroom.items.map((item) => {
          const isRevealed = revealedItemIds.includes(item.id);
          const isPainting = paintingState?.itemId === item.id;
          const paintProgress = isPainting ? paintingState.progress : 0;
          const isSelected = isEditMode && selectedItemId === item.id;
          const isDragging = isEditMode && draggedItemId === item.id;
          const isWiggling = wigglingItemId === item.id;
          const shadowColor = item.silhouetteColor || '#0a0a0a';
          const silhouetteSrc = item.silhouetteUrl || silhouetteCache[item.id];

          const baseSize = 135 * item.scale;

          return (
            <div
              key={item.id}
              onClick={(e) => handleItemClick(item, e)}
              onPointerDown={(e) => handlePointerDown(item, e)}
              className={`absolute transition-transform select-none ${
                isWiggling ? 'animate-wiggle z-30' : ''
              } ${isRevealed ? 'animate-pop-in' : ''} ${
                isPainting ? 'z-40' : ''
              } ${
                isEditMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isDragging ? 55 : isPainting ? 45 : isSelected ? 40 : isRevealed ? 15 : 10,
              }}
            >
              <div
                className={`relative group p-1 transition-all rounded-3xl ${
                  (isSelected || isDragging) && isEditMode && !isPainting
                    ? 'ring-4 ring-amber-400 bg-amber-400/20 shadow-xl ring-offset-2 ring-offset-white'
                    : ''
                }`}
              >
                {/* Silhouette or Revealed Image Container - Khung nền chơi không hiện ô vuông, chỉ hiện theo hình */}

                {/* Silhouette or Revealed Image Container */}
                <div
                  className="relative flex items-center justify-center select-none"
                  style={{
                    width: `${baseSize}px`,
                    height: `${baseSize}px`,
                  }}
                >
                  {isRevealed ? (
                    /* 1. Fully Revealed Colorful Character */
                    <img
                      src={item.imageUrl}
                      alt={item.word}
                      draggable={false}
                      className="w-full h-full object-contain drop-shadow-md pointer-events-none hover:scale-105 transition-transform"
                    />
                  ) : isPainting ? (
                    /* 2. Active Paintbrush Wipe Reveal Mode (Cây bút vẽ hiện hình ra giống ảnh 2) */
                    <div className="relative w-full h-full overflow-visible select-none">
                      {/* Base Layer: Revealed colorful illustration underneath */}
                      <img
                        src={item.imageUrl}
                        alt={item.word}
                        draggable={false}
                        className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
                      />

                      {/* Top Layer: Solid black silhouette erased from top to bottom by paintbrush */}
                      <div
                        className="absolute inset-0 pointer-events-none select-none transition-none"
                        style={{
                          clipPath: `inset(${paintProgress}% 0 0 0)`,
                          WebkitClipPath: `inset(${paintProgress}% 0 0 0)`,
                        }}
                      >
                        {silhouetteSrc ? (
                          <img
                            src={silhouetteSrc}
                            alt={item.word}
                            draggable={false}
                            className="w-full h-full object-contain pointer-events-none select-none"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundColor: shadowColor || '#0a0a0a',
                              maskImage: `url("${item.imageUrl}")`,
                              WebkitMaskImage: `url("${item.imageUrl}")`,
                              maskSize: 'contain',
                              WebkitMaskSize: 'contain',
                              maskRepeat: 'no-repeat',
                              WebkitMaskRepeat: 'no-repeat',
                              maskPosition: 'center',
                              WebkitMaskPosition: 'center',
                            }}
                          />
                        )}
                      </div>

                      {/* Moving Paintbrush ("Cây bút vẽ") sweeping across the transition line */}
                      <div
                        className="absolute pointer-events-none z-40 transition-none"
                        style={{
                          top: `${paintProgress}%`,
                          left: `${52 + Math.sin(paintProgress * 0.14) * 24}%`,
                          transform: `translate(-25%, -78%) rotate(${Math.sin(paintProgress * 0.16) * 16 - 22}deg)`,
                        }}
                      >
                        <PaintBrushIcon className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-xl" />

                        {/* Paint Splatters & Magic Sparkles */}
                        <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-purple-400 animate-ping opacity-80" />
                        <div className="absolute -top-1 right-2 w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                        <div className="absolute bottom-2 left-0 w-1 h-1 rounded-full bg-pink-300" />
                      </div>
                    </div>
                  ) : (
                    /* 3. Pure Solid Pitch Black Silhouette ("đen thùi lùi lun, đều đen như ảnh 1, không lốm đốm") */
                    silhouetteSrc ? (
                      <img
                        src={silhouetteSrc}
                        alt={`Bóng ${item.word}`}
                        draggable={false}
                        className="w-full h-full object-contain pointer-events-none select-none transition-all group-hover:scale-105"
                        style={{
                          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full transition-all group-hover:scale-105 select-none"
                        style={{
                          backgroundColor: shadowColor || '#0a0a0a',
                          maskImage: `url("${item.imageUrl}")`,
                          WebkitMaskImage: `url("${item.imageUrl}")`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
                        }}
                      />
                    )
                  )}

                  {/* Number Badge (Bảng số hình con nhộng/oval viền trắng nền vàng giống y ảnh 1 và 2) */}
                  <div
                    className={`absolute font-black pointer-events-none transition-all font-fun flex items-center justify-center shadow-md ${
                      isRevealed
                        ? 'min-w-[24px] h-[24px] px-1.5 rounded-full bg-[#fde047] border border-white text-[#1e3a8a] text-[11px] sm:text-xs scale-90 top-1 right-1'
                        : 'min-w-[44px] h-[27px] px-3.5 py-0.5 rounded-full bg-[#fde047] border-[2.5px] border-white text-[#0f2b5c] text-sm sm:text-base top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 z-30 ring-1 ring-amber-400/40'
                    }`}
                  >
                    {item.numberLabel}
                  </div>
                </div>

                {isEditMode && (
                  <div
                    className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md pointer-events-none text-[11px] font-bold z-50 transition-all flex items-center gap-1 ${
                      isSelected || isDragging
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-white scale-110 shadow-lg'
                        : 'bg-slate-900/90 text-white'
                    }`}
                  >
                    <span>#{item.numberLabel} {item.word}</span>
                    {(isSelected || isDragging) && (
                      <span className="text-[9px] font-extrabold text-amber-950 bg-amber-300/90 px-1 rounded-sm">
                        {Math.round(item.x)}%, {Math.round(item.y)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* --- Bottom-Right Controls Floating Bar --- */}
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-20">
          {/* Flip All / Reveal All Button (Nút lật tất cả các hình lên) */}
          {onToggleRevealAll && totalItems > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleRevealAll();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-md border transition-all active:scale-95 cursor-pointer backdrop-blur-xs ${
                revealedCount === totalItems
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-500/20'
              }`}
              title={
                revealedCount === totalItems
                  ? 'Úp lại thành bóng đen để đoán tiếp'
                  : 'Lật tất cả các hình ảnh lên cùng lúc'
              }
            >
              {revealedCount === totalItems ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-900" />
                  <span>Úp bóng</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span>Lật tất cả hình</span>
                </>
              )}
            </button>
          )}

          {/* Background Clarity Toggle (Làm nền trong hơn) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playClick();
              setIsVividBackground(!isVividBackground);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs border transition-all cursor-pointer backdrop-blur-xs ${
              isVividBackground
                ? 'bg-amber-400 text-amber-950 border-amber-300'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
            }`}
            title="Bật/Tắt chế độ tăng độ trong trẻo và rực rỡ của hình nền"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-900" />
            <span className="hidden sm:inline">Nền trong vắt</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playClick();
              onOpenEditModal();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 text-xs sm:text-sm font-bold shadow-md border border-slate-200/80 transition-transform active:scale-95 cursor-pointer backdrop-blur-xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-700" />
            <span>Chỉnh sửa</span>
          </button>

          {/* Prominent Play Again Button (Nút chơi lại) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestartGame();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs sm:text-sm font-black shadow-md border border-amber-300/40 transition-transform active:scale-95 cursor-pointer backdrop-blur-xs ring-2 ring-amber-300/40"
            title="Bắt đầu chơi lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Chơi lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};
