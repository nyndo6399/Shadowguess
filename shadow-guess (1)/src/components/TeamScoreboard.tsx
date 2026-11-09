/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Team } from '../types/game';
import { Plus, Minus, RotateCcw, Edit2, Check, Target } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface TeamScoreboardProps {
  teams: Team[];
  activeTeamId: string | null;
  onSelectActiveTeam: (id: string) => void;
  onUpdateTeams: (teams: Team[]) => void;
  onAddScore: (teamId: string, delta: number) => void;
}

export const TeamScoreboard: React.FC<TeamScoreboardProps> = ({
  teams,
  activeTeamId,
  onSelectActiveTeam,
  onUpdateTeams,
  onAddScore,
}) => {
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Add team (up to 4)
  const handleAddTeam = () => {
    if (teams.length >= 4) return;
    soundEngine.playClick();
    const nextIdx = teams.length + 1;
    const colors = ['#4f46e5', '#2563eb', '#059669', '#d97706'];
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: `Team ${nextIdx}`,
      color: colors[(nextIdx - 1) % colors.length],
      score: 0,
    };
    onUpdateTeams([...teams, newTeam]);
  };

  // Remove team
  const handleRemoveTeam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (teams.length <= 1) return;
    soundEngine.playClick();
    const filtered = teams.filter((t) => t.id !== id);
    onUpdateTeams(filtered);
    if (activeTeamId === id) {
      onSelectActiveTeam(filtered[0].id);
    }
  };

  const handleStartRename = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTeamId(team.id);
    setEditingName(team.name);
  };

  const handleSaveRename = (teamId: string) => {
    if (!editingName.trim()) return;
    const updated = teams.map((t) =>
      t.id === teamId ? { ...t, name: editingName.trim() } : t
    );
    onUpdateTeams(updated);
    setEditingTeamId(null);
    soundEngine.playClick();
  };

  const [resetFeedback, setResetFeedback] = useState<boolean>(false);

  const handleResetScores = () => {
    soundEngine.playClick();
    onUpdateTeams(teams.map((t) => ({ ...t, score: 0 })));
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 2000);
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-2 sm:px-4 py-1 flex items-center justify-between gap-2 select-none">
      {/* Ultra-compact score cards matching image_fd6887cb.png */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none flex-1">
        {teams.map((team, idx) => {
          const isActive = activeTeamId === team.id;
          const isEditing = editingTeamId === team.id;
          const subtitle = isActive
            ? 'Current turn'
            : idx === 1
            ? 'Sharky team'
            : 'Chọn lượt';

          return (
            <div
              key={team.id}
              onClick={() => {
                soundEngine.playClick();
                onSelectActiveTeam(team.id);
              }}
              className={`relative min-w-[150px] sm:min-w-[185px] md:min-w-[205px] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs ${
                isActive
                  ? 'bg-white border-2 border-indigo-500 ring-2 ring-indigo-200/60 shadow-xs'
                  : 'bg-white/95 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                {/* Team Name */}
                {isEditing ? (
                  <div
                    className="flex items-center gap-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(team.id)}
                      className="w-full px-1 py-0.5 rounded border border-indigo-400 text-[11px] font-bold text-slate-900 focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(team.id)}
                      className="p-0.5 bg-indigo-600 text-white rounded text-[10px] cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 truncate group">
                    <span className="text-xs font-bold text-slate-700 tracking-tight truncate">
                      {team.name}
                    </span>
                    <button
                      onClick={(e) => handleStartRename(team, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 transition-opacity"
                      title="Đổi tên"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {/* Score Controls: -10 / +10 */}
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      soundEngine.playWrong();
                      onAddScore(team.id, -10);
                    }}
                    className="w-5 h-5 rounded-md bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-700 font-extrabold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                    title="Trừ 10 điểm"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playCorrect();
                      onAddScore(team.id, 10);
                    }}
                    className="w-5 h-5 rounded-md bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 text-emerald-700 font-extrabold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                    title="Cộng 10 điểm"
                  >
                    +10
                  </button>

                  {teams.length > 2 && (
                    <button
                      onClick={(e) => handleRemoveTeam(team.id, e)}
                      className="text-slate-300 hover:text-rose-500 p-0.5 ml-0.5"
                      title="Xóa đội"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Score in pts & Quick Single-Team Reset */}
              <div className="flex items-baseline justify-between pt-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-extrabold text-indigo-600 font-fun tracking-tight tabular-nums">
                    {team.score} pts
                  </span>
                  {team.score !== 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playClick();
                        onUpdateTeams(teams.map((t) => (t.id === team.id ? { ...t, score: 0 } : t)));
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-amber-600 hover:bg-amber-50 px-1 py-0.2 rounded transition-colors"
                      title={`Reset điểm của ${team.name} về 0`}
                    >
                      Về 0
                    </button>
                  )}
                </div>

                {/* Turn Indicator */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold truncate">
                  {isActive ? (
                    <>
                      <Target className="w-3 h-3 text-rose-500 fill-rose-500/20 shrink-0" />
                      <span className="text-indigo-950 font-bold">Current turn</span>
                    </>
                  ) : (
                    <span>{subtitle}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extra score controls: Reset Điểm & Thêm đội */}
      <div className="flex items-center gap-1.5 shrink-0">
        {resetFeedback && (
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl animate-in fade-in duration-150">
            ✓ Đã về 0 pts
          </span>
        )}

        {/* Prominent Reset Điểm Button */}
        <button
          onClick={handleResetScores}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          title="Đặt lại điểm số tất cả các đội về 0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          <span>Reset điểm</span>
        </button>

        {teams.length < 4 && (
          <button
            onClick={handleAddTeam}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            title="Thêm đội mới (tối đa 4 đội)"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Thêm đội</span>
          </button>
        )}
      </div>
    </div>
  );
};
