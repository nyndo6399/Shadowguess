/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Image as ImageIcon, Link as LinkIcon, Upload, Check } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { PRESET_BACKGROUNDS } from '../utils/defaultData';
import { fileToDataUrl, isValidImageUrl } from '../utils/imageProcessing';

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBgUrl: string;
  onSelectBackground: (url: string) => void;
}

export const BackgroundModal: React.FC<BackgroundModalProps> = ({
  isOpen,
  onClose,
  currentBgUrl,
  onSelectBackground,
}) => {
  const [customUrl, setCustomUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>(currentBgUrl);

  if (!isOpen) return null;

  const handleApplyPreset = (url: string) => {
    soundEngine.playClick();
    onSelectBackground(url);
    onClose();
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    if (isValidImageUrl(customUrl.trim())) {
      soundEngine.playClick();
      onSelectBackground(customUrl.trim());
      onClose();
    } else {
      setErrorMessage('Đường dẫn URL hình ảnh không hợp lệ!');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    soundEngine.playClick();
    const dataUrl = await fileToDataUrl(file, 1600);
    onSelectBackground(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ImageIcon className="w-5 h-5 text-amber-700" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Đổi hình nền hoạt cảnh
              </h3>
              <p className="text-xs text-slate-500">
                Chọn hình nền sẵn có, tải tệp hoặc nhập link URL
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

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Preset options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hình nền có sẵn
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_BACKGROUNDS.map((bg) => {
                const isSelected = currentBgUrl === bg.url;
                return (
                  <button
                    key={bg.id}
                    onClick={() => handleApplyPreset(bg.url)}
                    className={`group relative rounded-2xl overflow-hidden border-2 p-1.5 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-300'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div
                      className="w-full h-24 rounded-xl bg-cover bg-center shadow-inner"
                      style={{ backgroundImage: `url(${bg.url})` }}
                    />
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {bg.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom URL */}
          <form onSubmit={handleApplyCustomUrl} className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hoặc nhập liên kết ảnh URL
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="https://example.com/background.jpg"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                Áp dụng
              </button>
            </div>
            {errorMessage && (
              <p className="text-[11px] font-bold text-rose-600 mt-1">{errorMessage}</p>
            )}
          </form>

          {/* Upload File */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tải ảnh nền từ máy tính
            </label>
            <label className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-2xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-colors text-slate-600 hover:text-amber-800">
              <Upload className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-bold">Chọn tệp ảnh nền từ thiết bị</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
