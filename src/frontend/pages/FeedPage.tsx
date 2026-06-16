// src/frontend/pages/FeedPage.tsx
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { FaHistory, FaInbox, FaArrowRight, FaRss, FaFire, FaClock, FaCalendarCheck, FaChartLine, FaBolt } from 'react-icons/fa';
import useActivities from '../hooks/useActivities';
import ActivityCard from '../components/ActivityCard';
import SearchBar from '../components/SearchBar';
import { ActivityCardSkeleton } from '../components/ui/SkeletonLoader';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function FeedPage() {
    const { activities, loading } = useActivities();
    const { t } = useLanguage();

    // Group activities by media item
    const groupedActivities = useMemo(() => {
        const groups = new Map<string, typeof activities>();

        activities.forEach(activity => {
            const mediaId = activity.mediaItem.id;
            if (!groups.has(mediaId)) {
                groups.set(mediaId, []);
            }
            groups.get(mediaId)!.push(activity);
        });

        return Array.from(groups.values())
            .map(group => ({
                activities: group.sort((a, b) => {
                    const timeA = a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
                    const timeB = b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
                    return timeB - timeA;
                }),
                latestTimestamp: group[0].timestamp
            }))
            .sort((a, b) => {
                const timeA = a.latestTimestamp.toDate ? a.latestTimestamp.toDate().getTime() : 0;
                const timeB = b.latestTimestamp.toDate ? b.latestTimestamp.toDate().getTime() : 0;
                return timeB - timeA;
            });
    }, [activities]);

    // Activity statistics
    const activityStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayActivities = activities.filter(a => {
            const time = a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
            return time >= today.getTime();
        });

        const uniqueTypes = new Set(activities.map(a => a.mediaItem.type));
        const uniqueItems = new Set(activities.map(a => a.mediaItem.id));

        return {
            todayCount: todayActivities.length,
            uniqueTypes: uniqueTypes.size,
            uniqueItems: uniqueItems.size,
            totalActivities: activities.length
        };
    }, [activities]);

    if (loading) {
        return (
            <div className="min-h-screen pb-16">
                {/* Header */}
                <div className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 mb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl text-white shadow-lg shadow-rose-500/25">
                                        <FaHistory className="text-2xl" />
                                    </div>
                                    {t('feed.title')}
                                </h1>
                                <p className="text-stone-500 dark:text-zinc-400 mt-2">
                                    Son aktivitelerinizi takip edin
                                </p>
                            </div>
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-sm font-medium"
                            >
                                <FaArrowRight className="rotate-180" />
                                <span className="hidden sm:inline">Profile Dön</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-3">
                            <SearchBar />
                            {[1, 2, 3, 4, 5].map(i => <ActivityCardSkeleton key={i} />)}
                        </div>
                        <div className="hidden lg:block">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-stone-200 dark:border-zinc-800 animate-pulse">
                                <div className="h-4 bg-stone-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-12 bg-stone-100 dark:bg-zinc-800 rounded-xl"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-0">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl text-white shadow-lg shadow-rose-500/25">
                                    <FaRss className="text-2xl" />
                                </div>
                                {t('feed.title')}
                            </h1>
                            <p className="text-stone-500 dark:text-zinc-400 mt-2">
                                {groupedActivities.length > 0
                                    ? `${groupedActivities.length} içerikte toplam ${activityStats.totalActivities} aktivite`
                                    : 'Henüz aktivite yok'}
                            </p>
                        </div>
                        <Link
                            to="/profile"
                            className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-sm font-medium"
                        >
                            <FaArrowRight className="rotate-180" />
                            <span className="hidden sm:inline">Profile Dön</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Activities */}
                    <div className="lg:col-span-2">
                        {/* Search Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6"
                        >
                            <SearchBar />
                        </motion.div>

                        {/* Quick Stats Row */}
                        {groupedActivities.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-3 gap-3 mb-6"
                            >
                                <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-rose-200/50 dark:border-rose-800/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaBolt className="text-rose-500 text-sm" />
                                        <span className="text-xs font-medium text-stone-500 dark:text-zinc-400">Bugün</span>
                                    </div>
                                    <div className="text-2xl font-black text-stone-900 dark:text-white">{activityStats.todayCount}</div>
                                    <div className="text-xs text-stone-400">aktivite</div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaChartLine className="text-blue-500 text-sm" />
                                        <span className="text-xs font-medium text-stone-500 dark:text-zinc-400">İçerik</span>
                                    </div>
                                    <div className="text-2xl font-black text-stone-900 dark:text-white">{activityStats.uniqueItems}</div>
                                    <div className="text-xs text-stone-400">benzersiz</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaFire className="text-purple-500 text-sm" />
                                        <span className="text-xs font-medium text-stone-500 dark:text-zinc-400">Tür</span>
                                    </div>
                                    <div className="text-2xl font-black text-stone-900 dark:text-white">{activityStats.uniqueTypes}</div>
                                    <div className="text-xs text-stone-400">farklı tür</div>
                                </div>
                            </motion.div>
                        )}

                        {/* Activities List */}
                        {groupedActivities.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-3"
                            >
                                {groupedActivities.map((group, idx) => (
                                    <motion.div
                                        key={`${group.activities[0].mediaItem.id}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <ActivityCard activities={group.activities} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            /* Empty State */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative flex flex-col items-center justify-center py-20"
                            >
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-rose-500/5 to-orange-500/5 rounded-full blur-3xl pointer-events-none" />

                                <div className="relative">
                                    <div className="w-28 h-28 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                        <FaInbox className="text-5xl text-stone-400 dark:text-stone-600" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-2 text-center">
                                        {t('feed.empty')}
                                    </h3>

                                    <p className="text-stone-500 dark:text-zinc-400 text-center max-w-md text-base leading-relaxed mb-8">
                                        {t('feed.emptyDesc')}
                                    </p>

                                    <div className="flex items-center justify-center gap-3">
                                        <Link
                                            to="/add"
                                            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all"
                                        >
                                            <FaBolt className="inline mr-2" />
                                            İçerik Ekle
                                        </Link>
                                        <Link
                                            to="/profile"
                                            className="px-6 py-3 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                                        >
                                            Profile Git
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="hidden lg:block">
                        <div className="sticky top-24 space-y-6">
                            {/* Info Card */}
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <FaClock className="text-amber-600 dark:text-amber-400" />
                                    <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                                        Veri Saklama
                                    </h3>
                                </div>
                                <p className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                                    Aktivite akışınız son 10 günlük verileri gösterir. Daha eski aktiviteler otomatik olarak temizlenir.
                                </p>
                            </div>

                            {/* Stats Card */}
                            {groupedActivities.length > 0 && (
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h3 className="font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FaChartLine className="text-rose-500" />
                                        Aktivite Özeti
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <span className="text-sm text-stone-600 dark:text-zinc-400">Toplam Aktivite</span>
                                            <span className="font-bold text-stone-900 dark:text-white">{activityStats.totalActivities}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <span className="text-sm text-stone-600 dark:text-zinc-400">Bugün</span>
                                            <span className="font-bold text-rose-600 dark:text-rose-400">{activityStats.todayCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <span className="text-sm text-stone-600 dark:text-zinc-400">Benzersiz İçerik</span>
                                            <span className="font-bold text-blue-600 dark:text-blue-400">{activityStats.uniqueItems}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <span className="text-sm text-stone-600 dark:text-zinc-400">Farklı Tür</span>
                                            <span className="font-bold text-purple-600 dark:text-purple-400">{activityStats.uniqueTypes}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Links */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                <h3 className="font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FaCalendarCheck className="text-emerald-500" />
                                    Hızlı Erişim
                                </h3>
                                <div className="space-y-2">
                                    <Link
                                        to="/create"
                                        className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group"
                                    >
                                        <span className="text-sm font-medium text-stone-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                                            İçerik Ekle
                                        </span>
                                        <FaArrowRight className="text-xs text-stone-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                    <Link
                                        to="/stats"
                                        className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                    >
                                        <span className="text-sm font-medium text-stone-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                            İstatistikler
                                        </span>
                                        <FaArrowRight className="text-xs text-stone-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                    <Link
                                        to="/lists"
                                        className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                                    >
                                        <span className="text-sm font-medium text-stone-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                            Listelerim
                                        </span>
                                        <FaArrowRight className="text-xs text-stone-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}