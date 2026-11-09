/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Trophy, Star, RotateCcw, BookOpen, Clock, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  totalWords: number;
  mistakesCount: number;
  timeSpentSeconds: number;
  classNameTitle: string;
  onRestart: () => void;
  onOpenClassModal: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  totalWords,
  mistakesCount,
  timeSpentSeconds,
  classNameTitle,
  onRestart,
  onOpenClassModal,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundEngine.playVictory();
      // Celebratory multi-burst confetti
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Star rating calculation
  let stars = 3;
  if (mistakesCount >= 3) stars = 1;
  else if (mistakesCount >= 1) stars = 2;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins > 0 ? `${mins}m ` : ''}${remainingSecs}s`;
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-amber-300 w-full max-w-md p-6 text-center space-y-6">
        {/* Trophy icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-lg animate-bounce">
          <Trophy className="w-10 h-10 text-amber-950" />
        </div>

        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight font-fun">
            Tuyệt vời! Hoàn thành xuất sắc!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Bạn đã đoán chính xác tất cả bóng trong <span className="font-bold text-amber-700">{classNameTitle}</span>!
          </p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-9 h-9 transition-all ${
                starIdx <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-md scale-110'
                  : 'text-slate-200 fill-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="text-center">
            <span className="block text-slate-400 text-[10px] font-bold uppercase">Tổng từ</span>
            <span className="text-base font-extrabold text-slate-800 font-fun">{totalWords}</span>
          </div>

          <div className="text-center border-x border-slate-200">
            <span className="block text-slate-400 text-[10px] font-bold uppercase">Lần sai</span>
            <span className={`text-base font-extrabold font-fun ${mistakesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {mistakesCount}
            </span>
          </div>

          <div className="text-center">
            <span className="block text-slate-400 text-[10px] font-bold uppercase">Thời gian</span>
            <span className="text-base font-extrabold text-slate-800 font-fun">
              {formatTime(timeSpentSeconds)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenClassModal();
            }}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Chọn lớp khác</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi lại bài này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
