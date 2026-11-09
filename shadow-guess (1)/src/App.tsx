/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Classroom, GameItem, Team } from './types/game';
import {
  loadClassrooms,
  loadClassroomsAsync,
  saveClassrooms,
  loadActiveId,
  loadActiveIdAsync,
  saveActiveId,
  exportAllClassroomsBackup,
} from './utils/storage';
import { soundEngine } from './utils/audio';
import { Header } from './components/Header';
import { CoverScreen } from './components/CoverScreen';
import { GameCanvas } from './components/GameCanvas';
import { TeamScoreboard } from './components/TeamScoreboard';
import { EditModal } from './components/EditModal';
import { ClassModal } from './components/ClassModal';
import { AddImageModal } from './components/AddImageModal';
import { BackgroundModal } from './components/BackgroundModal';
import { PRESET_BACKGROUNDS } from './utils/defaultData';
import { isValidImageUrl, processItemImage } from './utils/imageProcessing';
import { Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY_TEAMS = 'shadow_guess_teams_v1';

// Fisher-Yates array shuffle helper (cho các từ đọc xáo trộn)
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function App() {
  // --- Persistent Classroom State (IndexedDB + localStorage fallback) ---
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => loadClassrooms());
  const [activeClassId, setActiveClassId] = useState<string>(() => loadActiveId(classrooms));
  const [isStorageReady, setIsStorageReady] = useState<boolean>(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());

  // Current active classroom
  const activeClass = useMemo(() => {
    return classrooms.find((c) => c.id === activeClassId) || classrooms[0];
  }, [classrooms, activeClassId]);

  // --- Team Scoring State (Hệ thống tính điểm đồng đội 1-4 đội) ---
  const [teams, setTeams] = useState<Team[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_TEAMS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // fallback
      }
    }
    return [
      { id: 'team-1', name: 'Team 1', color: '#4f46e5', score: 0 },
      { id: 'team-2', name: 'Team 2', color: '#3b82f6', score: 0 },
    ];
  });
  const [activeTeamId, setActiveTeamId] = useState<string | null>(() => teams[0]?.id || null);

  // Save teams to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
      } catch {
        // ignore
      }
    }
  }, [teams]);

  // --- Modals State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEditModalMinimized, setIsEditModalMinimized] = useState<boolean>(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState<boolean>(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState<boolean>(false);
  const [classToDelete, setClassToDelete] = useState<Classroom | null>(null);

  // --- Shuffle Words State (Các từ đọc xáo trộn) ---
  const [isShuffleMode, setIsShuffleMode] = useState<boolean>(true);
  const [shuffledItemIds, setShuffledItemIds] = useState<string[]>([]);

  // --- Game Screen & Play State ---
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [revealedItemIds, setRevealedItemIds] = useState<string[]>([]);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Timer for active game
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpentSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Asynchronous persistent load from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    loadClassroomsAsync()
      .then(async (loaded) => {
        if (!isMounted) return;
        if (loaded && loaded.length > 0) {
          setClassrooms(loaded);
          const activeId = await loadActiveIdAsync(loaded);
          setActiveClassId(activeId);
        }
        setIsStorageReady(true);
      })
      .catch((err) => {
        console.warn('Async load failed, falling back to local state:', err);
        if (isMounted) setIsStorageReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save classrooms to storage (IndexedDB + localStorage) only when storage is fully initialized
  useEffect(() => {
    if (!isStorageReady) return;
    saveClassrooms(classrooms);
    setLastSavedTimestamp(Date.now());
  }, [classrooms, isStorageReady]);

  // Save active class ID
  useEffect(() => {
    if (!isStorageReady) return;
    if (activeClass?.id) {
      saveActiveId(activeClass.id);
    }
  }, [activeClass?.id, isStorageReady]);

  // Sound enable/disable
  useEffect(() => {
    soundEngine.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Global paste handler on document (Ctrl+V anywhere)
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          setIsAddImageModalOpen(true);
          return;
        }
      }

      const text = e.clipboardData?.getData('text');
      if (text && isValidImageUrl(text.trim())) {
        e.preventDefault();
        setIsAddImageModalOpen(true);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Re-generate shuffled order whenever activeClass changes
  useEffect(() => {
    if (activeClass?.items?.length) {
      const ids = activeClass.items.map((it) => it.id);
      setShuffledItemIds(shuffleArray(ids));
    } else {
      setShuffledItemIds([]);
    }
  }, [activeClass?.id, activeClass?.items?.length]);

  // Restart current classroom game
  const handleRestartGame = () => {
    soundEngine.playClick();
    setRevealedItemIds([]);
    setMistakesCount(0);
    setStartTime(Date.now());
    setTimeSpentSeconds(0);
    if (activeClass?.items?.length) {
      setShuffledItemIds(shuffleArray(activeClass.items.map((it) => it.id)));
    }
  };

  // Switch classroom
  const handleSelectClass = (id: string) => {
    setActiveClassId(id);
    setRevealedItemIds([]);
    setMistakesCount(0);
    setStartTime(Date.now());
    setTimeSpentSeconds(0);
    setSelectedItemId(null);
    const targetClass = classrooms.find((c) => c.id === id);
    if (targetClass?.items?.length) {
      setShuffledItemIds(shuffleArray(targetClass.items.map((it) => it.id)));
    }
  };

  // Xáo trộn lại thứ tự các từ chưa mở
  const handleReshuffleWords = () => {
    soundEngine.playClick();
    if (!activeClass || activeClass.items.length === 0) return;
    const unrevealed = activeClass.items
      .map((it) => it.id)
      .filter((id) => !revealedItemIds.includes(id));
    const newlyShuffled = shuffleArray(unrevealed);
    setShuffledItemIds([...revealedItemIds, ...newlyShuffled]);
  };

  // 1-Click Quick Add Classroom (thêm lớp dễ dàng tức thì không cần window.prompt)
  const handleQuickAddClass = () => {
    soundEngine.playClick();
    const count = classrooms.length + 1;
    const defaultName = `Lớp ${count} - Bộ từ vựng mới`;

    const newClass: Classroom = {
      id: `class-${Date.now()}`,
      name: defaultName,
      backgroundImageUrl: PRESET_BACKGROUNDS[0].url,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...classrooms, newClass];
    setClassrooms(updated);
    setActiveClassId(newClass.id);
    handleRestartGame();
    setIsEditModalOpen(true); // Open edit modal immediately so teacher can add pictures & rename
  };

  // 1-Click Quick Delete Classroom (xác nhận trong app, không dùng window.confirm)
  const handleQuickDeleteClass = (id: string) => {
    const target = classrooms.find((c) => c.id === id);
    if (target) {
      soundEngine.playClick();
      setClassToDelete(target);
    }
  };

  // Thực hiện xóa lớp học sau khi người dùng bấm xác nhận
  const handleConfirmDeleteClass = (id: string) => {
    soundEngine.playClick();
    const filtered = classrooms.filter((c) => c.id !== id);
    if (filtered.length === 0) {
      const freshClass: Classroom = {
        id: `class-${Date.now()}`,
        name: 'Lớp học mới (Chưa có câu hỏi)',
        backgroundImageUrl: PRESET_BACKGROUNDS[0].url,
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setClassrooms([freshClass]);
      setActiveClassId(freshClass.id);
    } else {
      setClassrooms(filtered);
      setActiveClassId(filtered[0].id);
    }
    handleRestartGame();
    setClassToDelete(null);
  };

  // Update current active classroom
  const handleUpdateActiveClassName = (updated: Classroom) => {
    const updatedClassrooms = classrooms.map((c) =>
      c.id === updated.id ? { ...updated, updatedAt: Date.now() } : c
    );
    setClassrooms(updatedClassrooms);
  };

  // Add new item to current classroom
  const handleAddItem = (newItem: GameItem) => {
    if (!activeClass) return;
    const updatedItems = [...activeClass.items, newItem];
    handleUpdateActiveClassName({ ...activeClass, items: updatedItems });
  };

  // Create new classroom from modal
  const handleCreateClass = (newClass: Classroom) => {
    const updated = [...classrooms, newClass];
    setClassrooms(updated);
    setActiveClassId(newClass.id);
    handleRestartGame();
  };

  // Update all classrooms from ClassModal
  const handleUpdateClassrooms = (newClasses: Classroom[]) => {
    setClassrooms(newClasses);
    if (!newClasses.some((c) => c.id === activeClassId) && newClasses.length > 0) {
      setActiveClassId(newClasses[0].id);
    }
  };

  // Update item position on canvas
  const handleUpdateItemPosition = (id: string, x: number, y: number) => {
    if (!activeClass) return;
    const updatedItems = activeClass.items.map((it) =>
      it.id === id ? { ...it, x, y } : it
    );
    handleUpdateActiveClassName({ ...activeClass, items: updatedItems });
  };

  // Tự động tách nền cho tất cả hình ảnh trong bài học hiện tại
  const handleAutoRemoveAllBackgrounds = async () => {
    if (!activeClass || activeClass.items.length === 0) return;
    soundEngine.playClick();

    const updatedItems = [];
    for (const it of activeClass.items) {
      try {
        const { cleanImageUrl, silhouetteUrl } = await processItemImage(
          it.imageUrl,
          it.silhouetteColor || '#000000',
          40
        );
        updatedItems.push({
          ...it,
          imageUrl: cleanImageUrl,
          silhouetteUrl,
        });
      } catch {
        updatedItems.push(it);
      }
    }

    handleUpdateActiveClassName({ ...activeClass, items: updatedItems });
    soundEngine.playCorrect();
    confetti({ particleCount: 35, spread: 70, origin: { y: 0.6 } });
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    soundEngine.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Add or subtract score for a team
  const handleAddTeamScore = (teamId: string, delta: number) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t))
    );
  };

  // Pick current question item (Xáo trộn ngẫu nhiên hoặc tuần tự)
  const currentQuestionItem = useMemo(() => {
    if (!activeClass || activeClass.items.length === 0) return null;

    if (isShuffleMode && shuffledItemIds.length > 0) {
      // Tìm ID câu hỏi tiếp theo trong danh sách đã xáo trộn chưa được mở
      const nextId = shuffledItemIds.find((id) => !revealedItemIds.includes(id));
      if (nextId) {
        return activeClass.items.find((it) => it.id === nextId) || null;
      }
    }

    // Tuần tự fallback nếu không xáo trộn
    return activeClass.items.find((it) => !revealedItemIds.includes(it.id)) || null;
  }, [activeClass, revealedItemIds, shuffledItemIds, isShuffleMode]);

  // Flip all items / Hide all shadows toggle (Thêm nút lật tất cả các hình lên)
  const handleToggleRevealAll = () => {
    soundEngine.playClick();
    if (!activeClass || activeClass.items.length === 0) return;
    const isAllRevealed =
      revealedItemIds.length === activeClass.items.length && activeClass.items.length > 0;
    if (isAllRevealed) {
      // Đang lật hết -> Úp bóng lại
      setRevealedItemIds([]);
    } else {
      // Lật tất cả các hình lên
      setRevealedItemIds(activeClass.items.map((it) => it.id));
      soundEngine.playVictory();
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.65 },
      });
    }
  };

  // Handle player clicking an item in game mode
  // "sai bao nhiêu lần đều được", "mỗi lần cộng 10 điểm , sai có thể trừ điểm"
  const handleGuessItem = (item: GameItem) => {
    if (!currentQuestionItem) return;

    if (item.id === currentQuestionItem.id) {
      // Correct!
      const newRevealed = [...revealedItemIds, item.id];
      setRevealedItemIds(newRevealed);

      // Automatically award +10 points to active team if selected
      if (activeTeamId) {
        handleAddTeamScore(activeTeamId, 10);
      }

      // Check if all are solved (Không mở popup che màn hình)
      if (newRevealed.length === activeClass.items.length) {
        soundEngine.playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      // Wrong guess: just increments mistakes counter (sai bao nhiêu lần đều được, không bị khóa game!)
      setMistakesCount((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40 text-slate-800">
      {/* Fullscreen Cover / Landing Screen with START NOW Button */}
      {!isGameStarted && (
        <CoverScreen
          onStartGame={() => {
            setIsGameStarted(true);
            setStartTime(Date.now());
            setTimeSpentSeconds(0);
          }}
          classrooms={classrooms}
          activeClass={activeClass}
          onSelectClass={handleSelectClass}
          onOpenClassModal={() => setIsClassModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Top Header */}
      <Header
        classrooms={classrooms}
        activeClass={activeClass}
        onSelectClass={handleSelectClass}
        onQuickAddClass={handleQuickAddClass}
        onQuickDeleteClass={handleQuickDeleteClass}
        onOpenClassModal={() => setIsClassModalOpen(true)}
        onOpenEditModal={() => {
          setIsEditModalOpen(true);
          setIsEditModalMinimized(false);
        }}
        onRestartGame={handleRestartGame}
        onGoHome={() => setIsGameStarted(false)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        lastSavedTimestamp={lastSavedTimestamp}
      />

      {/* Main Content Area (Scoreboard + Stage) - dynamically leaves space for Edit Drawer so NO items are hidden */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isEditModalOpen && !isEditModalMinimized
            ? 'sm:mr-[410px] md:mr-[440px]'
            : 'mr-0'
        }`}
      >
        {/* 2 Top Team Score Cards (Khớp với ảnh mẫu: Team 1 / Team 2 - 0 pts - Current turn) */}
        <TeamScoreboard
          teams={teams}
          activeTeamId={activeTeamId}
          onSelectActiveTeam={setActiveTeamId}
          onUpdateTeams={setTeams}
          onAddScore={handleAddTeamScore}
        />

        {/* Main Game Stage (Khung nền chơi to đều màn hình luôn) */}
        <main className="flex-1 flex flex-col justify-center px-1 sm:px-2 pb-2">
          {/* Game Canvas fills entire responsive screen */}
          <GameCanvas
            classroom={activeClass}
            isEditMode={isEditModalOpen}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            onUpdateItemPosition={handleUpdateItemPosition}
            onOpenEditModal={() => {
              setIsEditModalOpen(true);
              setIsEditModalMinimized(false);
            }}
            onRestartGame={handleRestartGame}
            onToggleRevealAll={handleToggleRevealAll}
            revealedItemIds={revealedItemIds}
            mistakesCount={mistakesCount}
            currentQuestionItem={currentQuestionItem}
            onGuessItem={handleGuessItem}
            isShuffleMode={isShuffleMode}
            onToggleShuffleMode={() => setIsShuffleMode(!isShuffleMode)}
            onReshuffleWords={handleReshuffleWords}
            onAutoRemoveAllBackgrounds={handleAutoRemoveAllBackgrounds}
          />
        </main>
      </div>

      {/* Edit Game Modal (Screenshot 2) */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        isMinimized={isEditModalMinimized}
        onToggleMinimize={() => setIsEditModalMinimized(!isEditModalMinimized)}
        classroom={activeClass}
        onUpdateClassroom={handleUpdateActiveClassName}
        selectedItemId={selectedItemId}
        onSelectItem={setSelectedItemId}
        onOpenAddImageModal={() => setIsAddImageModalOpen(true)}
        onOpenChangeBackgroundModal={() => setIsBackgroundModalOpen(true)}
        onDeleteCurrentClass={() => handleQuickDeleteClass(activeClass.id)}
      />

      {/* Classroom Manager Modal */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        classrooms={classrooms}
        activeClassId={activeClass.id}
        onSelectClass={handleSelectClass}
        onCreateClass={handleCreateClass}
        onUpdateClassrooms={handleUpdateClassrooms}
      />

      {/* Add Image via URL or Clipboard Modal */}
      <AddImageModal
        isOpen={isAddImageModalOpen}
        onClose={() => setIsAddImageModalOpen(false)}
        onAddItem={handleAddItem}
        currentItemCount={activeClass.items.length}
      />

      {/* Change Background Modal */}
      <BackgroundModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        currentBgUrl={activeClass.backgroundImageUrl}
        onSelectBackground={(url) => {
          handleUpdateActiveClassName({ ...activeClass, backgroundImageUrl: url });
        }}
      />

      {/* Delete Classroom In-App Confirmation Modal (Hoàn toàn không dùng window.confirm) */}
      {classToDelete && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-w-sm w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Xóa lớp học?
                </h3>
                <p className="text-xs text-slate-500">
                  Hành động này sẽ xóa toàn bộ câu hỏi của lớp
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa lớp <strong className="text-slate-900">"{classToDelete.name}"</strong> ({classToDelete.items.length} từ vựng)?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleConfirmDeleteClass(classToDelete.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
