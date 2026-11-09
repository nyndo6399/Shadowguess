/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Link as LinkIcon,
  ClipboardPaste,
  Upload,
  Check,
  Wand2,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { soundEngine, speakWord } from '../utils/audio';
import {
  fileToDataUrl,
  removeLightBackground,
  generateSolidSilhouette,
  getRandomShadowColor,
  isValidImageUrl,
} from '../utils/imageProcessing';
import { GameItem } from '../types/game';

interface AddImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (newItem: GameItem) => void;
  currentItemCount: number;
}

export const AddImageModal: React.FC<AddImageModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  currentItemCount,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'url' | 'upload'>('paste');
  const [word, setWord] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [selectedShadowColor, setSelectedShadowColor] = useState<string>('#000000');
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [bgTolerance, setBgTolerance] = useState<number>(32);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const pasteAreaRef = useRef<HTMLDivElement>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setWord('');
      setImageUrl('');
      setProcessedUrl('');
      setStatusMessage('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Process image for background removal whenever imageUrl, autoRemoveBg, or bgTolerance changes
  useEffect(() => {
    let isCancelled = false;
    if (!imageUrl) {
      setProcessedUrl('');
      return;
    }

    if (autoRemoveBg) {
      setIsLoading(true);
      removeLightBackground(imageUrl, bgTolerance)
        .then((result) => {
          if (!isCancelled) {
            setProcessedUrl(result);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setProcessedUrl(imageUrl);
            setIsLoading(false);
          }
        });
    } else {
      setProcessedUrl(imageUrl);
    }

    return () => {
      isCancelled = true;
    };
  }, [imageUrl, autoRemoveBg, bgTolerance]);

  // Global paste handler when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Look for image file first
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            soundEngine.playClick();
            setIsLoading(true);
            const dataUrl = await fileToDataUrl(file);
            setImageUrl(dataUrl);
            setActiveTab('paste');
            setStatusMessage('Đã dán ảnh từ clipboard thành công!');
            return;
          }
        }
      }

      // Look for text string (may be an image URL)
      const text = e.clipboardData?.getData('text');
      if (text && isValidImageUrl(text.trim())) {
        e.preventDefault();
        soundEngine.playClick();
        setImageUrl(text.trim());
        setActiveTab('url');
        setStatusMessage('Đã nhận diện liên kết ảnh!');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle direct file input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    soundEngine.playClick();
    setIsLoading(true);
    const dataUrl = await fileToDataUrl(file);
    setImageUrl(dataUrl);
    if (!word) {
      const suggestedWord = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setWord(suggestedWord);
    }
    setStatusMessage('Đã tải ảnh lên thành công!');
  };

  // Submit and add to game
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl && !processedUrl) {
      alert('Vui lòng thêm hình ảnh bằng URL hoặc dán ảnh!');
      return;
    }

    const finalWord = word.trim() || `Item ${currentItemCount + 1}`;
    const finalImage = processedUrl || imageUrl;

    // Calculate nice canvas position
    const col = currentItemCount % 4;
    const row = Math.floor(currentItemCount / 4);

    setIsLoading(true);
    let solidSilhouette = '';
    try {
      solidSilhouette = await generateSolidSilhouette(finalImage, selectedShadowColor || '#000000');
    } catch {
      solidSilhouette = finalImage;
    }
    setIsLoading(false);

    const newItem: GameItem = {
      id: `item-${Date.now()}`,
      word: finalWord,
      imageUrl: finalImage,
      silhouetteUrl: solidSilhouette,
      silhouetteColor: selectedShadowColor || '#000000',
      x: 20 + col * 20,
      y: 35 + (row % 3) * 22,
      scale: 1.0,
      numberLabel: currentItemCount + 1,
    };

    soundEngine.playCorrect();
    onAddItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Thêm hình câu hỏi mới
              </h3>
              <p className="text-xs text-slate-500">
                Thêm bằng URL hoặc sao chép và dán (Ctrl + V)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Method Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('paste');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-amber-600" />
              <span>Dán (Ctrl + V)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('url');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'url'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Liên kết URL</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('upload');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tải tệp</span>
            </button>
          </div>

          {/* Tab 1: Paste Area */}
          {activeTab === 'paste' && (
            <div
              ref={pasteAreaRef}
              tabIndex={0}
              className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/40 rounded-2xl p-6 text-center cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              <ClipboardPaste className="w-10 h-10 mx-auto text-amber-600 mb-2 animate-bounce" />
              <p className="text-sm font-bold text-slate-800">
                Nhấn <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded-md shadow-2xs font-mono text-xs">Ctrl + V</kbd> (hoặc <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded-md shadow-2xs font-mono text-xs">⌘ + V</kbd>) để dán ảnh
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có thể sao chép ảnh từ Google, Canva, chụp màn hình rồi dán trực tiếp vào đây.
              </p>
            </div>
          )}

          {/* Tab 2: URL Input */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Đường dẫn hình ảnh (Image URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/cute-fox.png"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-400 font-mono text-xs text-slate-800"
                />
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          {/* Tab 3: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Chọn ảnh từ máy tính của bạn
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
              />
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Image Preview & Background Removal Option */}
          {imageUrl && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-checkerboard flex items-center justify-center p-1 shrink-0 shadow-2xs">
                  {isLoading ? (
                    <span className="text-[10px] text-slate-400 animate-pulse">Đang xử lý...</span>
                  ) : (
                    <img
                      src={processedUrl || imageUrl}
                      alt="Xem trước"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRemoveBg}
                      onChange={(e) => setAutoRemoveBg(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded-sm focus:ring-amber-400"
                    />
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                      Tự động tách nền trắng / sáng
                    </span>
                  </label>

                  {autoRemoveBg && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500">Độ nhạy:</span>
                      <input
                        type="range"
                        min="15"
                        max="65"
                        value={bgTolerance}
                        onChange={(e) => setBgTolerance(Number(e.target.value))}
                        className="w-28 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-slate-600 font-bold">
                        {bgTolerance}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Word / Prompt Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Từ vựng / Câu hỏi hiển thị (Word or Phrase)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Ví dụ: watch a movie, ride a bicycle..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
              {word && (
                <button
                  type="button"
                  onClick={() => speakWord(word)}
                  className="p-2.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 transition-colors"
                  title="Nghe thử phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Shadow Color Selection (Bóng đen thuần hoặc màu tùy chọn) */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-800">
              Màu bóng hiển thị (Shadow Silhouette)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedShadowColor('#000000')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedShadowColor === '#000000'
                    ? 'bg-black text-white ring-2 ring-amber-400'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-black border border-white" />
                <span>Bóng đen thuần</span>
              </button>

              {['#092635', '#1B1A55', '#2C0B3B', '#3C1814', '#0D2F28', '#450a0a'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedShadowColor(c)}
                  className={`w-7 h-7 rounded-lg border transition-transform ${
                    selectedShadowColor === c
                      ? 'scale-110 ring-2 ring-amber-400 border-white'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}

              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                <span>Tự chọn</span>
                <input
                  type="color"
                  value={selectedShadowColor}
                  onChange={(e) => setSelectedShadowColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!imageUrl}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 ${
                imageUrl
                  ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Thêm vào câu hỏi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
