/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Classroom } from '../types/game';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  RotateCcw,
  BookOpen,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  Home,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface HeaderProps {
  classrooms: Classroom[];
  activeClass: Classroom;
  onSelectClass: (id: string) => void;
  onQuickAddClass: () => void;
  onQuickDeleteClass: (id: string) => void;
  onOpenClassModal: () => void;
  onOpenEditModal: () => void;
  onRestartGame: () => void;
  onGoHome?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lastSavedTimestamp?: number;
}

export const Header: React.FC<HeaderProps> = ({
  classrooms,
  activeClass,
  onSelectClass,
  onQuickAddClass,
  onQuickDeleteClass,
  onOpenClassModal,
  onOpenEditModal,
  onRestartGame,
  onGoHome,
  isFullscreen,
  onToggleFullscreen,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-amber-200/70 shadow-xs px-2 sm:px-5 py-1 sm:py-1.5 transition-all">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Brand & Classroom Switcher with 1-click Add/Delete */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm">
              SG
            </span>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 leading-tight">
                Shadow Guess
              </h1>
              <p className="text-[11px] text-amber-700/80 font-medium hidden md:block">
                NHUY
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Quick Classroom Selector & Fast Action Buttons */}
          <div className="flex items-center gap-1 bg-amber-50/80 border border-amber-200/80 rounded-xl px-2 py-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <select
              value={activeClass.id}
              onChange={(e) => {
                soundEngine.playClick();
                onSelectClass(e.target.value);
              }}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden cursor-pointer max-w-[140px] sm:max-w-[240px] truncate"
              title="Chọn lớp học"
            >
              {classrooms.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.items.length} từ)
                </option>
              ))}
            </select>

            {/* Quick Add Class Button (+ Thêm lớp nhanh) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onQuickAddClass();
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70 px-2 py-0.5 rounded-lg transition-colors whitespace-nowrap"
              title="Thêm lớp học mới nhanh chóng"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm lớp</span>
            </button>

            {/* Quick Delete Class Button (Xóa lớp nhanh) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onQuickDeleteClass(activeClass.id);
              }}
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
              title="Xóa lớp học này"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenClassModal();
              }}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:bg-amber-100/80 px-1.5 py-0.5 rounded-lg transition-colors whitespace-nowrap"
              title="Quản lý chi tiết tất cả các lớp"
            >
              Quản lý
            </button>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Permanent Auto-Saved Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shadow-2xs select-none"
            title="Dữ liệu từ vựng & hình ảnh đã tự động lưu vĩnh viễn trên máy của bạn (không mất khi tắt tab)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Đã tự động lưu</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1 ${
              soundEnabled
                ? 'bg-amber-100/70 border-amber-300 text-amber-800 hover:bg-amber-200/70'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            aria-label="Sound Toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình trình chiếu'}
            aria-label="Fullscreen Toggle"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Restart Game */}
          <button
            onClick={onRestartGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Chơi lại</span>
          </button>

          {/* Home Cover Page Button */}
          {onGoHome && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onGoHome();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-2xs"
              title="Quay về trang bìa trò chơi (Cover Screen)"
            >
              <Home className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">Trang chủ</span>
            </button>
          )}

          {/* Edit Game Modal Button */}
          <button
            onClick={onOpenEditModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </div>
    </header>
  );
};
