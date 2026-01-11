// src/frontend/components/ActivityCard.tsx
import { useState } from 'react';
import { FaFilm, FaTv, FaGamepad, FaBook, FaHeart, FaHeartBroken, FaPlus, FaCheck, FaComment, FaRegHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '../../backend/types/activity';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import useActivityReactions from '../hooks/useActivityReactions';
import useUserProfile from '../hooks/useUserProfile';
import { getDefaultAvatar } from '../utils/avatarUtils';

interface ActivityCardProps {
    activities: Activity[];
}

export default function ActivityCard({ activities }: ActivityCardProps) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    const mainActivity = activities[0];
    const mediaItem = mainActivity.mediaItem;

    const {
        isLiked,
        likeCount,
        commentCount,
        handleLike,
        handleComment,
        comments
    } = useActivityReactions(mainActivity.id);

    const getTimeAgo = (timestamp: any) => {
        const now = new Date();
        const activityDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

        if (diff < 60) return t('feed.justNow');
        if (diff < 3600) return `${Math.floor(diff / 60)} ${t('feed.minutesAgo')}`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('feed.hoursAgo')}`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ${t('feed.daysAgo')}`;
        if (diff < 2592000) return `${Math.floor(diff / 604800)} ${t('feed.weeksAgo')}`;
        return `${Math.floor(diff / 2592000)} ${t('feed.monthsAgo')}`;
    };

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

    const onLike = () => {
        handleLike(mainActivity.userId, mainActivity.userName, mediaItem.title);
    };

    const onCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim() && user) {
            const userGender = profile?.gender as 'male' | 'female' | undefined;
            // Use profile avatar, then auth photoURL, then default based on gender
            const userAvatar = profile?.avatarUrl || user.photoURL || getDefaultAvatar(userGender);
            handleComment(commentText, mainActivity.userId, userGender, userAvatar);
            setCommentText('');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group"
        >
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 transition-all border border-gray-100 dark:border-white/5 hover:shadow-lg dark:hover:shadow-black/20">

                <div className="flex items-start gap-4 cursor-pointer" onClick={() => window.location.href = `/user/${mainActivity.userId}`}>
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

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {mainActivity.userName}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getTimeAgo(mainActivity.timestamp)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <div className="text-xl">
                                {getMediaIcon()}
                            </div>
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {mediaItem.title}
                            </h4>
                        </div>

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

                <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={onLike}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${isLiked
                            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        {isLiked ? <FaHeart className="text-rose-500" /> : <FaRegHeart />}
                        <span className="text-sm font-medium">{likeCount > 0 ? likeCount : t('reactions.like')}</span>
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all"
                    >
                        <FaComment />
                        <span className="text-sm font-medium">{commentCount > 0 ? commentCount : t('reactions.comment')}</span>
                    </button>
                </div>

                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-gray-100 dark:border-gray-700 pt-3"
                        >
                            <form onSubmit={onCommentSubmit} className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder={t('reactions.writeComment')}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!commentText.trim()}
                                    className="px-4 py-2 text-sm font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t('reactions.send')}
                                </button>
                            </form>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-2 text-sm">
                                            <img
                                                src={comment.userAvatar || getDefaultAvatar(comment.userGender)}
                                                alt={comment.userName}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                                <p className="font-semibold text-gray-900 dark:text-white">{comment.userName}</p>
                                                <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                        {t('reactions.noComments')}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
