// src/frontend/pages/MigrationPage.tsx
// Veri migrasyon işlemleri sayfası

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaSync, FaTags, FaCalendarAlt, FaClock, FaDatabase, FaTv, FaCheckCircle, FaInfoCircle, FaRocket, FaArrowRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { countItemsWithoutGenre, migrateGenresForUser } from '../../backend/services/genreMigrationService';
import { migrateReleaseDates } from '../../backend/services/releaseDateMigrationService';
import { migrateRuntimeAndImdb } from '../../backend/services/runtimeImdbMigrationService';
import { migrateToEpisodeTracking, checkNewSeasonsForUser, getSeriesCountForUser } from '../../backend/services/episodeMigrationService';
import { Link } from 'react-router-dom';

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
    
    // Custom Modal States
    const [showSeasonCheckModal, setShowSeasonCheckModal] = useState(false);
    const [seriesCount, setSeriesCount] = useState<number | null>(null);
    const [seriesCountLoading, setSeriesCountLoading] = useState(false);

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

    const handleEpisodeMigration = async () => {
        if (!user) return;

        const confirmed = window.confirm(
            'Tüm dizileriniz için bölüm bilgisi eklenecek ve mevcut sezon verileri dönüştürülecek.\n\nBu işlem OMDB API çağrısı yapacağı için biraz zaman alabilir.\n\nDevam etmek istiyor musunuz?'
        );

        if (!confirmed) return;

        setEpisodeMigrationLoading(true);
        setEpisodeMigrationProgress({ current: 0, total: 0, title: '' });

        try {
            const result = await migrateToEpisodeTracking(user.uid, (progress) => {
                setEpisodeMigrationProgress(progress);
            });
            toast.success(`✅ Tamamlandı! ${result.updated} dizi güncellendi, ${result.skipped} atlandı.`);
        } catch (error: any) {
            console.error('Episode migration error:', error);
            toast.error('Migration hatası: ' + error.message);
        } finally {
            setEpisodeMigrationLoading(false);
        }
    };

    const handleNewSeasonCheck = async () => {
        if (!user) return;
        
        setSeriesCountLoading(true);
        setShowSeasonCheckModal(true);
        
        try {
            const count = await getSeriesCountForUser(user.uid);
            setSeriesCount(count);
        } catch (error) {
            console.error('Error fetching series count:', error);
            toast.error('Dizi sayısı alınamadı.');
            setShowSeasonCheckModal(false);
        } finally {
            setSeriesCountLoading(false);
        }
    };

    const confirmNewSeasonCheck = async () => {
        if (!user) return;
        
        setShowSeasonCheckModal(false);
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
        <div className="min-h-screen pb-12">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 mb-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                                <FaDatabase className="text-indigo-500" />
                                Veri Migrasyon
                            </h1>
                            <p className="text-stone-500 dark:text-zinc-400 mt-2">
                                İçeriklerinizdeki eksik bilgileri API'lerden çekerek tamamlayın
                            </p>
                        </div>
                        <Link
                            to="/settings"
                            className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-sm font-medium"
                        >
                            <FaArrowRight className="rotate-180" />
                            <span className="hidden sm:inline">Ayarlara Dön</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Info Alert */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-8">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
                            <FaInfoCircle className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-1">Önemli Bilgi</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                Migrasyon işlemleri harici API'lere istek gönderir. İşlem süresi içerik sayınıza bağlı olarak değişebilir.
                                İşlem sırasında sayfayı kapatmayın.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Migration Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Genre Migration Card */}
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 rounded-2xl shadow-lg border border-sky-200 dark:border-sky-800 p-6 relative overflow-hidden">
                        {itemsWithoutGenre === 0 && (
                            <div className="absolute top-4 right-4">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                                    <FaCheckCircle />
                                    Tamamlandı
                                </span>
                            </div>
                        )}

                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex-shrink-0">
                                <FaTags className="text-xl text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-sky-700 dark:text-sky-300 mb-1">Tür Bilgisi Ekle</h2>
                                <p className="text-sm text-stone-600 dark:text-zinc-400">
                                    İçeriklerinize kategori ve tür bilgilerini ekleyerek daha iyi filtreleme yapın.
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <span className={`text-sm font-medium ${itemsWithoutGenre === 0 ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-zinc-400'
                                }`}>
                                {itemsWithoutGenre !== null && itemsWithoutGenre > 0
                                    ? `${itemsWithoutGenre} kayıtta tür bilgisi eksik`
                                    : 'Tüm kayıtlarda tür bilgisi mevcut ✓'
                                }
                            </span>
                        </div>

                        {migrationLoading ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-zinc-400">
                                    <FaSync className="animate-spin" />
                                    <span className="truncate">{migrationProgress.currentItem || 'İşleniyor...'}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-sky-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${migrationProgress.total > 0 ? (migrationProgress.processed / migrationProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-stone-500 dark:text-zinc-400">
                                    <span className="font-medium">{migrationProgress.processed} / {migrationProgress.total}</span>
                                    <span>✓ {migrationProgress.updated} güncellendi</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleMigrateGenres}
                                disabled={itemsWithoutGenre === 0}
                                className={`w-full flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl ${itemsWithoutGenre === 0
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 cursor-not-allowed'
                                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                                    }`}
                            >
                                {itemsWithoutGenre === 0 ? (
                                    <>
                                        <FaCheckCircle />
                                        Migrasyon Tamamlandı
                                    </>
                                ) : (
                                    <>
                                        <FaRocket />
                                        Migrasyonu Başlat
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Release Date Migration Card */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-800 p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex-shrink-0">
                                <FaCalendarAlt className="text-xl text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mb-1">Çıkış Tarihi Ekle</h2>
                                <p className="text-sm text-stone-600 dark:text-zinc-400">
                                    Film ve dizilerin çıkış tarihlerini ekleyerek kronolojik sıralama yapın.
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <span className="text-sm font-medium text-stone-500 dark:text-zinc-400">
                                İçeriklerinize çıkış tarihi bilgisi ekleyin
                            </span>
                        </div>

                        {releaseDateLoading ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-zinc-400">
                                    <FaSync className="animate-spin" />
                                    <span className="truncate">{releaseDateProgress.title || 'İşleniyor...'}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${releaseDateProgress.total > 0 ? (releaseDateProgress.current / releaseDateProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                                    {releaseDateProgress.current} / {releaseDateProgress.total}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleReleaseDateMigration}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                            >
                                <FaRocket />
                                Migrasyonu Başlat
                            </button>
                        )}
                    </div>

                    {/* Runtime/IMDb Migration Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800 p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex-shrink-0">
                                <FaClock className="text-xl text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">Süre ve IMDb Bilgisi</h2>
                                <p className="text-sm text-stone-600 dark:text-zinc-400">
                                    Film ve dizilerin süre ve IMDb ID bilgilerini ekleyerek detaylandırın.
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <span className="text-sm font-medium text-stone-500 dark:text-zinc-400">
                                Süre ve IMDb bilgilerini ekleyin
                            </span>
                        </div>

                        {runtimeImdbLoading ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-zinc-400">
                                    <FaSync className="animate-spin" />
                                    <span className="truncate">{runtimeImdbProgress.title || 'İşleniyor...'}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${runtimeImdbProgress.total > 0 ? (runtimeImdbProgress.current / runtimeImdbProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                                    {runtimeImdbProgress.current} / {runtimeImdbProgress.total}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleRuntimeImdbMigration}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                            >
                                <FaRocket />
                                Migrasyonu Başlat
                            </button>
                        )}
                    </div>

                    {/* Episode Migration Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-2xl shadow-lg border border-indigo-200 dark:border-indigo-800 p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex-shrink-0">
                                <FaTv className="text-xl text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-1">Bölüm Takibi</h2>
                                <p className="text-sm text-stone-600 dark:text-zinc-400">
                                    Dizi sezon verilerinizi bölüm bazlı takip sistemine dönüştürün.
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <span className="text-sm font-medium text-stone-500 dark:text-zinc-400">
                                Bölüm takip verilerini güncelleyin
                            </span>
                        </div>

                        {episodeMigrationLoading ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-zinc-400">
                                    <FaSync className="animate-spin" />
                                    <span className="truncate">{episodeMigrationProgress.title || 'İşleniyor...'}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${episodeMigrationProgress.total > 0 ? (episodeMigrationProgress.current / episodeMigrationProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                                    {episodeMigrationProgress.current} / {episodeMigrationProgress.total}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleEpisodeMigration}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                            >
                                <FaRocket />
                                Migrasyonu Başlat
                            </button>
                        )}
                    </div>

                    {/* Admin Only: New Season Check Card */}
                    {user?.uid === import.meta.env.VITE_ADMIN_UID && (
                        <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 rounded-2xl shadow-lg border border-rose-200 dark:border-rose-800 p-6 md:col-span-2">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex-shrink-0">
                                    <FaSync className="text-xl text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-rose-700 dark:text-rose-300 mb-1">Yeni Sezon ve Bölüm Kontrolü (Admin)</h2>
                                    <p className="text-sm text-stone-600 dark:text-zinc-400">
                                        Mevcut tüm dizileriniz için OMDB üzerinden yeni sezon veya yeni bölüm yayınlanmış mı diye kontrol eder.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <span className="text-sm font-medium text-stone-500 dark:text-zinc-400">
                                    Dizilerinizde eksik olan yeni sezonları ve bölümleri otomatik ekleyin.
                                </span>
                            </div>

                            {seasonCheckLoading ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-zinc-400">
                                        <FaSync className="animate-spin" />
                                        <span className="truncate">{seasonCheckProgress.title || 'İşleniyor...'}</span>
                                    </div>
                                    <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${seasonCheckProgress.total > 0 ? (seasonCheckProgress.current / seasonCheckProgress.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                                        {seasonCheckProgress.current} / {seasonCheckProgress.total}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleNewSeasonCheck}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                >
                                    <FaRocket />
                                    Kontrolü Başlat
                                </button>
                            )}
                        </div>
                    )}
                </div>


                {/* Bottom Info */}
                <div className="mt-8 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800">
                    <h3 className="font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                        <FaInfoCircle className="text-blue-500" />
                        Migrasyon Hakkında
                    </h3>
                    <div className="space-y-2 text-sm text-stone-600 dark:text-zinc-400">
                        <p>• Migrasyon işlemleri sadece eksik verisi olan içerikleri günceller.</p>
                        <p>• Mevcut verileriniz korunur, sadece boş alanlar doldurulur.</p>
                        <p>• API limitleri nedeniyle işlem süresi içerik sayınıza bağlıdır.</p>
                        <p>• İstediğiniz zaman tekrar çalıştırabilirsiniz.</p>
                    </div>
                </div>
            </div>

            {/* Season Check Modal */}
            {showSeasonCheckModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-zinc-800 p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full text-rose-600 dark:text-rose-400">
                                <FaTv className="text-xl" />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 dark:text-white">Yeni Sezon Kontrolü</h3>
                        </div>
                        
                        <div className="mb-6 space-y-4">
                            {seriesCountLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <FaSync className="animate-spin text-2xl text-stone-400" />
                                </div>
                            ) : (
                                <>
                                    <p className="text-stone-600 dark:text-zinc-400 text-lg">
                                        Toplam <strong className="text-rose-600 dark:text-rose-400 text-2xl">{seriesCount}</strong> adet diziniz bulundu.
                                    </p>
                                    <p className="text-sm text-stone-500 dark:text-zinc-500 bg-stone-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                                        Tüm dizileriniz için OMDB API üzerinden yeni sezon veya bölüm güncellemesi aranacaktır.
                                    </p>
                                    <p className="text-stone-700 dark:text-zinc-300 font-medium">
                                        Onaylıyor musunuz?
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSeasonCheckModal(false)}
                                className="px-4 py-2 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl font-medium transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={confirmNewSeasonCheck}
                                disabled={seriesCountLoading || seriesCount === 0}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <FaCheckCircle />
                                Onaylıyorum
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}