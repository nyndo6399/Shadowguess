/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Play, HeartHandshake } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  mistakesCount: number;
  maxMistakes: number;
  onRestart: () => void;
  onContinueAnyway: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  mistakesCount,
  maxMistakes,
  onRestart,
  onContinueAnyway,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-rose-300 w-full max-w-sm p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <HeartHandshake className="w-9 h-9" />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight font-fun">
            Cố gắng lên nhé!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Bạn đã đoán sai {mistakesCount}/{maxMistakes} lần. Bạn muốn tiếp tục thử sức hay chơi lại từ đầu?
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              soundEngine.playClick();
              onContinueAnyway();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Tiếp tục chơi (Thử lại)</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi lại từ đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
