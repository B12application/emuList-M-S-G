// src/frontend/components/NotificationDropdown.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaUser, FaHeart, FaComment } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'follow':
                return <FaUser className="text-blue-500" />;
            case 'like':
                return <FaHeart className="text-red-500" />;
            case 'comment':
                return <FaComment className="text-emerald-500" />;
            default:
                return <FaBell className="text-gray-500" />;
        }
    };

    const getNotificationText = (notification: typeof notifications[0]) => {
        const { type, metadata } = notification;
        const senderName = metadata.senderName;

        switch (type) {
            case 'follow':
                return `${senderName} ${t('notifications.followed')}`;
            case 'like':
                return `${senderName} ${t('notifications.liked')} "${metadata.mediaTitle}"`;
            case 'comment':
                return `${senderName} ${t('notifications.commented')}: "${metadata.commentText}"`;
            default:
                return senderName;
        }
    };

    const handleNotificationClick = async (notification: typeof notifications[0]) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
        }

        // Navigate based on notification type
        if (notification.type === 'follow') {
            navigate(`/user/${notification.senderId}`);
        } else if (notification.activityId) {
            navigate('/feed');
        }

        setIsOpen(false);
    };

    const getTimeAgo = (timestamp: any) => {
        const now = new Date();
        const notificationDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffMs = now.getTime() - notificationDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('feed.justNow');
        if (diffMins < 60) return `${diffMins} ${t('feed.minutesAgo')}`;
        if (diffHours < 24) return `${diffHours} ${t('feed.hoursAgo')}`;
        return `${diffDays} ${t('feed.daysAgo')}`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={t('notifications.title')}
            >
                <FaBell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    {t('notifications.title')}
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllNotificationsAsRead}
                                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                    >
                                        {t('notifications.markAllRead')}
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${!notification.isRead ? 'bg-rose-50 dark:bg-rose-900/10' : ''
                                                }`}
                                        >
                                            <img
                                                src={notification.metadata.senderAvatar || 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png'}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                            />
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getNotificationIcon(notification.type)}
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-rose-500 rounded-full" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {getNotificationText(notification)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {getTimeAgo(notification.timestamp)}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <FaBell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">{t('notifications.empty')}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
