import { useMemo } from 'react';
import useMediaHistory from '../hooks/useMediaHistory';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { FaChartBar, FaChartPie, FaTrophy, FaLock, FaFilm, FaTv, FaGamepad, FaBook, FaCalendarWeek, FaClock } from 'react-icons/fa';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#e11d48']; // Blue, Emerald, Amber, Rose

export default function StatsPage() {
    const { history, loading } = useMediaHistory();
    const { t } = useLanguage();

    // === DATA PROCESSING ===
    const stats = useMemo(() => {
        if (loading || history.length === 0) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. This Month Count
        const thisMonthItems = history.filter(item => {
            if (!item.createdAt) return false;
            const date = item.createdAt.toDate();
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        // 1.5 This Week Added (List of Items)
        const thisWeekAddedItems = history.filter(item => {
            if (!item.createdAt) return false;
            const date = item.createdAt.toDate();
            return date > oneWeekAgo;
        }).sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

        // 2. Type Distribution (Pie Chart)
        const typeCounts = { movie: 0, series: 0, game: 0, book: 0 };
        let watchedCount = 0;

        history.forEach(item => {
            if (typeCounts[item.type] !== undefined) typeCounts[item.type]++;
            if (item.watched) watchedCount++;
        });

        const pieData = [
            { name: t('nav.movies'), value: typeCounts.movie },
            { name: t('nav.series'), value: typeCounts.series },
            { name: t('nav.games'), value: typeCounts.game },
            { name: t('nav.books'), value: typeCounts.book },
        ].filter(d => d.value > 0);

        // 3. Monthly Activity (Bar Chart - Last 6 Months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleDateString(t('lang') === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' });

            const count = history.filter(item => {
                if (!item.createdAt) return false;
                const itemDate = item.createdAt.toDate();
                return itemDate.getMonth() === d.getMonth() && itemDate.getFullYear() === d.getFullYear();
            }).length;

            monthlyData.push({ name: monthName, count });
        }

        // 3.5 Recently Watched (Top 5 items marked as watched, sorted by createdAt desc)
        const recentlyWatched = history
            .filter(item => item.watched)
            .slice(0, 5);

        // NEW: Genre Distribution
        const genreCounts: Record<string, number> = {};
        history.forEach(item => {
            if (item.genre) {
                const genres = item.genre.split(', ');
                genres.forEach((g: string) => {
                    const trimmed = g.trim();
                    if (trimmed) {
                        genreCounts[trimmed] = (genreCounts[trimmed] || 0) + 1;
                    }
                });
            }
        });

        const genreData = Object.entries(genreCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8 genres

        // NEW: Rating Distribution (Histogram)
        const ratingBuckets: Record<string, number> = {
            '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0
        };
        history.forEach(item => {
            const rating = parseFloat(item.rating) || 0;
            if (rating < 2) ratingBuckets['0-2']++;
            else if (rating < 4) ratingBuckets['2-4']++;
            else if (rating < 6) ratingBuckets['4-6']++;
            else if (rating < 8) ratingBuckets['6-8']++;
            else ratingBuckets['8-10']++;
        });

        const ratingData = Object.entries(ratingBuckets).map(([name, count]) => ({ name, count }));

        // 4. Badges
        const badges = [
            {
                id: 'cinephile',
                icon: <FaFilm className="text-blue-500" />,
                title: t('stats.badge_cinephile'),
                desc: t('stats.badge_cinephile_desc'),
                unlocked: typeCounts.movie >= 50
            },
            {
                id: 'bingewatcher',
                icon: <FaTv className="text-emerald-500" />,
                title: t('stats.badge_bingewatcher'),
                desc: t('stats.badge_bingewatcher_desc'),
                unlocked: typeCounts.series >= 20
            },
            {
                id: 'gamer',
                icon: <FaGamepad className="text-amber-500" />,
                title: t('stats.badge_gamer'),
                desc: t('stats.badge_gamer_desc'),
                unlocked: typeCounts.game >= 10
            },
            {
                id: 'bookworm',
                icon: <FaBook className="text-rose-500" />,
                title: t('stats.badge_bookworm'),
                desc: t('stats.badge_bookworm_desc'),
                unlocked: typeCounts.book >= 10
            },
        ];

        return {
            thisMonthCount: thisMonthItems.length,
            totalCount: history.length,
            completionRate: Math.round((watchedCount / history.length) * 100) || 0,
            pieData,
            monthlyData,
            badges,
            thisWeekAddedItems,
            recentlyWatched,
            genreData,
            ratingData
        };
    }, [history, loading, t]);

    if (loading) return <div className="min-h-screen text-center text-gray-500 pt-32">{t('common.loading')}</div>;
    if (!stats) return <div className="min-h-screen text-center text-gray-500 pt-32">{t('stats.emptyHistory')}</div>;

    return (
        <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-stone-100 mb-8 flex items-center gap-3">
                <FaChartPie className="text-amber-600" /> {t('stats.title')}
            </h1>

            {/* KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="text-gray-500 dark:text-stone-400 text-sm font-semibold uppercase">{t('stats.thisMonth')}</div>
                    <div className="text-4xl font-black text-amber-600 dark:text-amber-500 mt-2">+{stats.thisMonthCount}</div>
                    <div className="text-xs text-gray-400 mt-1">{t('stats.newItem')}</div>
                </div>
                <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-stone-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-stone-500/20 transition-all"></div>
                    <div className="text-gray-500 dark:text-stone-400 text-sm font-semibold uppercase">{t('stats.totalItems')}</div>
                    <div className="text-4xl font-black text-gray-900 dark:text-stone-100 mt-2">{stats.totalCount}</div>
                </div>
                <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="text-gray-500 dark:text-stone-400 text-sm font-semibold uppercase">{t('stats.completionRate')}</div>
                    <div className="text-4xl font-black text-emerald-600 dark:text-emerald-500 mt-2">%{stats.completionRate}</div>
                    <div className="text-xs text-gray-400 mt-1">{t('stats.watched')} / {t('stats.read')}</div>
                </div>
            </div>

            {/* WEEKLY PULSE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Added This Week - List View */}
                <div className="bg-gradient-to-br from-stone-700 to-amber-700 rounded-3xl p-8 text-white shadow-xl shadow-amber-900/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
                    <div className="relative z-10 w-full h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-stone-100">
                            <FaCalendarWeek /> {t('stats.addedThisWeek')}
                        </h3>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 max-h-[220px]">
                            {stats.thisWeekAddedItems.length > 0 ? (
                                stats.thisWeekAddedItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                                        <div className={`p-2 rounded-lg ${item.type === 'movie' ? 'bg-blue-500/20 text-blue-200' :
                                            item.type === 'series' ? 'bg-emerald-500/20 text-emerald-200' :
                                                item.type === 'game' ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'
                                            }`}>
                                            {item.type === 'movie' ? <FaFilm /> :
                                                item.type === 'series' ? <FaTv /> :
                                                    item.type === 'game' ? <FaGamepad /> : <FaBook />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-sm truncate text-white/90">{item.title}</div>
                                            <div className="text-[10px] text-white/50 uppercase tracking-wider">{t(`nav.${item.type}s`)}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-white/40">
                                    <p className="text-sm">{t('stats.noAddedThisWeek')}</p>
                                </div>
                            )}
                        </div>

                        {stats.thisWeekAddedItems.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/10 text-center text-xs font-medium opacity-80">
                                {t('stats.totalNew')} +{stats.thisWeekAddedItems.length}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-stone-200 mb-4 flex items-center gap-2">
                        <FaClock className="text-amber-600" /> {t('stats.recentWatched')}
                    </h3>
                    {stats.recentlyWatched.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recentlyWatched.map(item => (
                                <Link to={`/${item.type}`} key={item.id} className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 dark:hover:bg-stone-800/50 p-2 rounded-xl transition-colors">
                                    <div className={`w-2 h-10 rounded-full ${item.type === 'movie' ? 'bg-blue-500' :
                                        item.type === 'series' ? 'bg-emerald-500' :
                                            item.type === 'game' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}></div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors">{item.title}</div>
                                        <div className="text-xs text-gray-400 capitalize">{t(`nav.${item.type}s`)}</div>
                                    </div>
                                    {item.rating && <div className="text-amber-500 font-bold text-sm">★ {item.rating}</div>}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 dark:border-stone-800 rounded-2xl">
                            <p>{t('stats.noRecent')}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* MONTHLY ACTIVITY CHART */}
                <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-stone-200 mb-6 flex items-center gap-2">
                        <FaChartBar className="text-stone-500" /> {t('stats.monthlyActivity')}
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#a8a29e" />
                                <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#000' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="count" fill="#d97706" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TYPE DISTRIBUTION CHART */}
                <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-stone-200 mb-6 flex items-center gap-2">
                        <FaChartPie className="text-stone-500" /> {t('stats.typeDistribution')}
                    </h3>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '12px' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* GENRE & RATING CHARTS */}
            {stats.genreData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* GENRE DISTRIBUTION CHART */}
                    <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-stone-200 mb-6 flex items-center gap-2">
                            🎭 {t('statsCharts.genreDistribution')}
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.genreData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#a8a29e" />
                                    <XAxis type="number" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} width={100} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#000' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* RATING DISTRIBUTION CHART */}
                    <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-stone-200 mb-6 flex items-center gap-2">
                            ⭐ {t('statsCharts.ratingDistribution')}
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.ratingData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#a8a29e" />
                                    <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#000' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* GAMIFICATION BADGES */}
            <div className="bg-white dark:bg-stone-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-white/5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-6 flex items-center gap-2">
                    <FaTrophy className="text-amber-500" /> {t('stats.badges')}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.badges.map((badge) => (
                        <motion.div
                            key={badge.id}
                            whileHover={{ y: -5 }}
                            className={`p-6 rounded-2xl border-2 text-center transition-all ${badge.unlocked
                                ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-900/10'
                                : 'border-gray-100 dark:border-stone-800 bg-gray-50 dark:bg-stone-950/50 grayscale opacity-60'
                                }`}
                        >
                            <div className="text-4xl mb-3 flex justify-center">
                                {badge.unlocked ? badge.icon : <FaLock className="text-gray-400 dark:text-stone-700" />}
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-stone-100 mb-1">{badge.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-stone-400">{badge.desc}</p>
                            {badge.unlocked && <div className="mt-3 inline-block px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase">{t('stats.unlocked')}</div>}
                        </motion.div>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
}
