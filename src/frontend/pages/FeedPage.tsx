// src/frontend/pages/FeedPage.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import {
    FaHistory, FaInbox, FaArrowRight, FaRss, FaFire, FaClock,
    FaCalendarCheck, FaChartLine, FaBolt, FaFilm, FaTv, FaGamepad,
    FaBook, FaStar, FaFilter
} from 'react-icons/fa';
import useActivities from '../hooks/useActivities';
import ActivityCard from '../components/ActivityCard';
import SearchBar from '../components/SearchBar';
import { ActivityCardSkeleton } from '../components/ui/SkeletonLoader';
import PageHeaderBanner from '../components/ui/PageHeaderBanner';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const getActivityTime = (ts: any): number => {
    if (!ts) return 0;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
    return new Date(ts).getTime() || 0;
};

export default function FeedPage() {
    const { activities, loading } = useActivities();
    const { t, language } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'movie' | 'series' | 'game' | 'book'>('all');

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
                    const timeA = getActivityTime(a.timestamp);
                    const timeB = getActivityTime(b.timestamp);
                    return timeB - timeA;
                }),
                latestTimestamp: group[0].timestamp
            }))
            .sort((a, b) => {
                const timeA = getActivityTime(a.latestTimestamp);
                const timeB = getActivityTime(b.latestTimestamp);
                return timeB - timeA;
            });
    }, [activities]);

    // Filtered by selected category
    const filteredGroups = useMemo(() => {
        if (selectedCategory === 'all') return groupedActivities;
        return groupedActivities.filter(g => g.activities[0]?.mediaItem?.type === selectedCategory);
    }, [groupedActivities, selectedCategory]);

    // Activity statistics
    const activityStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayActivities = activities.filter(a => {
            const time = getActivityTime(a.timestamp);
            return time >= today.getTime();
        });

        const uniqueTypes = new Set(activities.map(a => a.mediaItem.type));
        const uniqueItems = new Set(activities.map(a => a.mediaItem.id));

        return {
            todayCount: todayActivities.length,
            uniqueTypes: uniqueTypes.size,
            uniqueItems: uniqueItems.size,
            totalActivities: activities.length,
            uniqueCategories: uniqueTypes.size,
            uniqueItemsCount: uniqueItems.size
        };
    }, [activities]);

    // Weekly Activity Streak & 7-Day Pulse (YENİ ÖZELLİK)
    const weekPulse = useMemo(() => {
        const days: { date: Date; dateStr: string; label: string; count: number }[] = [];
        const dayNamesTr = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const nextD = new Date(d);
            nextD.setDate(nextD.getDate() + 1);

            const count = activities.filter(a => {
                const time = getActivityTime(a.timestamp);
                return time >= d.getTime() && time < nextD.getTime();
            }).length;

            days.push({
                date: d,
                dateStr: d.toISOString().split('T')[0],
                label: language === 'tr' ? dayNamesTr[d.getDay()] : dayNamesEn[d.getDay()],
                count
            });
        }

        // Calculate consecutive active days from yesterday/today
        let streak = 0;
        for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].count > 0) {
                streak++;
            } else if (i === days.length - 1) {
                // Today has 0 so far, keep checking yesterday
                continue;
            } else {
                break;
            }
        }

        return { days, streak };
    }, [activities, language]);

    // Category Engagement Distribution (YENİ ÖZELLİK)
    const categoryBreakdown = useMemo(() => {
        const counts = { movie: 0, series: 0, game: 0, book: 0 };
        activities.forEach(a => {
            const type = a.mediaItem?.type as keyof typeof counts;
            if (counts[type] !== undefined) counts[type]++;
        });
        const total = activities.length || 1;
        return {
            counts,
            percentages: {
                movie: Math.round((counts.movie / total) * 100),
                series: Math.round((counts.series / total) * 100),
                game: Math.round((counts.game / total) * 100),
                book: Math.round((counts.book / total) * 100),
            }
        };
    }, [activities]);

    // Top Highlight Media Item (En Çok Etkileşim Alan İçerik)
    const topHighlight = useMemo(() => {
        if (groupedActivities.length === 0) return null;
        let maxGroup = groupedActivities[0];
        for (const g of groupedActivities) {
            if (g.activities.length > maxGroup.activities.length) {
                maxGroup = g;
            }
        }
        return {
            mediaItem: maxGroup.activities[0].mediaItem,
            count: maxGroup.activities.length,
        };
    }, [groupedActivities]);

    if (loading) {
        return (
            <div className="min-h-screen pb-16">
                <PageHeaderBanner
                    title={t('feed.title') || 'Aktiviteler'}
                    subtitle={t('feed.subtitle') || 'Son aktivitelerinizi ve etkileşim trendlerinizi takip edin'}
                    icon={<FaHistory className="text-rose-500 text-xl" />}
                    backTo="/profile"
                    backLabel={t('common.backToProfile')}
                />

                <div className="w-full mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8 space-y-3">
                            <SearchBar />
                            {[1, 2, 3, 4, 5].map(i => <ActivityCardSkeleton key={i} />)}
                        </div>
                        <div className="hidden lg:block lg:col-span-4">
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-zinc-800 animate-pulse">
                                <div className="h-4 bg-stone-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-10 bg-stone-100 dark:bg-zinc-800/50 rounded-xl"></div>
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
        <div className="min-h-screen pb-20">
            {/* Header Banner */}
            <PageHeaderBanner
                title={t('feed.title') || 'Aktiviteler'}
                subtitle={
                    groupedActivities.length > 0
                        ? `${groupedActivities.length} ${language === 'tr' ? 'içerikte toplam' : 'items with'} ${activityStats.totalActivities} ${language === 'tr' ? 'aktivite' : 'activities'}`
                        : (t('feed.empty') || 'Henüz aktivite yok')
                }
                icon={<FaRss className="text-rose-500 text-xl" />}
                backTo="/profile"
                backLabel={t('common.backToProfile')}
            />

            <div className="w-full mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* SOL SÜTUN: Arama, Filtreler & Aktiviteler Listesi */}
                    <div className="lg:col-span-8 space-y-5">
                        {/* Search Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <SearchBar />
                        </motion.div>

                        {/* Hızlı Kategori Filtre Butonları (YENİ ÖZELLİK) */}
                        {groupedActivities.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                                {[
                                    { key: 'all' as const, label: t('feed.allFilter') || 'Tümü', icon: <FaFilter className="text-[10px]" /> },
                                    { key: 'movie' as const, label: t('feed.moviesFilter') || 'Filmler', icon: <FaFilm className="text-[10px]" /> },
                                    { key: 'series' as const, label: t('feed.seriesFilter') || 'Diziler', icon: <FaTv className="text-[10px]" /> },
                                    { key: 'game' as const, label: t('feed.gamesFilter') || 'Oyunlar', icon: <FaGamepad className="text-[10px]" /> },
                                    { key: 'book' as const, label: t('feed.booksFilter') || 'Kitaplar', icon: <FaBook className="text-[10px]" /> },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setSelectedCategory(tab.key)}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                            selectedCategory === tab.key
                                                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 scale-[1.02]'
                                                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                        {tab.key !== 'all' && categoryBreakdown.counts[tab.key] > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                                selectedCategory === tab.key ? 'bg-white/20 text-white' : 'bg-stone-200 dark:bg-zinc-700 text-stone-600 dark:text-zinc-300'
                                            }`}>
                                                {categoryBreakdown.counts[tab.key]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Quick Metrics Row */}
                        {groupedActivities.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-3 gap-3"
                            >
                                <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 rounded-2xl p-4 border border-rose-200/50 dark:border-rose-800/30">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <FaBolt className="text-rose-500 text-xs" />
                                        <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">
                                            {t('feed.todayCount') || 'Bugün'}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-black text-stone-900 dark:text-white">{activityStats.todayCount}</div>
                                    <div className="text-[11px] text-stone-400">{language === 'tr' ? 'aktivite' : 'events'}</div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <FaChartLine className="text-blue-500 text-xs" />
                                        <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">
                                            {t('feed.uniqueItems') || 'İçerik'}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-black text-stone-900 dark:text-white">{activityStats.uniqueItems}</div>
                                    <div className="text-[11px] text-stone-400">{language === 'tr' ? 'benzersiz' : 'unique'}</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-2xl p-4 border border-purple-200/50 dark:border-purple-800/30">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <FaFire className="text-purple-500 text-xs" />
                                        <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">
                                            {t('feed.uniqueTypes') || 'Tür'}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-black text-stone-900 dark:text-white">{activityStats.uniqueTypes}</div>
                                    <div className="text-[11px] text-stone-400">{language === 'tr' ? 'farklı tür' : 'categories'}</div>
                                </div>
                            </motion.div>
                        )}

                        {/* Activities List */}
                        {filteredGroups.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-3"
                            >
                                {filteredGroups.map((group, idx) => (
                                    <motion.div
                                        key={`${group.activities[0].mediaItem.id}-${idx}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
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
                                className="relative flex flex-col items-center justify-center py-16 bg-stone-50/50 dark:bg-zinc-900/30 rounded-3xl border border-stone-200/60 dark:border-zinc-800"
                            >
                                <div className="w-20 h-20 bg-stone-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                                    <FaInbox className="text-3xl text-stone-400 dark:text-stone-500" />
                                </div>

                                <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-1.5 text-center">
                                    {selectedCategory !== 'all' 
                                        ? (language === 'tr' ? 'Bu kategoride henüz aktivite yok' : 'No activities in this category yet') 
                                        : (t('feed.empty') || 'Henüz aktivite yok')}
                                </h3>

                                <p className="text-stone-500 dark:text-zinc-400 text-center max-w-sm text-xs leading-relaxed mb-6">
                                    {t('feed.emptyDesc') || 'İçerik ekledikçe, izledikçe veya favorilere ekledikçe burada görünecek.'}
                                </p>

                                {selectedCategory !== 'all' ? (
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-rose-600 transition-all cursor-pointer"
                                    >
                                        {language === 'tr' ? 'Tüm Aktivitelere Dön' : 'Back to All Activities'}
                                    </button>
                                ) : (
                                    <Link
                                        to="/profile"
                                        className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-rose-600 transition-all"
                                    >
                                        {t('common.backToProfile')}
                                    </Link>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* SAĞ SÜTUN: Akıllı Widget'lar (Isı Haritası, Etkileşim Grafiği, Öne Çıkan, Hızlı Erişim) */}
                    <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
                        {/* 1. HAFTALIK AKTİVİTE ISISI & SERİ (YENİ ÖZELLİK) */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <FaFire className="text-amber-500 text-sm" />
                                    <h3 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-wider">
                                        {t('feed.streakTitle') || 'Aktivite Serisi'}
                                    </h3>
                                </div>
                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-lg">
                                    🔥 {weekPulse.streak} {t('feed.streakDays') || (language === 'tr' ? 'gün kesintisiz' : 'days streak')}
                                </span>
                            </div>

                            {/* 7 Günlük Isı Haritası Çubukları */}
                            <div className="grid grid-cols-7 gap-1.5 text-center mt-3">
                                {weekPulse.days.map((d, i) => {
                                    const hasActivity = d.count > 0;
                                    const isToday = i === weekPulse.days.length - 1;
                                    return (
                                        <div key={d.dateStr} className="flex flex-col items-center gap-1.5" title={`${d.dateStr}: ${d.count} aktivite`}>
                                            <div className={`w-full h-11 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                                                hasActivity
                                                    ? 'bg-gradient-to-t from-amber-500 to-rose-500 text-white shadow-xs'
                                                    : 'bg-stone-100 dark:bg-zinc-800/80 text-stone-400 dark:text-zinc-500'
                                            } ${isToday ? 'ring-2 ring-amber-400 dark:ring-amber-400 ring-offset-1 dark:ring-offset-zinc-900' : ''}`}>
                                                {hasActivity ? d.count : '·'}
                                            </div>
                                            <span className={`text-[10px] font-bold ${isToday ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-zinc-500'}`}>
                                                {d.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. ETKİLEŞİM DAĞILIMI (YENİ ÖZELLİK) */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-100 dark:border-zinc-800">
                                <FaChartLine className="text-rose-500 text-sm" />
                                <h3 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-wider">
                                    {t('feed.categoryEngagement') || 'Etkileşim Dağılımı'}
                                </h3>
                            </div>

                            {/* Segmented Progress Bar */}
                            <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden flex mb-3.5">
                                {categoryBreakdown.percentages.movie > 0 && (
                                    <div
                                        style={{ width: `${categoryBreakdown.percentages.movie}%` }}
                                        className="bg-rose-500 h-full transition-all"
                                        title={`Film: %${categoryBreakdown.percentages.movie}`}
                                    />
                                )}
                                {categoryBreakdown.percentages.series > 0 && (
                                    <div
                                        style={{ width: `${categoryBreakdown.percentages.series}%` }}
                                        className="bg-indigo-500 h-full transition-all"
                                        title={`Dizi: %${categoryBreakdown.percentages.series}`}
                                    />
                                )}
                                {categoryBreakdown.percentages.game > 0 && (
                                    <div
                                        style={{ width: `${categoryBreakdown.percentages.game}%` }}
                                        className="bg-emerald-500 h-full transition-all"
                                        title={`Oyun: %${categoryBreakdown.percentages.game}`}
                                    />
                                )}
                                {categoryBreakdown.percentages.book > 0 && (
                                    <div
                                        style={{ width: `${categoryBreakdown.percentages.book}%` }}
                                        className="bg-amber-500 h-full transition-all"
                                        title={`Kitap: %${categoryBreakdown.percentages.book}`}
                                    />
                                )}
                            </div>

                            {/* Category Counts Chips */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-100 dark:border-zinc-800">
                                    <span className="flex items-center gap-1.5 font-bold text-stone-600 dark:text-zinc-300">
                                        <FaFilm className="text-rose-500 text-[11px]" />
                                        {t('feed.moviesFilter') || 'Film'}
                                    </span>
                                    <span className="font-black text-stone-900 dark:text-white">{categoryBreakdown.counts.movie}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-100 dark:border-zinc-800">
                                    <span className="flex items-center gap-1.5 font-bold text-stone-600 dark:text-zinc-300">
                                        <FaTv className="text-indigo-500 text-[11px]" />
                                        {t('feed.seriesFilter') || 'Dizi'}
                                    </span>
                                    <span className="font-black text-stone-900 dark:text-white">{categoryBreakdown.counts.series}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-100 dark:border-zinc-800">
                                    <span className="flex items-center gap-1.5 font-bold text-stone-600 dark:text-zinc-300">
                                        <FaGamepad className="text-emerald-500 text-[11px]" />
                                        {t('feed.gamesFilter') || 'Oyun'}
                                    </span>
                                    <span className="font-black text-stone-900 dark:text-white">{categoryBreakdown.counts.game}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-100 dark:border-zinc-800">
                                    <span className="flex items-center gap-1.5 font-bold text-stone-600 dark:text-zinc-300">
                                        <FaBook className="text-amber-500 text-[11px]" />
                                        {t('feed.booksFilter') || 'Kitap'}
                                    </span>
                                    <span className="font-black text-stone-900 dark:text-white">{categoryBreakdown.counts.book}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. ÖNE ÇIKAN İÇERİK (YENİ ÖZELLİK) */}
                        {topHighlight && (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <FaStar className="text-amber-500 text-sm" />
                                        <h3 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-wider">
                                            {t('feed.topHighlight') || 'Öne Çıkan İçerik'}
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg">
                                        {topHighlight.count} {language === 'tr' ? 'etkileşim' : 'actions'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {topHighlight.mediaItem.image ? (
                                        <img
                                            src={topHighlight.mediaItem.image}
                                            alt=""
                                            className="w-12 h-16 object-cover rounded-xl shadow-xs shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-16 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                                            🎬
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="font-black text-sm text-stone-900 dark:text-white truncate">
                                            {topHighlight.mediaItem.title}
                                        </div>
                                        <div className="text-[11px] text-stone-400 capitalize mt-0.5">
                                            {topHighlight.mediaItem.type}
                                        </div>
                                        <Link
                                            to={`/${topHighlight.mediaItem.type}`}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 mt-1"
                                        >
                                            <span>{language === 'tr' ? 'Kütüphanede İncele' : 'View in Library'}</span>
                                            <FaArrowRight className="text-[9px]" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. VERİ SAKLAMA & BİLGİ KARTI */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-4 flex items-start gap-3">
                            <FaClock className="text-amber-500 text-sm mt-0.5 shrink-0" />
                            <p className="text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-medium">
                                {t('feed.last10DaysNote') || 'Aktivite akışı son 10 günlük verileri gösterir. Eski kayıtlar otomatik arşivlenir.'}
                            </p>
                        </div>

                        {/* 5. HIZLI ERİŞİM KARTI */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-stone-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FaCalendarCheck className="text-emerald-500 text-sm" />
                                {t('feed.quickAccess') || 'Hızlı Erişim'}
                            </h3>
                            <div className="space-y-1.5">
                                <Link
                                    to="/create"
                                    className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-zinc-800/60 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group"
                                >
                                    <span className="text-xs font-bold text-stone-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                                        {t('feed.addContent') || 'İçerik Ekle'}
                                    </span>
                                    <FaArrowRight className="text-[10px] text-stone-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                                </Link>
                                <Link
                                    to="/stats"
                                    className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-zinc-800/60 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                >
                                    <span className="text-xs font-bold text-stone-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        {t('feed.myStats') || 'İstatistikler'}
                                    </span>
                                    <FaArrowRight className="text-[10px] text-stone-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </Link>
                                <Link
                                    to="/lists"
                                    className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-zinc-800/60 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                                >
                                    <span className="text-xs font-bold text-stone-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                        {t('feed.myLists') || 'Listelerim'}
                                    </span>
                                    <FaArrowRight className="text-[10px] text-stone-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}