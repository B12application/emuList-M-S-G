import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaSync, FaShieldAlt, FaTrophy, FaStar } from 'react-icons/fa';
import { PiSoccerBallFill } from 'react-icons/pi';
import {
  AVAILABLE_FOOTBALL_TEAMS,
  getSelectedTeamIds,
  saveSelectedTeamIds,
  type FootballTeam
} from '../../services/footballFixtureService';
import toast from 'react-hot-toast';

interface TeamFixtureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TeamFixtureModal({ isOpen, onClose, onSaved }: TeamFixtureModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'superlig' | 'championsleague'>('all');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(getSelectedTeamIds());
    }
  }, [isOpen]);

  const toggleTeam = (teamId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(teamId)) {
        if (prev.length === 1) {
          toast.error('En az bir takım seçili olmalıdır.');
          return prev;
        }
        return prev.filter(id => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  };

  const handleSelectQuick = (type: 'gs' | 'big4' | 'top_cl') => {
    if (type === 'gs') {
      setSelectedIds(['galatasaray']);
    } else if (type === 'big4') {
      setSelectedIds(['galatasaray', 'fenerbahce', 'besiktas', 'trabzonspor']);
    } else if (type === 'top_cl') {
      setSelectedIds(['galatasaray', 'realmadrid', 'mancity', 'arsenal', 'barcelona', 'bayern']);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveSelectedTeamIds(selectedIds);
      toast.success(`${selectedIds.length} takımın maç takvimi güncellendi! ⚽`);
      onSaved();
      onClose();
    } catch {
      toast.error('Ayarlar kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const superligTeams = AVAILABLE_FOOTBALL_TEAMS.filter(t => t.league === 'superlig');
  const clTeams = AVAILABLE_FOOTBALL_TEAMS.filter(t => t.league === 'championsleague');

  const displayedTeams = activeTab === 'superlig' 
    ? superligTeams 
    : activeTab === 'championsleague' 
      ? clTeams 
      : AVAILABLE_FOOTBALL_TEAMS;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-stone-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-stone-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-stone-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shadow-inner border border-amber-400/30">
                <PiSoccerBallFill />
              </div>
              <div>
                <h3 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                  Maç Takvimi & Takım Seçimi
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                    {selectedIds.length} Seçili
                  </span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Seçtiğiniz takımların lig ve Avrupa maçları takviminizde otomatik görüntülenir.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Quick Filter Bar */}
          <div className="px-6 py-3 bg-stone-100/60 dark:bg-zinc-900/60 border-b border-stone-200/50 dark:border-zinc-800/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-stone-200 dark:border-zinc-700/60 shadow-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Tümü ({AVAILABLE_FOOTBALL_TEAMS.length})
              </button>
              <button
                onClick={() => setActiveTab('superlig')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'superlig'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span>🇹🇷 Süper Lig</span>
              </button>
              <button
                onClick={() => setActiveTab('championsleague')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'championsleague'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span>🏆 Şampiyonlar Ligi</span>
              </button>
            </div>

            {/* Fast Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline">Hızlı:</span>
              <button
                onClick={() => handleSelectQuick('gs')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors border border-amber-500/20"
              >
                Sadece GS
              </button>
              <button
                onClick={() => handleSelectQuick('big4')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-300 dark:hover:bg-zinc-700 transition-colors"
              >
                4 Büyükler
              </button>
              <button
                onClick={() => handleSelectQuick('top_cl')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 transition-colors border border-indigo-500/20"
              >
                GS + Avrupa Devleri
              </button>
            </div>
          </div>

          {/* Teams Grid (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedTeams.map(team => {
                const isSelected = selectedIds.includes(team.id);

                return (
                  <motion.div
                    key={team.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTeam(team.id)}
                    className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-400/10 dark:bg-amber-400/15 border-amber-400 shadow-md shadow-amber-500/15'
                        : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800/80 hover:border-stone-300 dark:hover:border-zinc-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Club Logo & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-zinc-800 p-1.5 flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-zinc-700/60 shadow-xs">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback icon if image fails
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-stone-900 dark:text-white truncate">
                            {team.name}
                          </h4>
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 shrink-0">
                            {team.shortName}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 truncate block">
                          {team.leagueName}
                        </span>
                      </div>
                    </div>

                    {/* Checkbox / Toggle Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 shadow-xs font-black'
                          : 'border-2 border-stone-300 dark:border-zinc-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <FaCheck className="text-xs" />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-stone-100 dark:border-zinc-800/80 bg-stone-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
              Seçilen takımların maçları Aylık, Haftalık ve Günlük ajandaya senkronize edilir.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-sm hover:bg-stone-300 dark:hover:bg-zinc-700 transition-colors"
              >
                İptal
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center gap-2"
              >
                {isSaving ? <FaSync className="animate-spin text-sm" /> : <FaCheck className="text-sm" />}
                <span>Seçimi Kaydet ({selectedIds.length})</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
