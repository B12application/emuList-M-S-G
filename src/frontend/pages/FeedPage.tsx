// src/frontend/pages/FeedPage.tsx
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { FaHistory, FaInbox } from 'react-icons/fa';
import useActivities from '../hooks/useActivities';
import ActivityCard from '../components/ActivityCard';
import SearchBar from '../components/SearchBar';
import { ActivityCardSkeleton } from '../components/ui/SkeletonLoader';
import { useLanguage } from '../context/LanguageContext';
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

        // Convert to array and sort by latest activity timestamp
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

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl text-white shadow-lg">
                                <FaHistory className="text-2xl" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                                {t('feed.title')}
                            </h1>
                        </div>
                        <SearchBar />
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => <ActivityCardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-0">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl text-white shadow-lg shadow-rose-500/30">
                            <FaHistory className="text-2xl" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            {t('feed.title')}
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4">
                        <SearchBar />
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {groupedActivities.length > 0
                            ? `${groupedActivities.length} içerik aktivitesi`
                            : t('feed.emptyDesc')}
                    </p>

                    {/* Data retention notice */}
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                        <span className="text-amber-600 dark:text-amber-400 text-xs">ℹ️</span>
                        <p className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                            Bu sayfada sadece son 10 günlük veriler tutulur
                        </p>
                    </div>
                </motion.div>

                {/* Activities List */}
                {groupedActivities.length > 0 ? (
                    <div className="space-y-3">
                        {groupedActivities.map((group, idx) => (
                            <ActivityCard key={`${group.activities[0].mediaItem.id}-${idx}`} activities={group.activities} />
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 px-6"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <FaInbox className="text-4xl text-gray-400 dark:text-gray-600" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('feed.empty')}
                        </h3>

                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md text-sm leading-relaxed">
                            {t('feed.emptyDesc')}
                        </p>

                        {/* Decorative background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-rose-500/5 to-orange-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                    </motion.div>
                )}
            </div>

            <Footer />
        </div>
    );
}
