/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Classroom } from '../types/game';
import {
  X,
  Plus,
  BookOpen,
  Copy,
  Trash2,
  Download,
  Upload,
  Check,
  Edit2,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import {
  exportClassroomToJson,
  exportAllClassroomsBackup,
  parseImportedJson,
  downloadStandaloneHtml,
} from '../utils/storage';
import { PRESET_BACKGROUNDS } from '../utils/defaultData';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onCreateClass: (newClass: Classroom) => void;
  onUpdateClassrooms: (classes: Classroom[]) => void;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  activeClassId,
  onSelectClass,
  onCreateClass,
  onUpdateClassrooms,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [selectedBgUrl, setSelectedBgUrl] = useState<string>(PRESET_BACKGROUNDS[0].url);
  const [maxMistakes, setMaxMistakes] = useState<number>(3);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Import JSON file (Supports both full backup and single classroom)
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = parseImportedJson(text);
        if (imported && imported.length > 0) {
          // Merge imported classrooms, avoiding duplicate IDs
          const existingIds = new Set(classrooms.map((c) => c.id));
          const newClasses: Classroom[] = [];

          for (const item of imported) {
            const safeId = existingIds.has(item.id) ? `class-import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : item.id;
            newClasses.push({
              ...item,
              id: safeId,
              name: existingIds.has(item.id) ? `${item.name} (Đã nhập)` : item.name,
              updatedAt: Date.now(),
            });
          }

          const combined = [...classrooms, ...newClasses];
          onUpdateClassrooms(combined);
          if (newClasses[0]) {
            onSelectClass(newClasses[0].id);
          }
          soundEngine.playCorrect();
          showToast('success', `Đã nhập thành công ${newClasses.length} lớp học (${newClasses.reduce((acc, c) => acc + c.items.length, 0)} từ)!`);
        } else {
          showToast('error', 'Tệp JSON không đúng định dạng của lớp học Shadow Guess!');
        }
      } catch (err) {
        showToast('error', 'Lỗi đọc tệp JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle creating a new class
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newClass: Classroom = {
      id: `class-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      backgroundImageUrl: selectedBgUrl,
      items: [],
      maxMistakes: maxMistakes || 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onCreateClass(newClass);
    setIsCreating(false);
    setNewName('');
    setNewDesc('');
    soundEngine.playCorrect();
    showToast('success', `Đã tạo lớp học mới "${newClass.name}"!`);
  };

  // Duplicate an existing classroom
  const handleDuplicate = (cls: Classroom) => {
    soundEngine.playClick();
    const duplicated: Classroom = {
      ...cls,
      id: `class-${Date.now()}`,
      name: `${cls.name} (Bản sao)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: cls.items.map((it, idx) => ({
        ...it,
        id: `item-dup-${Date.now()}-${idx}`,
      })),
    };
    onUpdateClassrooms([...classrooms, duplicated]);
    showToast('success', `Đã nhân bản lớp học "${duplicated.name}"!`);
  };

  // Delete a classroom directly without window.confirm (Xóa lớp học an toàn & tức thì)
  const executeDelete = (id: string) => {
    soundEngine.playClick();
    const filtered = classrooms.filter((c) => c.id !== id);
    if (filtered.length === 0) {
      const freshClass: Classroom = {
        id: `class-${Date.now()}`,
        name: 'Lớp học mới (Chưa có câu hỏi)',
        backgroundImageUrl: PRESET_BACKGROUNDS[0].url,
        items: [],
        maxMistakes: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onUpdateClassrooms([freshClass]);
      onSelectClass(freshClass.id);
    } else {
      onUpdateClassrooms(filtered);
      if (activeClassId === id) {
        onSelectClass(filtered[0].id);
      }
    }
    setConfirmDeleteId(null);
    showToast('success', 'Đã xóa lớp học!');
  };

  // Rename class
  const handleSaveRename = (id: string) => {
    if (!editingClassName.trim()) return;
    const updated = classrooms.map((c) =>
      c.id === id ? { ...c, name: editingClassName.trim(), updatedAt: Date.now() } : c
    );
    onUpdateClassrooms(updated);
    setEditingClassId(null);
    soundEngine.playClick();
    showToast('success', 'Đã lưu tên lớp mới!');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <BookOpen className="w-5 h-5 text-amber-700" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                Quản lý các lớp học (Classrooms)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Lưu trữ các bộ câu hỏi theo từng lớp, sao lưu và chia sẻ dữ liệu
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

        {/* Persistence Assurance Banner */}
        <div className="px-4 py-2 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[11px] font-bold text-emerald-900">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dữ liệu các lớp, hình ảnh và từ vựng tự động lưu vĩnh viễn trên máy (IndexedDB)</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium hidden sm:inline">Không mất khi đóng tab</span>
        </div>

        {/* Toast Alert Notification */}
        {toastMessage && (
          <div
            className={`mx-4 mt-3 px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span className="flex-1">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-500 hover:text-slate-800 text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Toolbar: Create new, Export All & Import JSON */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              setIsCreating(!isCreating);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Đóng tạo mới' : 'Tạo lớp học mới'}</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                soundEngine.playCorrect();
                downloadStandaloneHtml();
                showToast('success', 'Đã tải tệp HTML duy nhất (offline)! Mở tệp trực tiếp trong trình duyệt để chơi.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title="Tải toàn bộ ứng dụng thành 1 file HTML duy nhất để chơi offline không cần mạng"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tải file HTML Offline</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                exportAllClassroomsBackup(classrooms);
                showToast('success', 'Đã tải tệp sao lưu toàn bộ các lớp về máy!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title="Tải toàn bộ các lớp học và hình ảnh về máy (.json) để lưu trữ dự phòng"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sao lưu tất cả (.json)</span>
            </button>

            <button
              onClick={() => jsonInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title="Nhập lớp học hoặc tệp sao lưu JSON"
            >
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              <span>Nhập tệp JSON</span>
            </button>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>
        </div>

        {/* Creation Form Accordion */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-4 sm:p-5 bg-amber-50/50 border-b border-amber-200/80 space-y-3 animate-in slide-in-from-top-4 duration-200"
          >
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">Tên lớp học *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Lớp 4A - Động vật rừng xanh (Wild Animals)"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Mô tả ngắn (tùy chọn)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Ví dụ: Luyện từ vựng Unit 3 sách giáo khoa"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Background picker */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Chọn hình nền mặc định
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setSelectedBgUrl(bg.url)}
                    className={`relative rounded-xl overflow-hidden border-2 p-1 transition-all ${
                      selectedBgUrl === bg.url
                        ? 'border-amber-500 ring-2 ring-amber-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${bg.url})` }}
                    />
                    <span className="block text-[10px] font-bold text-slate-700 truncate mt-1">
                      {bg.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Lưu lớp học
              </button>
            </div>
          </form>
        )}

        {/* Classes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {classrooms.map((cls) => {
            const isActive = cls.id === activeClassId;
            const isEditing = editingClassId === cls.id;

            return (
              <div
                key={cls.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-amber-50/70 border-amber-300 shadow-sm ring-1 ring-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-16 h-12 rounded-xl bg-cover bg-center border border-slate-200 shrink-0 shadow-2xs"
                      style={{ backgroundImage: `url(${cls.backgroundImageUrl})` }}
                    />

                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingClassName}
                            onChange={(e) => setEditingClassName(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-amber-400 text-xs font-bold text-slate-900 focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(cls.id)}
                            className="p-1 bg-amber-500 text-white rounded-lg text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                            {cls.name}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full">
                              Đang mở
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cls.items.length} hình câu hỏi • Tối đa {cls.maxMistakes || 3} lần sai
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {!isActive && (
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          onSelectClass(cls.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Chọn chơi
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingClassId(cls.id);
                        setEditingClassName(cls.name);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                      title="Đổi tên lớp"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(cls)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                      title="Nhân bản lớp này"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => exportClassroomToJson(cls)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                      title="Xuất file JSON sao lưu"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-600" />
                    </button>

                    {confirmDeleteId === cls.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl animate-in fade-in">
                        <span className="text-[11px] font-bold text-rose-700">Xóa lớp?</span>
                        <button
                          onClick={() => executeDelete(cls.id)}
                          className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black shadow-2xs transition-colors cursor-pointer"
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(cls.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors border border-rose-100 text-xs font-bold cursor-pointer"
                        title="Xóa lớp học này"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Xóa lớp</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
