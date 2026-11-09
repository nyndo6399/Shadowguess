/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Classroom } from '../types/game';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  BookOpen,
  Sparkles,
  Settings,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { cleanStartNowButtonImage } from '../utils/imageProcessing';
import confetti from 'canvas-confetti';

interface CoverScreenProps {
  onStartGame: () => void;
  classrooms: Classroom[];
  activeClass: Classroom;
  onSelectClass: (id: string) => void;
  onOpenClassModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({
  onStartGame,
  classrooms,
  activeClass,
  onSelectClass,
  onOpenClassModal,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [transparentButtonSrc, setTransparentButtonSrc] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('shadow_guess_clean_start_btn') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Thoroughly erase white background, floor, and contact ground shadows from the START NOW button
  useEffect(() => {
    let isMounted = true;
    const rawButtonUrl = '/assets/aistudio/Yellow_START_NOW_button_aaa6755f_2K_1ba548b5.jpg';

    if (transparentButtonSrc) return;

    cleanStartNowButtonImage(rawButtonUrl)
      .then((cleanUrl) => {
        if (isMounted && cleanUrl) {
          setTransparentButtonSrc(cleanUrl);
          try {
            sessionStorage.setItem('shadow_guess_clean_start_btn', cleanUrl);
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.warn('Button cleanup error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [transparentButtonSrc]);

  const handleStartClick = () => {
    soundEngine.playCorrect();
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
    onStartGame();
  };

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen flex flex-col justify-between overflow-hidden select-none bg-slate-900 bg-cover bg-center bg-no-repeat transition-all"
      style={{
        backgroundImage: `url('/assets/aistudio/Gemini_Generated_Image_jzvykcjzvykcjzvy_d34d9cab.png')`,
      }}
    >
      {/* Top Floating Glass Navigation Bar */}
      <header className="w-full px-3 sm:px-6 py-3 flex items-center justify-between gap-2 z-20">
        {/* Left: Quick Classroom Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/70 hover:bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-1.5 shadow-xl transition-all">
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <select
            value={activeClass.id}
            onChange={(e) => {
              soundEngine.playClick();
              onSelectClass(e.target.value);
            }}
            className="bg-transparent text-xs sm:text-sm font-extrabold text-white focus:outline-hidden cursor-pointer max-w-[150px] sm:max-w-[260px] truncate"
            title="Chọn bộ câu hỏi / lớp học để bắt đầu"
          >
            {classrooms.map((cls) => (
              <option key={cls.id} value={cls.id} className="text-slate-900 font-bold bg-white">
                {cls.name} ({cls.items.length} từ)
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenClassModal();
            }}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-100 hover:bg-white/10 px-2 py-0.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ml-1"
            title="Quản lý hoặc tạo lớp học mới"
          >
            Đổi lớp
          </button>
        </div>

        {/* Right: Quick Controls (Sound & Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950/90 backdrop-blur-md border border-white/20 text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            aria-label="Sound Toggle"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950/90 backdrop-blur-md border border-white/20 text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình trình chiếu'}
            aria-label="Fullscreen Toggle"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-amber-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Bottom Interactive Area with Prominent 3D START NOW Button */}
      <div className="w-full flex flex-col items-center justify-center pb-6 sm:pb-10 px-4 z-20">
        {/* Animated Glow Halo around the button */}
        <div className="relative flex flex-col items-center">
          {/* Pulsing ambient glow */}
          <div className="absolute inset-0 -m-4 bg-amber-400/30 rounded-full blur-2xl animate-pulse pointer-events-none" />

          {/* START NOW 3D Button (Không viền trắng, bóng đổ mềm mại chuẩn đẹp) */}
          <button
            onClick={handleStartClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative focus:outline-hidden focus:ring-0 border-0 outline-none bg-transparent p-0 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer filter drop-shadow-[0_14px_28px_rgba(0,0,0,0.55)]"
            title="Bấm để vào game ngay bây giờ!"
            aria-label="START NOW"
          >
            {transparentButtonSrc ? (
              <img
                src={transparentButtonSrc}
                alt="START NOW"
                className="w-56 sm:w-72 md:w-80 h-auto object-contain transition-transform duration-200 group-hover:brightness-105 pointer-events-none select-none border-0 outline-none"
                draggable={false}
              />
            ) : (
              /* Fallback rich 3D CSS button while image is processing with zero white border */
              <div className="px-8 sm:px-12 py-3.5 sm:py-4.5 rounded-3xl bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 border-4 border-amber-600 shadow-[0_8px_0_#b45309,0_15px_20px_rgba(0,0,0,0.4)] flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-950 animate-spin" />
                <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-wider font-fun uppercase drop-shadow-sm">
                  START NOW
                </span>
              </div>
            )}

            {/* Sparkle decorative effect on hover */}
            <div
              className={`absolute -top-2 -right-2 transition-opacity duration-200 pointer-events-none ${
                isHovered ? 'opacity-100 scale-125' : 'opacity-0 scale-90'
              }`}
            >
              <Sparkles className="w-7 h-7 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] animate-pulse" />
            </div>
          </button>

          {/* Selected Classroom Preview Label */}
          <div className="mt-3 px-4 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2">
            <span className="text-amber-400">Đang chọn:</span>
            <span className="text-white truncate max-w-[200px] sm:max-w-[300px]">
              {activeClass.name}
            </span>
            <span className="text-amber-300 text-xs font-black">
              ({activeClass.items.length} từ)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
