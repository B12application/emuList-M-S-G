import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaSync } from 'react-icons/fa';
import { PiSoccerBallFill } from 'react-icons/pi';
import {
  AVAILABLE_FOOTBALL_TEAMS,
  getSelectedTeamIds,
  saveSelectedTeamIds
} from '../../services/footballFixtureService';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

interface TeamFixtureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TeamFixtureModal({ isOpen, onClose, onSaved }: TeamFixtureModalProps) {
  const { t, language } = useLanguage();
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
          toast.error(language === 'tr' ? 'En az bir takım seçili olmalıdır.' : 'At least one team must be selected.');
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
      const msg = t('planner.fixturesSaved') 
        ? t('planner.fixturesSaved').replace('{count}', String(selectedIds.length))
        : (language === 'tr' ? `${selectedIds.length} takımın maç takvimi güncellendi! ⚽` : `Match calendar updated for ${selectedIds.length} teams! ⚽`);
      toast.success(msg);
      onSaved();
      onClose();
    } catch {
      toast.error(language === 'tr' ? 'Ayarlar kaydedilemedi.' : 'Failed to save settings.');
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
          className="absolute inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm"
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
                  {t('planner.fixturesTitle') || (language === 'tr' ? 'Maç Takvimi & Takım Seçimi' : 'Match Fixtures & Team Selection')}
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                    {selectedIds.length} {language === 'tr' ? 'Seçili' : 'Selected'}
                  </span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  {t('planner.fixturesDesc') || (language === 'tr' ? 'Seçtiğiniz takımların lig ve Avrupa maçları takviminizde otomatik görüntülenir.' : 'League and European matches for selected teams will appear on your calendar.')}
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
                {language === 'tr' ? 'Tümü' : 'All'} ({AVAILABLE_FOOTBALL_TEAMS.length})
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
                <span>🏆 {language === 'tr' ? 'Şampiyonlar Ligi' : 'Champions League'}</span>
              </button>
            </div>

            {/* Fast Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline">
                {language === 'tr' ? 'Hızlı:' : 'Quick:'}
              </span>
              <button
                onClick={() => handleSelectQuick('gs')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors border border-amber-500/20"
              >
                {language === 'tr' ? 'Sadece GS' : 'Only GS'}
              </button>
              <button
                onClick={() => handleSelectQuick('big4')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-300 dark:hover:bg-zinc-700 transition-colors"
              >
                {language === 'tr' ? '4 Büyükler' : 'Big 4'}
              </button>
              <button
                onClick={() => handleSelectQuick('top_cl')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 transition-colors border border-indigo-500/20"
              >
                {language === 'tr' ? 'GS + Avrupa Devleri' : 'GS + European Giants'}
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
          <div className="px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/80 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium hidden sm:inline">
              {language === 'tr' 
                ? 'Seçilen takımların maçları Aylık, Haftalık ve Günlük ajandaya senkronize edilir.' 
                : 'Matches of selected teams will be synchronized with Monthly, Weekly and Daily views.'}
            </span>
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-sm hover:bg-stone-300 dark:hover:bg-zinc-700 transition-colors"
              >
                {language === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center gap-2"
              >
                {isSaving ? <FaSync className="animate-spin text-sm" /> : <FaCheck className="text-sm" />}
                <span>{language === 'tr' ? `Seçimi Kaydet (${selectedIds.length})` : `Save Selection (${selectedIds.length})`}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
