/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Classroom, GameItem } from '../types/game';
import {
  X,
  Plus,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  LayoutGrid,
  RefreshCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  Target,
  ShieldCheck,
  Wand2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import {
  downloadExcelTemplate,
  parseCsvToItems,
  exportClassroomToJson,
} from '../utils/storage';
import {
  getRandomShadowColor,
  fileToDataUrl,
  removeLightBackground,
  generateSolidSilhouette,
  processItemImage,
  SHADOW_COLOR_PRESETS,
} from '../utils/imageProcessing';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  classroom: Classroom;
  onUpdateClassroom: (updated: Classroom) => void;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onOpenAddImageModal: () => void;
  onOpenChangeBackgroundModal: () => void;
  onDeleteCurrentClass?: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  isMinimized = false,
  onToggleMinimize,
  classroom,
  onUpdateClassroom,
  selectedItemId,
  onSelectItem,
  onOpenAddImageModal,
  onOpenChangeBackgroundModal,
  onDeleteCurrentClass,
}) => {
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState<boolean>(false);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);
  const [bgProcessingStatus, setBgProcessingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Center an item directly so it is never obscured or lost
  const handleCenterItem = (id: string) => {
    soundEngine.playClick();
    const updatedItems = classroom.items.map((it) => {
      if (it.id === id) {
        return { ...it, x: 50, y: 50 };
      }
      return it;
    });
    onUpdateClassroom({ ...classroom, items: updatedItems });
    onSelectItem(id);
  };

  // Move item by delta (percentage)
  const handleNudge = (item: GameItem, dx: number, dy: number) => {
    soundEngine.playClick();
    const updatedItems = classroom.items.map((it) => {
      if (it.id === item.id) {
        return {
          ...it,
          x: Math.max(5, Math.min(95, Math.round((it.x + dx) * 10) / 10)),
          y: Math.max(10, Math.min(90, Math.round((it.y + dy) * 10) / 10)),
        };
      }
      return it;
    });
    onUpdateClassroom({ ...classroom, items: updatedItems });
  };

  // Scale item
  const handleScale = (item: GameItem, delta: number) => {
    soundEngine.playClick();
    const updatedItems = classroom.items.map((it) => {
      if (it.id === item.id) {
        const newScale = Math.max(0.4, Math.min(2.5, Math.round((it.scale + delta) * 100) / 100));
        return { ...it, scale: newScale };
      }
      return it;
    });
    onUpdateClassroom({ ...classroom, items: updatedItems });
  };

  // Update item word
  const handleWordChange = (id: string, newWord: string) => {
    const updatedItems = classroom.items.map((it) => (it.id === id ? { ...it, word: newWord } : it));
    onUpdateClassroom({ ...classroom, items: updatedItems });
  };

  // Update item shadow color (bóng đen thuần hoặc màu tùy chọn)
  const handleItemColorChange = async (id: string, color: string) => {
    const target = classroom.items.find((it) => it.id === id);
    let solidSilhouette = '';
    if (target) {
      try {
        solidSilhouette = await generateSolidSilhouette(target.imageUrl, color);
      } catch {
        solidSilhouette = '';
      }
    }
    const updatedItems = classroom.items.map((it) =>
      it.id === id ? { ...it, silhouetteColor: color, silhouetteUrl: solidSilhouette || it.silhouetteUrl } : it
    );
    onUpdateClassroom({ ...classroom, items: updatedItems });
  };

  // Apply color to ALL items in classroom
  const handleSetAllShadowColors = async (color: string) => {
    soundEngine.playClick();
    const updatedItems = await Promise.all(
      classroom.items.map(async (it) => {
        try {
          const sil = await generateSolidSilhouette(it.imageUrl, color);
          return { ...it, silhouetteColor: color, silhouetteUrl: sil };
        } catch {
          return { ...it, silhouetteColor: color };
        }
      })
    );
    onUpdateClassroom({ ...classroom, items: updatedItems });
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    soundEngine.playClick();
    const filtered = classroom.items.filter((it) => it.id !== id);
    const reindexed = filtered.map((it, idx) => ({ ...it, numberLabel: idx + 1 }));
    onUpdateClassroom({ ...classroom, items: reindexed });
    if (selectedItemId === id) onSelectItem(null);
  };

  // Auto-arrange all items in grid layout
  const handleAutoArrange = () => {
    soundEngine.playClick();
    const count = classroom.items.length;
    if (count === 0) return;

    const cols = Math.ceil(Math.sqrt(count * 1.5));
    const rows = Math.ceil(count / cols);

    const xStep = 75 / (cols > 1 ? cols - 1 : 1);
    const yStep = 55 / (rows > 1 ? rows - 1 : 1);

    const updated = classroom.items.map((it, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        ...it,
        x: Math.round(15 + col * xStep),
        y: Math.round(28 + row * yStep),
      };
    });

    onUpdateClassroom({ ...classroom, items: updated });
  };

  // Regenerate random dark shadow colors
  const handleRegenerateShadows = () => {
    soundEngine.playClick();
    const updated = classroom.items.map((it) => ({
      ...it,
      silhouetteColor: getRandomShadowColor(),
    }));
    onUpdateClassroom({ ...classroom, items: updated });
  };

  // Clear all items directly without window.confirm
  const handleExecuteClearAll = () => {
    soundEngine.playClick();
    onUpdateClassroom({ ...classroom, items: [] });
    onSelectItem(null);
    setIsConfirmingClearAll(false);
  };

  // Handle multiple file upload directly
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newItems: GameItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let dataUrl = await fileToDataUrl(file);
      dataUrl = await removeLightBackground(dataUrl, 36);
      let solidSilhouette = '';
      try {
        solidSilhouette = await generateSolidSilhouette(dataUrl, '#000000');
      } catch {
        solidSilhouette = dataUrl;
      }

      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const col = (classroom.items.length + newItems.length) % 4;
      const row = Math.floor((classroom.items.length + newItems.length) / 4);

      newItems.push({
        id: `item-upload-${Date.now()}-${i}`,
        word: rawName || `Từ mới ${classroom.items.length + newItems.length + 1}`,
        imageUrl: dataUrl,
        silhouetteUrl: solidSilhouette,
        silhouetteColor: '#000000',
        x: 15 + col * 22,
        y: 28 + (row % 3) * 22,
        scale: 1.0,
        numberLabel: classroom.items.length + newItems.length + 1,
      });
    }

    onUpdateClassroom({ ...classroom, items: [...classroom.items, ...newItems] });
    e.target.value = '';
    soundEngine.playClick();
  };

  // Handle CSV import with automatic background stripping
  const handleCsvSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const rawParsed = parseCsvToItems(text, classroom.items.length);
      if (rawParsed.length === 0) return;

      setIsProcessingBg(true);
      setBgProcessingStatus(`Đang đọc và tách nền ${rawParsed.length} ảnh từ CSV...`);

      const processedItems: GameItem[] = [];
      for (let i = 0; i < rawParsed.length; i++) {
        const item = rawParsed[i];
        setBgProcessingStatus(`Đang tách nền (${i + 1}/${rawParsed.length}): "${item.word}"...`);
        try {
          const { cleanImageUrl, silhouetteUrl } = await processItemImage(
            item.imageUrl,
            item.silhouetteColor || '#000000',
            40
          );
          processedItems.push({
            ...item,
            imageUrl: cleanImageUrl,
            silhouetteUrl: silhouetteUrl,
          });
        } catch {
          processedItems.push(item);
        }
      }

      setIsProcessingBg(false);
      setBgProcessingStatus('');
      onUpdateClassroom({ ...classroom, items: [...classroom.items, ...processedItems] });
      soundEngine.playCorrect();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Tự động tách nền tất cả ảnh hiện có trong lớp học (xóa sạch ô vuông nền trắng)
  const handleRemoveBgAll = async () => {
    if (classroom.items.length === 0) return;
    soundEngine.playClick();
    setIsProcessingBg(true);
    setBgProcessingStatus(`Đang tự động tách nền cho ${classroom.items.length} hình...`);

    const updated: GameItem[] = [];
    for (let i = 0; i < classroom.items.length; i++) {
      const it = classroom.items[i];
      setBgProcessingStatus(`Đang tách nền (${i + 1}/${classroom.items.length}): "${it.word}"...`);
      try {
        const { cleanImageUrl, silhouetteUrl } = await processItemImage(
          it.imageUrl,
          it.silhouetteColor || '#000000',
          40
        );
        updated.push({
          ...it,
          imageUrl: cleanImageUrl,
          silhouetteUrl: silhouetteUrl,
        });
      } catch {
        updated.push(it);
      }
    }

    setIsProcessingBg(false);
    setBgProcessingStatus('');
    onUpdateClassroom({ ...classroom, items: updated });
    soundEngine.playCorrect();
  };

  // Tách nền riêng cho một hình cụ thể
  const handleRemoveBgSingle = async (id: string) => {
    soundEngine.playClick();
    const target = classroom.items.find((it) => it.id === id);
    if (!target) return;
    setIsProcessingBg(true);
    setBgProcessingStatus(`Đang tách nền cho "${target.word}"...`);
    try {
      const { cleanImageUrl, silhouetteUrl } = await processItemImage(
        target.imageUrl,
        target.silhouetteColor || '#000000',
        40
      );
      const updated = classroom.items.map((it) =>
        it.id === id ? { ...it, imageUrl: cleanImageUrl, silhouetteUrl } : it
      );
      onUpdateClassroom({ ...classroom, items: updated });
      soundEngine.playCorrect();
    } catch (err) {
      console.warn('Single remove bg failed:', err);
    } finally {
      setIsProcessingBg(false);
      setBgProcessingStatus('');
    }
  };

  // If minimized, render floating button on the right edge to easily restore full panel
  if (isMinimized) {
    return (
      <div className="fixed right-3 bottom-5 sm:bottom-6 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-right duration-200">
        <button
          onClick={() => {
            soundEngine.playClick();
            if (onToggleMinimize) onToggleMinimize();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black shadow-2xl border-2 border-white ring-4 ring-amber-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Mở lại bảng chỉnh sửa"
        >
          <PanelRightOpen className="w-5 h-5 text-amber-950 shrink-0" />
          <span className="text-xs sm:text-sm font-extrabold tracking-wide">
            Mở bảng chỉnh sửa ({classroom.items.length})
          </span>
        </button>
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 shadow-xl border border-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Đóng chế độ chỉnh sửa"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Click-away backdrop only on mobile screens (< sm) so mobile can tap outside to close, but on desktop it's transparent / non-blocking so the canvas on the left remains 100% visible */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 sm:hidden pointer-events-auto"
      />

      {/* Right-docked compact editor panel (Khung chỉnh sửa hiện lên góc bên phải nhỏ lại để có thể nhìn và chỉnh dễ hơn) */}
      <aside className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[410px] md:w-[440px] bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* --- Header --- */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-white sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <RefreshCw className="w-4 h-4 text-amber-700" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                Chỉnh sửa Shadow Guess
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                {classroom.items.length} lớp hình • Kéo thả không bị khuất
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleMinimize && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleMinimize();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Thu nhỏ bảng để nhìn toàn màn hình"
              >
                <PanelRightClose className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </button>
            )}

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="Đóng chỉnh sửa"
            >
              <X className="w-4 h-4" />
              <span>Đóng</span>
            </button>
          </div>
        </div>

        {/* Classroom Quick Rename & Delete Classroom Button */}
        <div className="px-3 py-2 bg-amber-50/60 border-b border-amber-200/60 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
              Tên lớp học đang chọn:
            </label>
            <input
              type="text"
              value={classroom.name}
              onChange={(e) => onUpdateClassroom({ ...classroom, name: e.target.value })}
              className="w-full px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 shadow-2xs"
            />
          </div>

          {onDeleteCurrentClass && (
            <button
              onClick={onDeleteCurrentClass}
              className="mt-3.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Xóa lớp học hiện tại"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa lớp này</span>
            </button>
          )}
        </div>

        {/* Persistent Auto-Save Indicator & Lesson Backup Button */}
        <div className="px-3 py-1.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[11px] font-bold text-emerald-900">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Tự động lưu vĩnh viễn trên máy (IndexedDB)</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <button
              onClick={() => {
                soundEngine.playClick();
                exportClassroomToJson(classroom);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors cursor-pointer"
              title="Tải tệp JSON bài học này về máy để dự phòng"
            >
              <Download className="w-3 h-3 text-emerald-700" />
              <span>Tải .json</span>
            </button>
          </div>
        </div>

        {/* Real-time Background Removal Processing Banner */}
        {isProcessingBg && (
          <div className="mx-3 my-2 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-300 text-teal-900 flex items-center gap-2 text-xs font-bold animate-pulse shadow-sm">
            <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
            <span className="flex-1 truncate">{bgProcessingStatus || 'Đang tách nền ảnh...'}</span>
          </div>
        )}

        {/* --- Compact Toolbar Action Buttons --- */}
        <div className="p-3 bg-slate-50/90 border-b border-slate-100 space-y-2.5">
          {/* Row 1: Add Image & Change Background */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenAddImageModal();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-sky-600" />
              <span>+ Thêm từ vựng mới</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenChangeBackgroundModal();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-amber-700" />
              <span>Đổi nền</span>
            </button>
          </div>

          {/* Row 2: Shadow Color Controls (Đen thuần hoặc màu tùy chọn) */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                Màu bóng toàn bộ:
              </span>
              <button
                onClick={handleRegenerateShadows}
                className="flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Ngẫu nhiên</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Set All to Pure Black */}
              <button
                onClick={() => handleSetAllShadowColors('#000000')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black hover:bg-slate-900 text-white text-[11px] font-black transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Đặt tất cả hình thành bóng đen hoàn toàn"
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>⚫ Tất cả đen hoàn toàn</span>
              </button>

              {/* Quick Preset Colors */}
              {SHADOW_COLOR_PRESETS.slice(1, 5).map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => handleSetAllShadowColors(preset.hex)}
                  className="w-5 h-5 rounded-md border border-slate-200 hover:scale-110 transition-transform shadow-2xs cursor-pointer"
                  style={{ backgroundColor: preset.hex }}
                  title={`Đặt tất cả thành ${preset.name}`}
                />
              ))}

              {/* Custom Color Picker for all */}
              <label
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                title="Chọn bất kỳ màu nào cho toàn bộ bóng"
              >
                <span>Tùy ý</span>
                <input
                  type="color"
                  defaultValue="#000000"
                  onChange={(e) => handleSetAllShadowColors(e.target.value)}
                  className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                />
              </label>
            </div>
          </div>

          {/* Row 3: Grid Arrange, Excel & Clear */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            {/* Tự động tách nền tất cả ảnh */}
            <button
              onClick={handleRemoveBgAll}
              disabled={isProcessingBg || classroom.items.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-black transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Tự động xóa sạch viền trắng của tất cả hình trong lớp để thành ảnh trong suốt chuẩn đẹp"
            >
              {isProcessingBg ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 text-amber-200" />
              )}
              <span>Tách nền tất cả ({classroom.items.length})</span>
            </button>

            <button
              onClick={handleAutoArrange}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-amber-950 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Sắp xếp tự động</span>
            </button>

            <button
              onClick={() => csvInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
              title="Nhập danh sách từ Excel/CSV và tự động tách nền trong suốt"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
              <span>Nhập CSV</span>
            </button>

            <button
              onClick={downloadExcelTemplate}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
              title="Tải tệp mẫu Excel"
            >
              <Download className="w-3 h-3 text-sky-600" />
              <span>Mẫu</span>
            </button>

            {isConfirmingClearAll ? (
              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl">
                <span className="text-[10px] font-bold text-rose-700">Xóa hết hình?</span>
                <button
                  onClick={handleExecuteClearAll}
                  className="px-1.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black cursor-pointer"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setIsConfirmingClearAll(false)}
                  className="px-1.5 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingClearAll(true)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer"
                title="Xóa tất cả các lớp hình trong bài"
              >
                <Trash2 className="w-3 h-3 text-rose-600" />
                <span>Xóa hết hình</span>
              </button>
            )}
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleCsvSelected}
          className="hidden"
        />

        {/* --- Layers List (Scrollable) --- */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span>DANH SÁCH TỪ VỰNG ({classroom.items.length})</span>
            <span className="text-[10px] text-slate-400 font-medium">Bấm để chỉnh trên màn</span>
          </div>

          {classroom.items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-xs">Chưa có từ vựng / hình ảnh nào</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Bấm "+ Thêm từ vựng mới" để bắt đầu tạo câu hỏi.
              </p>
            </div>
          ) : (
            classroom.items.map((item, idx) => {
              const isSelected = selectedItemId === item.id;
              const shadowColor = item.silhouetteColor || '#000000';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-2 ring-amber-300/50'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Top Bar of Card: Number Badge, Word input, Delete Button */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-lg shrink-0 shadow-2xs min-w-6 text-center">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      value={item.word}
                      onChange={(e) => handleWordChange(item.id, e.target.value)}
                      placeholder="Nhập từ vựng..."
                      className="flex-1 min-w-0 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                    />

                    {/* Quick remove background for this specific item */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBgSingle(item.id);
                      }}
                      disabled={isProcessingBg}
                      className="flex items-center gap-1 px-2 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors cursor-pointer shrink-0 border border-teal-200/60"
                      title="Xóa nền trắng cho riêng hình này để trở thành trong suốt"
                    >
                      <Wand2 className="w-3 h-3 text-teal-600" />
                      <span className="hidden sm:inline">Tách nền</span>
                    </button>

                    {/* Delete Item Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold transition-colors cursor-pointer shrink-0 border border-rose-200/50"
                      title="Xóa từ này"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Xóa</span>
                    </button>
                  </div>

                  {/* Body: Thumbnail, Color, Nudge & Scale */}
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-checkerboard flex items-center justify-center p-1 shrink-0 shadow-2xs">
                      <img
                        src={item.imageUrl}
                        alt={item.word}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      {/* Row: Shadow Color for this layer */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600">Bóng:</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemColorChange(item.id, '#000000');
                          }}
                          className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-bold shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                          title="Bóng đen thuần"
                        >
                          ⚫ Đen
                        </button>
                        <input
                          type="color"
                          value={shadowColor}
                          onChange={(e) => handleItemColorChange(item.id, e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          title="Chọn màu bóng khác"
                        />
                      </div>

                      {/* Directional Nudge + Scale */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Directional Mini D-pad */}
                        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNudge(item, -3, 0);
                            }}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
                            title="Di chuyển sang trái"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNudge(item, 0, -3);
                            }}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
                            title="Di chuyển lên trên"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNudge(item, 0, 3);
                            }}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
                            title="Di chuyển xuống dưới"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNudge(item, 3, 0);
                            }}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
                            title="Di chuyển sang phải"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Center Item Button (Đưa vật ra giữa màn hình để không bị khuất) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCenterItem(item.id);
                          }}
                          className="px-2 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                          title="Đưa hình này ra ngay giữa màn hình để không bị khuất"
                        >
                          <Target className="w-3 h-3 text-amber-800" />
                          <span>Ra giữa</span>
                        </button>

                        {/* Scale */}
                        <div className="flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-xl border border-sky-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScale(item, -0.1);
                            }}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-sky-100 border border-sky-200 text-sky-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                            title="Thu nhỏ"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-bold text-sky-900 min-w-[32px] text-center">
                            {Math.round(item.scale * 100)}%
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScale(item, 0.1);
                            }}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-sky-100 border border-sky-200 text-sky-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                            title="Phóng to"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
