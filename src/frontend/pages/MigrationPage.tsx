// src/frontend/pages/MigrationPage.tsx
// Veri migrasyon işlemleri sayfası

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaSync, FaTags, FaCalendarAlt, FaClock, FaDatabase } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { countItemsWithoutGenre, migrateGenresForUser } from '../../backend/services/genreMigrationService';
import { migrateReleaseDates } from '../../backend/services/releaseDateMigrationService';
import { migrateRuntimeAndImdb } from '../../backend/services/runtimeImdbMigrationService';

export default function MigrationPage() {
    const { user } = useAuth();

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

    // Load count on mount
    useEffect(() => {
        if (user) {
            countItemsWithoutGenre(user.uid).then(setItemsWithoutGenre);
        }
    }, [user]);

    const handleMigrateGenres = async () => {
        if (!user) return;

        const confirmed = window.confirm(
            `${itemsWithoutGenre} kayıt için tür bilgisi eklenecek.\n\nBu işlem API çağrısı yapacağı için biraz zaman alabilir.\n\nDevam etmek istiyor musunuz?`
        );

        if (!confirmed) return;

        setMigrationLoading(true);
        setMigrationProgress({ total: 0, processed: 0, updated: 0, skipped: 0, failed: 0, currentItem: '' });

        try {
            const result = await migrateGenresForUser(user.uid, (progress) => {
                setMigrationProgress(progress);
            }, false);

            toast.success(`✅ Tamamlandı! ${result.updated} kayıt güncellendi, ${result.skipped} atlandı.`);
            setItemsWithoutGenre(0);
        } catch (error: any) {
            console.error('Migration error:', error);
            toast.error('Migration hatası: ' + error.message);
        } finally {
            setMigrationLoading(false);
        }
    };

    const handleReleaseDateMigration = async () => {
        if (!user) return;

        const confirmed = window.confirm(
            'Tüm içerikler için çıkış tarihi bilgisi eklenecek.\n\nBu işlem API çağrısı yapacağı için biraz zaman alabilir.\n\nDevam etmek istiyor musunuz?'
        );

        if (!confirmed) return;

        setReleaseDateLoading(true);
        setReleaseDateProgress({ current: 0, total: 0, title: '' });

        try {
            const result = await migrateReleaseDates(user.uid, (current, total, title) => {
                setReleaseDateProgress({ current, total, title });
            });

            toast.success(`✅ Tamamlandı! ${result.updated} içerik güncellendi, ${result.skipped} atlandı.`);
        } catch (error: any) {
            console.error('Release date migration error:', error);
            toast.error('Migration hatası: ' + error.message);
        } finally {
            setReleaseDateLoading(false);
        }
    };

    const handleRuntimeImdbMigration = async () => {
        if (!user) return;

        const confirmed = window.confirm(
            'Tüm film ve diziler için süre (runtime) ve IMDb ID bilgisi eklenecek.\n\nBu işlem API çağrısı yapacağı için biraz zaman alabilir.\n\nDevam etmek istiyor musunuz?'
        );

        if (!confirmed) return;

        setRuntimeImdbLoading(true);
        setRuntimeImdbProgress({ current: 0, total: 0, title: '' });

        try {
            const result = await migrateRuntimeAndImdb(user.uid, (current, total, title) => {
                setRuntimeImdbProgress({ current, total, title });
            });

            toast.success(`✅ Tamamlandı! ${result.updated} içerik güncellendi, ${result.skipped} atlandı.`);
        } catch (error: any) {
            console.error('Runtime/IMDb migration error:', error);
            toast.error('Migration hatası: ' + error.message);
        } finally {
            setRuntimeImdbLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <FaDatabase className="text-indigo-500" /> Veri Migrasyon
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
                Mevcut içeriklerinizdeki eksik bilgileri API'lerden çekerek tamamlayın.
            </p>

            <div className="space-y-6">
                {/* Genre Migration */}
                <div className="bg-sky-50 dark:bg-sky-900/10 rounded-2xl shadow-lg p-6 border border-sky-100 dark:border-sky-900/30">
                    <h2 className="text-lg font-bold text-sky-600 dark:text-sky-400 mb-3 flex items-center gap-2">
                        <FaTags /> Tür Bilgisi Ekle
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                        {itemsWithoutGenre !== null && itemsWithoutGenre > 0
                            ? `${itemsWithoutGenre} kaydınızda tür (genre) bilgisi eksik.`
                            : 'Tüm kayıtlarınızda tür bilgisi mevcut ✓'
                        }
                    </p>

                    {migrationLoading ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <FaSync className="animate-spin" />
                                <span>İşleniyor: {migrationProgress.currentItem || '...'}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${migrationProgress.total > 0 ? (migrationProgress.processed / migrationProgress.total) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{migrationProgress.processed} / {migrationProgress.total}</span>
                                <span>✓ {migrationProgress.updated} güncellendi</span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleMigrateGenres}
                            disabled={itemsWithoutGenre === 0}
                            className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                        >
                            <FaSync /> Tür Bilgilerini Ekle
                        </button>
                    )}
                </div>

                {/* Release Date Migration */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl shadow-lg p-6 border border-emerald-100 dark:border-emerald-900/30">
                    <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                        <FaCalendarAlt /> Çıkış Tarihi Ekle
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                        Mevcut içeriklerinize çıkış tarihi (release date) bilgisi ekler.
                    </p>

                    {releaseDateLoading ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <FaSync className="animate-spin" />
                                <span>İşleniyor: {releaseDateProgress.title || '...'}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${releaseDateProgress.total > 0 ? (releaseDateProgress.current / releaseDateProgress.total) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="text-xs text-gray-500">
                                {releaseDateProgress.current} / {releaseDateProgress.total}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleReleaseDateMigration}
                            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all"
                        >
                            <FaSync /> Çıkış Tarihlerini Ekle
                        </button>
                    )}
                </div>

                {/* Runtime/IMDb Migration */}
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl shadow-lg p-6 border border-purple-100 dark:border-purple-900/30">
                    <h2 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                        <FaClock /> Süre ve IMDb Ekle
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                        Film ve dizilerinize süre (runtime) ve IMDb ID bilgisi ekler.
                    </p>

                    {runtimeImdbLoading ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <FaSync className="animate-spin" />
                                <span>İşleniyor: {runtimeImdbProgress.title || '...'}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${runtimeImdbProgress.total > 0 ? (runtimeImdbProgress.current / runtimeImdbProgress.total) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="text-xs text-gray-500">
                                {runtimeImdbProgress.current} / {runtimeImdbProgress.total}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleRuntimeImdbMigration}
                            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
                        >
                            <FaSync /> Süre ve IMDb Bilgisi Ekle
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
