// src/frontend/pages/MigrationPage.tsx
// Veri senkronizasyonu ve migrasyon işlemleri sayfası

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    FaSync, FaTags, FaCalendarAlt, FaClock, FaDatabase,
    FaTv, FaCheckCircle, FaInfoCircle, FaRocket, FaShieldAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { countItemsWithoutGenre, migrateGenresForUser } from '../../backend/services/genreMigrationService';
import { migrateReleaseDates } from '../../backend/services/releaseDateMigrationService';
import { migrateRuntimeAndImdb } from '../../backend/services/runtimeImdbMigrationService';
import { migrateToEpisodeTracking, checkNewSeasonsForUser, getSeriesCountForUser } from '../../backend/services/episodeMigrationService';
import { isAdmin } from '../../backend/config/adminConfig';
import PageHeaderBanner from '../components/ui/PageHeaderBanner';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function MigrationPage() {
    const { user } = useAuth();
    const { t } = useLanguage();

    // Confirmation dialog state
    const [confirmDialogState, setConfirmDialogState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'warning',
    });

    // Genre Migration States
    const [itemsWithoutGenre, setItemsWithoutGenre] = useState<number | null>(null);
    const [migrationLoading, setMigrationLoading] = useState(false);
    const [migrationProgress, setMigrationProgress] = useState({
        total: 0,
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        currentItem: '',
    });

    // Release Date Migration States
    const [releaseDateLoading, setReleaseDateLoading] = useState(false);
    const [releaseDateProgress, setReleaseDateProgress] = useState({
        current: 0,
        total: 0,
        title: '',
    });

    // Runtime/IMDb Migration States
    const [runtimeImdbLoading, setRuntimeImdbLoading] = useState(false);
    const [runtimeImdbProgress, setRuntimeImdbProgress] = useState({
        current: 0,
        total: 0,
        title: '',
    });

    // Episode Migration States
    const [episodeMigrationLoading, setEpisodeMigrationLoading] = useState(false);
    const [episodeMigrationProgress, setEpisodeMigrationProgress] = useState({
        current: 0,
        total: 0,
        title: '',
    });

    // New Season Check States
    const [seasonCheckLoading, setSeasonCheckLoading] = useState(false);
    const [seasonCheckProgress, setSeasonCheckProgress] = useState({
        current: 0,
        total: 0,
        title: '',
    });

    // Load count on mount
    useEffect(() => {
        if (user) {
            countItemsWithoutGenre(user.uid).then(setItemsWithoutGenre);
        }
    }, [user]);

    // 1. Genre Migration
    const triggerMigrateGenres = () => {
        if (!user) return;
        setConfirmDialogState({
            isOpen: true,
            title: t('migration.genreConfirmTitle'),
            message: `${itemsWithoutGenre ?? 0} ${t('migration.genreConfirmMessage')}`,
            variant: 'warning',
            onConfirm: executeMigrateGenres,
        });
    };

    const executeMigrateGenres = async () => {
        if (!user) return;
        setMigrationLoading(true);
        setMigrationProgress({ total: 0, processed: 0, updated: 0, skipped: 0, failed: 0, currentItem: '' });

        try {
            const result = await migrateGenresForUser(user.uid, (progress) => {
                setMigrationProgress(progress);
            }, false);

            toast.success(`✅ ${t('migration.completed')}! ${result.updated} ${t('migration.updatedCount')}`);
            setItemsWithoutGenre(0);
        } catch (error: any) {
            console.error('Migration error:', error);
            toast.error('Hata: ' + error.message);
        } finally {
            setMigrationLoading(false);
        }
    };

    // 2. Release Date Migration
    const triggerReleaseDateMigration = () => {
        if (!user) return;
        setConfirmDialogState({
            isOpen: true,
            title: t('migration.releaseDateConfirmTitle'),
            message: t('migration.releaseDateConfirmMessage'),
            variant: 'warning',
            onConfirm: executeReleaseDateMigration,
        });
    };

    const executeReleaseDateMigration = async () => {
        if (!user) return;
        setReleaseDateLoading(true);
        setReleaseDateProgress({ current: 0, total: 0, title: '' });

        try {
            const result = await migrateReleaseDates(user.uid, (current, total, title) => {
                setReleaseDateProgress({ current, total, title });
            });

            toast.success(`✅ ${t('migration.completed')}! ${result.updated} ${t('migration.updatedCount')}`);
        } catch (error: any) {
            console.error('Release date migration error:', error);
            toast.error('Hata: ' + error.message);
        } finally {
            setReleaseDateLoading(false);
        }
    };

    // 3. Runtime & IMDb Migration
    const triggerRuntimeImdbMigration = () => {
        if (!user) return;
        setConfirmDialogState({
            isOpen: true,
            title: t('migration.runtimeImdbConfirmTitle'),
            message: t('migration.runtimeImdbConfirmMessage'),
            variant: 'warning',
            onConfirm: executeRuntimeImdbMigration,
        });
    };

    const executeRuntimeImdbMigration = async () => {
        if (!user) return;
        setRuntimeImdbLoading(true);
        setRuntimeImdbProgress({ current: 0, total: 0, title: '' });

        try {
            const result = await migrateRuntimeAndImdb(user.uid, (current, total, title) => {
                setRuntimeImdbProgress({ current, total, title });
            });

            toast.success(`✅ ${t('migration.completed')}! ${result.updated} ${t('migration.updatedCount')}`);
        } catch (error: any) {
            console.error('Runtime IMDb migration error:', error);
            toast.error('Hata: ' + error.message);
        } finally {
            setRuntimeImdbLoading(false);
        }
    };

    // 4. Episode Migration
    const triggerEpisodeMigration = () => {
        if (!user) return;
        setConfirmDialogState({
            isOpen: true,
            title: t('migration.episodeConfirmTitle'),
            message: t('migration.episodeConfirmMessage'),
            variant: 'warning',
            onConfirm: executeEpisodeMigration,
        });
    };

    const executeEpisodeMigration = async () => {
        if (!user) return;
        setEpisodeMigrationLoading(true);
        setEpisodeMigrationProgress({ current: 0, total: 0, title: '' });

        try {
            const result = await migrateToEpisodeTracking(user.uid, (progress) => {
                setEpisodeMigrationProgress(progress);
            });

            toast.success(`✅ ${t('migration.completed')}! ${result.updated} ${t('migration.updatedCount')}`);
        } catch (error: any) {
            console.error('Episode migration error:', error);
            toast.error('Hata: ' + error.message);
        } finally {
            setEpisodeMigrationLoading(false);
        }
    };

    // 5. Season Check (Admin)
    const triggerNewSeasonCheck = async () => {
        if (!user) return;
        const toastId = toast.loading('Dizi sayısı kontrol ediliyor...');

        try {
            const count = await getSeriesCountForUser(user.uid);
            toast.dismiss(toastId);

            setConfirmDialogState({
                isOpen: true,
                title: t('migration.seasonCheckConfirmTitle'),
                message: t('migration.seasonCheckFoundSeries').replace('{count}', String(count)),
                variant: 'warning',
                onConfirm: executeNewSeasonCheck,
            });
        } catch (error: any) {
            toast.dismiss(toastId);
            console.error('Error fetching series count:', error);
            toast.error('Dizi sayısı alınamadı: ' + error.message);
        }
    };

    const executeNewSeasonCheck = async () => {
        if (!user) return;
        setSeasonCheckLoading(true);
        setSeasonCheckProgress({ current: 0, total: 0, title: '' });

        try {
            const result = await checkNewSeasonsForUser(user.uid, (progress) => {
                setSeasonCheckProgress(progress);
            });

            if (result.details && result.details.length > 0) {
                toast.success(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold">✅ Güncelleme Tamamlandı!</span>
                        <div className="text-sm max-h-48 overflow-y-auto mt-1">
                            {result.details.map((detail, idx) => (
                                <div key={idx}>• {detail}</div>
                            ))}
                        </div>
                    </div>,
                    { duration: 8000 }
                );
            } else {
                toast.success('✅ Kontrol tamamlandı. Yeni sezon veya bölüm bulunamadı.');
            }
        } catch (error: any) {
            console.error('Season check error:', error);
            toast.error('Kontrol hatası: ' + error.message);
        } finally {
            setSeasonCheckLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-16">
            {/* Page Header Banner */}
            <PageHeaderBanner
                title={t('migration.title')}
                subtitle={t('migration.subtitle')}
                icon={<FaDatabase />}
                backTo="/settings"
                backLabel={t('settings.title')}
            />

            <div className="w-full mx-auto space-y-6">
                {/* Modern Info Banner */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 dark:border-amber-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-md">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-lg">
                            <FaInfoCircle />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white mb-1">
                                {t('migration.importantInfoTitle')}
                            </h3>
                            <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-400 leading-relaxed">
                                {t('migration.importantInfoDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Migration Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* 1. Genre Migration Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-lg border border-stone-200 dark:border-zinc-800 relative overflow-hidden transition-all hover:shadow-xl">
                        {itemsWithoutGenre === 0 && (
                            <div className="absolute top-5 right-5">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-300 dark:border-emerald-800">
                                    <FaCheckCircle />
                                    {t('migration.completed')}
                                </span>
                            </div>
                        )}

                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
                                <FaTags />
                            </div>
                            <div className="pr-12">
                                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                                    {t('migration.genreTitle')}
                                </h2>
                                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                    {t('migration.genreDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="mb-5 p-3.5 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/60 dark:border-zinc-800">
                            <span className={`text-xs font-bold flex items-center gap-2 ${itemsWithoutGenre === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-zinc-300'}`}>
                                <span className={`w-2 h-2 rounded-full ${itemsWithoutGenre === 0 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                {itemsWithoutGenre !== null && itemsWithoutGenre > 0
                                    ? `${itemsWithoutGenre} ${t('migration.genreMissing')}`
                                    : t('migration.genreAllPresent')
                                }
                            </span>
                        </div>

                        {migrationLoading ? (
                            <div className="space-y-3 p-4 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-200/60 dark:border-sky-800/40">
                                <div className="flex items-center gap-2 text-xs font-bold text-sky-900 dark:text-sky-200">
                                    <FaSync className="animate-spin text-sky-500" />
                                    <span className="truncate">{migrationProgress.currentItem || t('migration.processing')}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-sky-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${migrationProgress.total > 0 ? (migrationProgress.processed / migrationProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                                    <span>{migrationProgress.processed} / {migrationProgress.total}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">✓ {migrationProgress.updated} {t('migration.updatedCount')}</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={triggerMigrateGenres}
                                disabled={itemsWithoutGenre === 0}
                                className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 font-bold rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer ${itemsWithoutGenre === 0
                                    ? 'bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
                                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/25'
                                    }`}
                            >
                                {itemsWithoutGenre === 0 ? (
                                    <>
                                        <FaCheckCircle className="text-emerald-500" />
                                        <span>{t('migration.migrationCompleted')}</span>
                                    </>
                                ) : (
                                    <>
                                        <FaRocket />
                                        <span>{t('migration.startMigration')}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* 2. Release Date Migration Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-lg border border-stone-200 dark:border-zinc-800 relative overflow-hidden transition-all hover:shadow-xl">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
                                <FaCalendarAlt />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                                    {t('migration.releaseDateTitle')}
                                </h2>
                                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                    {t('migration.releaseDateDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="mb-5 p-3.5 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/60 dark:border-zinc-800">
                            <span className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                {t('migration.releaseDateStatus')}
                            </span>
                        </div>

                        {releaseDateLoading ? (
                            <div className="space-y-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                    <FaSync className="animate-spin text-emerald-500" />
                                    <span className="truncate">{releaseDateProgress.title || t('migration.processing')}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${releaseDateProgress.total > 0 ? (releaseDateProgress.current / releaseDateProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                                    <span>{releaseDateProgress.current} / {releaseDateProgress.total}</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={triggerReleaseDateMigration}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/25 active:scale-98 cursor-pointer"
                            >
                                <FaRocket />
                                <span>{t('migration.startMigration')}</span>
                            </button>
                        )}
                    </div>

                    {/* 3. Runtime & IMDb Migration Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-lg border border-stone-200 dark:border-zinc-800 relative overflow-hidden transition-all hover:shadow-xl">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
                                <FaClock />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                                    {t('migration.runtimeImdbTitle')}
                                </h2>
                                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                    {t('migration.runtimeImdbDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="mb-5 p-3.5 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/60 dark:border-zinc-800">
                            <span className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                {t('migration.runtimeImdbStatus')}
                            </span>
                        </div>

                        {runtimeImdbLoading ? (
                            <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200/60 dark:border-purple-800/40">
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                                    <FaSync className="animate-spin text-purple-500" />
                                    <span className="truncate">{runtimeImdbProgress.title || t('migration.processing')}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${runtimeImdbProgress.total > 0 ? (runtimeImdbProgress.current / runtimeImdbProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                                    <span>{runtimeImdbProgress.current} / {runtimeImdbProgress.total}</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={triggerRuntimeImdbMigration}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-md shadow-purple-600/25 active:scale-98 cursor-pointer"
                            >
                                <FaRocket />
                                <span>{t('migration.startMigration')}</span>
                            </button>
                        )}
                    </div>

                    {/* 4. Episode Migration Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-lg border border-stone-200 dark:border-zinc-800 relative overflow-hidden transition-all hover:shadow-xl">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
                                <FaTv />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                                    {t('migration.episodeTitle')}
                                </h2>
                                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                    {t('migration.episodeDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="mb-5 p-3.5 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/60 dark:border-zinc-800">
                            <span className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                {t('migration.episodeStatus')}
                            </span>
                        </div>

                        {episodeMigrationLoading ? (
                            <div className="space-y-3 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40">
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                    <FaSync className="animate-spin text-indigo-500" />
                                    <span className="truncate">{episodeMigrationProgress.title || t('migration.processing')}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${episodeMigrationProgress.total > 0 ? (episodeMigrationProgress.current / episodeMigrationProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                                    <span>{episodeMigrationProgress.current} / {episodeMigrationProgress.total}</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={triggerEpisodeMigration}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/25 active:scale-98 cursor-pointer"
                            >
                                <FaRocket />
                                <span>{t('migration.startMigration')}</span>
                            </button>
                        )}
                    </div>

                    {/* 5. Admin Only: New Season Check Card */}
                    {user && isAdmin(user.uid) && (
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-lg border border-rose-200 dark:border-rose-900/40 relative overflow-hidden transition-all hover:shadow-xl lg:col-span-2">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
                                    <FaShieldAlt />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                                            {t('migration.seasonCheckTitle')}
                                        </h2>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                            Admin
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                        {t('migration.seasonCheckDesc')}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-5 p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/60 dark:border-rose-900/30">
                                <span className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    {t('migration.seasonCheckStatus')}
                                </span>
                            </div>

                            {seasonCheckLoading ? (
                                <div className="space-y-3 p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200/60 dark:border-rose-800/40">
                                    <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-200">
                                        <FaSync className="animate-spin text-rose-500" />
                                        <span className="truncate">{seasonCheckProgress.title || t('migration.processing')}</span>
                                    </div>
                                    <div className="w-full bg-stone-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${seasonCheckProgress.total > 0 ? (seasonCheckProgress.current / seasonCheckProgress.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                                        <span>{seasonCheckProgress.current} / {seasonCheckProgress.total}</span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={triggerNewSeasonCheck}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition-all shadow-md shadow-rose-600/25 active:scale-98 cursor-pointer"
                                >
                                    <FaRocket />
                                    <span>{t('migration.seasonCheckBtn')}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Informative Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white mb-4 flex items-center gap-2.5">
                        <FaInfoCircle className="text-amber-500" />
                        {t('migration.aboutTitle')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 dark:text-zinc-400">
                        <div className="flex items-start gap-2 p-3 bg-stone-50 dark:bg-zinc-800/50 rounded-xl">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{t('migration.aboutPoint1')}</span>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-stone-50 dark:bg-zinc-800/50 rounded-xl">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{t('migration.aboutPoint2')}</span>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-stone-50 dark:bg-zinc-800/50 rounded-xl">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{t('migration.aboutPoint3')}</span>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-stone-50 dark:bg-zinc-800/50 rounded-xl">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{t('migration.aboutPoint4')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Unified Standard Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialogState.isOpen}
                onClose={() => setConfirmDialogState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialogState.onConfirm}
                title={confirmDialogState.title}
                message={confirmDialogState.message}
                confirmText={t('common.confirm') || 'Onayla'}
                cancelText={t('common.cancel') || 'İptal'}
                variant={confirmDialogState.variant}
            />
        </div>
    );
}