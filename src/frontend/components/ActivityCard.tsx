// src/frontend/components/ActivityCard.tsx
import { Link } from 'react-router-dom';
import { FaFilm, FaTv, FaGamepad, FaBook, FaHeart, FaHeartBroken, FaPlus, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import type { Activity } from '../../backend/types/activity';
import { useLanguage } from '../context/LanguageContext';

interface ActivityCardProps {
    activities: Activity[]; // Now accepts multiple activities for same media
}

export default function ActivityCard({ activities }: ActivityCardProps) {
    const { t } = useLanguage();

    // Use the first activity for media info (all activities are for the same media)
    const mainActivity = activities[0];
    const mediaItem = mainActivity.mediaItem;

    // Get time ago string from the most recent activity
    const getTimeAgo = (timestamp: any) => {
        const now = new Date();
        const activityDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = Math.floor((now.getTime() - activityDate.getTime()) / 1000); // seconds

        if (diff < 60) return t('feed.justNow');
        if (diff < 3600) return `${Math.floor(diff / 60)} ${t('feed.minutesAgo')}`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('feed.hoursAgo')}`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ${t('feed.daysAgo')}`;
        if (diff < 2592000) return `${Math.floor(diff / 604800)} ${t('feed.weeksAgo')}`;
        return `${Math.floor(diff / 2592000)} ${t('feed.monthsAgo')}`;
    };

    // Get activity icons for each activity type
    const getActivityIcons = () => {
        const icons = [];
        const types = new Set(activities.map(a => a.type));

        if (types.has('media_added')) {
            icons.push({ icon: <FaPlus />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: t('feed.mediaAdded') });
        }
        if (types.has('media_watched')) {
            icons.push({ icon: <FaCheck />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: t('feed.mediaWatched') });
        }
        if (types.has('favorite_added')) {
            icons.push({ icon: <FaHeart />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', label: t('feed.favoriteAdded') });
        }
        if (types.has('favorite_removed')) {
            icons.push({ icon: <FaHeartBroken />, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20', label: t('feed.favoriteRemoved') });
        }

        return icons;
    };

    // Get media type icon
    const getMediaIcon = () => {
        switch (mediaItem.type) {
            case 'movie':
                return <FaFilm className="text-blue-500" />;
            case 'series':
                return <FaTv className="text-emerald-500" />;
            case 'game':
                return <FaGamepad className="text-amber-500" />;
            case 'book':
                return <FaBook className="text-purple-500" />;
            default:
                return null;
        }
    };

    const activityIcons = getActivityIcons();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group"
        >
            <Link
                to={`/${mediaItem.type}`}
                className="block"
            >
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/5 hover:shadow-lg dark:hover:shadow-black/20">

                    {/* Media Thumbnail */}
                    {mediaItem.image && (
                        <div className="relative w-20 h-28 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow flex-shrink-0">
                            <img
                                src={mediaItem.image}
                                alt={mediaItem.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {mediaItem.rating && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-bold rounded-md backdrop-blur-sm">
                                    ★ {mediaItem.rating}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* User & Time */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {mainActivity.userName}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getTimeAgo(mainActivity.timestamp)}
                            </span>
                        </div>

                        {/* Media Title & Type */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="text-xl">
                                {getMediaIcon()}
                            </div>
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {mediaItem.title}
                            </h4>
                        </div>

                        {/* Activity Icons - Show all actions taken */}
                        <div className="flex flex-wrap items-center gap-2">
                            {activityIcons.map((iconData, idx) => (
                                <div
                                    key={idx}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${iconData.bg} transition-all`}
                                    title={iconData.label}
                                >
                                    <span className={`${iconData.color} text-sm`}>
                                        {iconData.icon}
                                    </span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {iconData.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
