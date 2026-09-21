// src/frontend/pages/AdminPage.tsx
// Admin paneli sayfası - Yorum, Kullanıcı ve Giriş Hareketleri Yönetimi

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaShieldAlt, FaTrash, FaComments, FaSpinner, FaUser,
    FaExclamationTriangle, FaUsers, FaEdit, FaTimes, FaCheck, FaSearch,
    FaEnvelope, FaMapMarkerAlt, FaCrown, FaArrowRight, FaUserShield,
    FaCalendar, FaVenusMars, FaSignInAlt,
    FaMobileAlt, FaDesktop, FaTabletAlt, FaLaptop, FaToggleOn, FaToggleOff,
    FaChevronDown, FaChevronUp, FaPaperPlane, FaClock, FaCheckCircle, FaTimesCircle, FaReply
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import PageHeaderBanner from '../components/ui/PageHeaderBanner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadMoreButton from '../components/ui/LoadMoreButton';
import { isAdmin } from '../../backend/config/adminConfig';
import { getAllComments, deleteCommentAsAdmin, getAllUsers, updateUserAsAdmin, deleteUserAsAdmin } from '../../backend/services/adminService';
import type { CommentWithActivity, AdminUser } from '../../backend/services/adminService';
import { getLoginLogs } from '../../backend/services/loginLogService';
import type { LoginLog } from '../../backend/services/loginLogService';
import { setFeatureAccess, getAllFeatureAccess, ALL_FEATURES, FEATURE_LABELS } from '../services/featureAccessService';
import type { FeatureKey } from '../services/featureAccessService';
import { getAllAccessRequests, updateAccessRequestStatus, deleteAccessRequest } from '../services/accessRequestService';
import type { AccessRequest } from '../services/accessRequestService';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'users' | 'comments' | 'logins' | 'features' | 'requests';
type UserFilterType = 'all' | 'admins' | 'male' | 'female' | 'active';

const PAGE_SIZE_USERS = 10;
const PAGE_SIZE_LOGS = 15;
const PAGE_SIZE_COMMENTS = 15;
const PAGE_SIZE_FEATURES = 10;
const PAGE_SIZE_REQUESTS = 15;

export default function AdminPage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [userFilter, setUserFilter] = useState<UserFilterType>('all');

    // Comments state
    const [comments, setComments] = useState<CommentWithActivity[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
    const [commentsSearchQuery, setCommentsSearchQuery] = useState('');
    const [visibleCommentsCount, setVisibleCommentsCount] = useState(PAGE_SIZE_COMMENTS);

    // Users state
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({ displayName: '', gender: '' as 'male' | 'female' | '', bio: '', location: '' });
    const [savingUser, setSavingUser] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleUsersCount, setVisibleUsersCount] = useState(PAGE_SIZE_USERS);

    // Confirm Dialog state
    const [confirmDelete, setConfirmDelete] = useState<{
        type: 'user' | 'comment';
        id: string;
        name?: string;
    } | null>(null);

    // Login logs state
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
    const [loginLogsLoading, setLoginLogsLoading] = useState(false);
    const [logsSearchQuery, setLogsSearchQuery] = useState('');
    const [visibleLogsCount, setVisibleLogsCount] = useState(PAGE_SIZE_LOGS);

    // Feature access state
    const [featureAccessMap, setFeatureAccessMap] = useState<Record<string, Record<FeatureKey, boolean>>>({});
    const [featureAccessLoading, setFeatureAccessLoading] = useState(false);
    const [togglingFeature, setTogglingFeature] = useState<string | null>(null);
    const [featureSearchQuery, setFeatureSearchQuery] = useState('');
    const [expandedFeatureUserId, setExpandedFeatureUserId] = useState<string | null>(null);
    const [visibleFeaturesCount, setVisibleFeaturesCount] = useState(PAGE_SIZE_FEATURES);

    // Access Requests state
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [requestSearchQuery, setRequestSearchQuery] = useState('');
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [visibleRequestsCount, setVisibleRequestsCount] = useState(PAGE_SIZE_REQUESTS);

    // Admin kontrolü
    useEffect(() => {
        if (user && !isAdmin(user.uid, user.email)) {
            toast.error(t('admin.accessDenied') || 'Bu sayfaya erişim yetkiniz yok!');
            navigate('/');
        }
    }, [user, navigate, t]);

    // Erişim taleplerini yükle
    useEffect(() => {
        if (activeTab === 'requests' && user && isAdmin(user.uid, user.email)) {
            setRequestsLoading(true);
            getAllAccessRequests(user.uid || user.email || '')
                .then(data => setAccessRequests(data))
                .catch(err => {
                    console.error('Talepler yüklenemedi:', err);
                    toast.error('Talepler yüklenirken hata oluştu');
                })
                .finally(() => setRequestsLoading(false));
        }
    }, [activeTab, user]);

    const handleApproveRequest = async (req: AccessRequest) => {
        if (!user || !req.id) return;
        setProcessingRequestId(req.id);
        try {
            await updateAccessRequestStatus(user.uid || user.email || '', req.id, 'approved', {
                targetUserId: req.userId,
                featureKey: req.featureKey
            });
            setAccessRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
            toast.success(`Talep onaylandı ve ${req.featureLabel} özelliği aktif edildi!`);
        } catch (err) {
            console.error(err);
            toast.error('Talep onaylanırken hata oluştu.');
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleRejectRequest = async (req: AccessRequest) => {
        if (!user || !req.id) return;
        setProcessingRequestId(req.id);
        try {
            await updateAccessRequestStatus(user.uid || user.email || '', req.id, 'rejected');
            setAccessRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
            toast.success('Talep reddedildi.');
        } catch (err) {
            console.error(err);
            toast.error('Talep güncellenirken hata oluştu.');
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (!user) return;
        try {
            await deleteAccessRequest(user.uid || user.email || '', requestId);
            setAccessRequests(prev => prev.filter(r => r.id !== requestId));
            toast.success('Talep silindi.');
        } catch (err) {
            console.error(err);
            toast.error('Talep silinirken hata oluştu.');
        }
    };

    // Kullanıcıları yükle
    useEffect(() => {
        const fetchUsers = async () => {
            if (!user || !isAdmin(user.uid)) return;

            setUsersLoading(true);
            try {
                const data = await getAllUsers(user.uid);
                setUsers(data);
            } catch (error) {
                console.error('Kullanıcılar yüklenemedi:', error);
                toast.error('Kullanıcılar yüklenirken hata oluştu');
            } finally {
                setUsersLoading(false);
            }
        };

        fetchUsers();
    }, [user]);

    // Feature access data loader
    const loadFeatureAccessData = async () => {
        if (!user) return;
        setFeatureAccessLoading(true);
        try {
            const map: Record<string, Record<FeatureKey, boolean>> = {};
            for (const u of users) {
                map[u.id] = await getAllFeatureAccess(u.id);
            }
            setFeatureAccessMap(map);
        } catch (error) {
            console.error('Feature access yüklenemedi:', error);
        } finally {
            setFeatureAccessLoading(false);
        }
    };

    // Yorumları veya Giriş loglarını sekme değiştikçe yükle
    useEffect(() => {
        if (!user || !isAdmin(user.uid)) return;

        if (activeTab === 'comments' && comments.length === 0) {
            setCommentsLoading(true);
            getAllComments(user.uid)
                .then(data => setComments(data))
                .catch(err => {
                    console.error('Yorumlar yüklenemedi:', err);
                    toast.error('Yorumlar yüklenirken hata oluştu');
                })
                .finally(() => setCommentsLoading(false));
        }

        if (activeTab === 'logins' && loginLogs.length === 0) {
            setLoginLogsLoading(true);
            getLoginLogs(user.uid)
                .then(data => setLoginLogs(data))
                .catch(err => {
                    console.error('Giriş kayıtları yüklenemedi:', err);
                    toast.error('Giriş logları yüklenirken hata oluştu');
                })
                .finally(() => setLoginLogsLoading(false));
        }

        if (activeTab === 'features' && Object.keys(featureAccessMap).length === 0 && users.length > 0) {
            loadFeatureAccessData();
        }
    }, [user, activeTab, comments.length, loginLogs.length, users.length]);

    const executeDeleteComment = async (commentId: string) => {
        if (!user) return;
        setDeletingCommentId(commentId);
        try {
            const success = await deleteCommentAsAdmin(user.uid, commentId);
            if (success) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                toast.success(t('admin.commentDeleted') || 'Yorum silindi');
            } else {
                toast.error(t('admin.commentDeleteError') || 'Yorum silinemedi');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setDeletingCommentId(null);
            setConfirmDelete(null);
        }
    };

    const executeDeleteUser = async (userId: string) => {
        if (!user) return;
        setDeletingUserId(userId);
        try {
            const success = await deleteUserAsAdmin(user.uid, userId);
            if (success) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                toast.success('Kullanıcı silindi');
            } else {
                toast.error('Kullanıcı silinemedi');
            }
        } catch (error: any) {
            toast.error(error.message || 'Bir hata oluştu');
        } finally {
            setDeletingUserId(null);
            setConfirmDelete(null);
        }
    };

    const handleEditUser = (userToEdit: AdminUser) => {
        setEditingUser(userToEdit);
        setEditForm({
            displayName: userToEdit.displayName || '',
            gender: userToEdit.gender || '',
            bio: userToEdit.bio || '',
            location: userToEdit.location || ''
        });
    };

    const handleSaveUser = async () => {
        if (!user || !editingUser) return;

        setSavingUser(true);
        try {
            const success = await updateUserAsAdmin(user.uid, editingUser.id, {
                displayName: editForm.displayName,
                gender: editForm.gender,
                bio: editForm.bio,
                location: editForm.location
            });
            if (success) {
                setUsers(prev => prev.map(u =>
                    u.id === editingUser.id
                        ? { ...u, ...editForm }
                        : u
                ));
                toast.success(t('admin.userUpdated') || 'Kullanıcı güncellendi');
                setEditingUser(null);
            } else {
                toast.error(t('admin.userUpdateError') || 'Güncellenemedi');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setSavingUser(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getDeviceIcon = (deviceType?: string) => {
        if (deviceType === 'mobile') return <FaMobileAlt className="text-amber-500" />;
        if (deviceType === 'tablet') return <FaTabletAlt className="text-purple-500" />;
        return <FaDesktop className="text-blue-500" />;
    };

    // Filtered Users with Pills + Search
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            // Text search
            const q = searchQuery.toLowerCase().trim();
            const matchesText = !q || (
                (u.displayName || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
            if (!matchesText) return false;

            // Pill filter
            if (userFilter === 'admins') return isAdmin(u.id);
            if (userFilter === 'male') return u.gender === 'male';
            if (userFilter === 'female') return u.gender === 'female';
            if (userFilter === 'active') return !!u.lastLoginAt;
            return true;
        });
    }, [users, searchQuery, userFilter]);

    const visibleUsers = useMemo(() => {
        return filteredUsers.slice(0, visibleUsersCount);
    }, [filteredUsers, visibleUsersCount]);

    // Filtered Login Logs
    const filteredLoginLogs = useMemo(() => {
        const q = logsSearchQuery.toLowerCase().trim();
        if (!q) return loginLogs;
        return loginLogs.filter(l =>
            (l.displayName || '').toLowerCase().includes(q) ||
            (l.email || '').toLowerCase().includes(q) ||
            (l.browser || '').toLowerCase().includes(q) ||
            (l.os || '').toLowerCase().includes(q)
        );
    }, [loginLogs, logsSearchQuery]);

    const visibleLoginLogs = useMemo(() => {
        return filteredLoginLogs.slice(0, visibleLogsCount);
    }, [filteredLoginLogs, visibleLogsCount]);

    // Filtered Comments
    const filteredComments = useMemo(() => {
        const q = commentsSearchQuery.toLowerCase().trim();
        if (!q) return comments;
        return comments.filter(c =>
            (c.text || '').toLowerCase().includes(q) ||
            (c.userName || '').toLowerCase().includes(q)
        );
    }, [comments, commentsSearchQuery]);

    const visibleComments = useMemo(() => {
        return filteredComments.slice(0, visibleCommentsCount);
    }, [filteredComments, visibleCommentsCount]);

    // Feature Access Helpers
    const handleToggleFeature = async (userId: string, feature: FeatureKey) => {
        if (!user) return;
        const current = featureAccessMap[userId]?.[feature] ?? (feature !== 'calorieAi');
        const newVal = !current;
        setTogglingFeature(`${userId}-${feature}`);
        try {
            const success = await setFeatureAccess(user.uid, userId, feature, newVal);
            if (success) {
                setFeatureAccessMap(prev => ({
                    ...prev,
                    [userId]: { ...prev[userId], [feature]: newVal }
                }));
                const label = language === 'tr' ? FEATURE_LABELS[feature]?.tr : FEATURE_LABELS[feature]?.en;
                toast.success(`${label || feature}: ${newVal ? '✓' : '✕'}`);
            }
        } catch (error) {
            toast.error('Güncelleme başarısız');
        } finally {
            setTogglingFeature(null);
        }
    };

    const featureFilteredUsers = useMemo(() => {
        const q = featureSearchQuery.toLowerCase().trim();
        if (!q) return users;
        return users.filter(u =>
            (u.displayName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    }, [users, featureSearchQuery]);

    const visibleFeatureUsers = useMemo(() => {
        return featureFilteredUsers.slice(0, visibleFeaturesCount);
    }, [featureFilteredUsers, visibleFeaturesCount]);

    const filteredRequests = useMemo(() => {
        return accessRequests.filter(req => {
            if (requestFilter !== 'all' && req.status !== requestFilter) return false;
            if (requestSearchQuery.trim()) {
                const q = requestSearchQuery.toLowerCase();
                return (
                    (req.userName || '').toLowerCase().includes(q) ||
                    (req.userEmail || '').toLowerCase().includes(q) ||
                    (req.featureLabel || '').toLowerCase().includes(q) ||
                    (req.message && req.message.toLowerCase().includes(q))
                );
            }
            return true;
        });
    }, [accessRequests, requestFilter, requestSearchQuery]);

    const visibleRequests = useMemo(() => {
        return filteredRequests.slice(0, visibleRequestsCount);
    }, [filteredRequests, visibleRequestsCount]);

    const pendingRequestsCount = useMemo(() => {
        return accessRequests.filter(r => r.status === 'pending').length;
    }, [accessRequests]);

    if (!user || !isAdmin(user.uid, user.email)) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-xl max-w-md w-full">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
                        <FaExclamationTriangle className="text-4xl text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-black text-stone-900 dark:text-white mb-2">
                        {t('calorieChat.accessDenied') || 'Erişim Reddedildi'}
                    </h1>
                    <p className="text-stone-500 dark:text-zinc-400 text-sm mb-6">
                        {t('calorieChat.accessDeniedDesc') || 'Bu sayfaya yalnızca sistem yöneticisi erişebilir.'}
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-stone-950 font-bold rounded-2xl shadow-md hover:bg-amber-300 transition-all text-sm"
                    >
                        <FaArrowRight className="rotate-180 text-xs" />
                        <span>{t('admin.backToSite') || 'Siteye Dön'}</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Header Banner (Rule #15 Standard) */}
            <PageHeaderBanner
                title={t('admin.title') || 'Sistem Yönetim Paneli'}
                subtitle={t('admin.subtitle') || 'Kullanıcı yetkileri, güvenlik logları ve yorum denetim merkezi'}
                icon={<FaShieldAlt className="text-amber-500 text-xl" />}
                backTo="/"
                backLabel={t('admin.backToSite') || 'Siteye Dön'}
            />

            {/* Fluid Container (Rule #16 Standard) */}
            <div className="w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Executive Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-stone-200/80 dark:border-zinc-800/80 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
                            <FaUsers />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">{users.length}</div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-bold">
                                {t('admin.statsUsers') || 'Kayıtlı Kullanıcı'}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 }}
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-stone-200/80 dark:border-zinc-800/80 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                            <FaSignInAlt />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">
                                {users.filter(u => u.lastLoginAt).length || users.length}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-bold">
                                {t('admin.statsActive') || 'Aktif / Giriş Yapan'}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-stone-200/80 dark:border-zinc-800/80 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
                            <FaComments />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">{comments.length}</div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-bold">
                                {t('admin.statsComments') || 'Toplam Yorum'}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 }}
                        onClick={() => setActiveTab('requests')}
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-stone-200/80 dark:border-zinc-800/80 flex items-center gap-4 cursor-pointer hover:border-rose-400 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                            <FaPaperPlane />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                                <span>{accessRequests.length}</span>
                                {pendingRequestsCount > 0 && (
                                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full animate-pulse">
                                        {pendingRequestsCount} bekleyen
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-bold">
                                {t('admin.tabRequests') || 'Erişim Talepleri'}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2.5 mb-6">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'users'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-[1.02]'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-800 hover:border-blue-400'
                            }`}
                    >
                        <FaUsers />
                        <span>{t('admin.tabUsers') || 'Kullanıcılar'}</span>
                        <span className="text-xs opacity-75 ml-1">({filteredUsers.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('logins')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'logins'
                            ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-800 hover:border-amber-400'
                            }`}
                    >
                        <FaSignInAlt />
                        <span>{t('admin.tabLogins') || 'Son Girişler (Güvenlik)'}</span>
                        {loginLogs.length > 0 && <span className="text-xs opacity-75 ml-1">({loginLogs.length})</span>}
                    </button>

                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'comments'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-800 hover:border-indigo-400'
                            }`}
                    >
                        <FaComments />
                        <span>{t('admin.tabComments') || 'Yorumlar'}</span>
                        <span className="text-xs opacity-75 ml-1">({comments.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('features')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'features'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 scale-[1.02]'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-800 hover:border-emerald-400'
                            }`}
                    >
                        <FaToggleOn />
                        <span>{t('admin.tabFeatures') || 'Özellik Yönetimi'}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'requests'
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 scale-[1.02]'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-800 hover:border-rose-400'
                            }`}
                    >
                        <FaPaperPlane />
                        <span>{t('admin.tabRequests') || 'Erişim Talepleri'}</span>
                        {pendingRequestsCount > 0 ? (
                            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                                {pendingRequestsCount} yeni
                            </span>
                        ) : (
                            <span className="text-xs opacity-75 ml-1">({accessRequests.length})</span>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {/* ===================== USERS TAB ===================== */}
                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            {/* Search & Filter Pills Row */}
                            <div className="p-5 sm:p-6 border-b border-stone-200/80 dark:border-zinc-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                                <div className="relative flex-1 max-w-md">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.searchUsersPlaceholder') || 'İsim veya e-posta ile kullanıcı ara...'}
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setVisibleUsersCount(PAGE_SIZE_USERS);
                                        }}
                                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-blue-500 text-sm font-medium outline-none"
                                    />
                                </div>

                                {/* Filter Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                                    {[
                                        { key: 'all', label: t('admin.filterAll') || 'Tümü' },
                                        { key: 'admins', label: t('admin.filterAdmins') || 'Yöneticiler' },
                                        { key: 'male', label: t('admin.filterMale') || 'Erkek' },
                                        { key: 'female', label: t('admin.filterFemale') || 'Kadın' },
                                        { key: 'active', label: t('admin.filterActive') || 'Giriş Yapanlar' },
                                    ].map(pill => (
                                        <button
                                            key={pill.key}
                                            onClick={() => {
                                                setUserFilter(pill.key as UserFilterType);
                                                setVisibleUsersCount(PAGE_SIZE_USERS);
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                                userFilter === pill.key
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {pill.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {usersLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <FaSpinner className="animate-spin text-3xl text-blue-500" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-20">
                                    <FaUsers className="text-5xl text-stone-300 dark:text-zinc-700 mx-auto mb-3" />
                                    <p className="text-stone-500 dark:text-zinc-400 font-medium">
                                        {t('admin.noUsersFound') || 'Arama kriterlerine uygun kullanıcı bulunamadı.'}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                                        {visibleUsers.map((u, idx) => {
                                            const userIsAdmin = isAdmin(u.id);
                                            return (
                                                <motion.div
                                                    key={u.id}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    className="px-5 sm:px-6 py-4 hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                                >
                                                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                                        {/* Avatar */}
                                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-bold shrink-0 overflow-hidden shadow-md">
                                                            {u.photoURL ? (
                                                                <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                u.displayName?.charAt(0)?.toUpperCase() || <FaUser size={14} />
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                                <span className="font-extrabold text-stone-900 dark:text-white text-sm sm:text-base truncate">
                                                                    {u.displayName || t('admin.anonymousUser') || 'İsimsiz Kullanıcı'}
                                                                </span>
                                                                {u.id === user?.uid && (
                                                                    <span className="text-[9px] px-2 py-0.5 bg-amber-400 text-stone-950 rounded-full font-black uppercase tracking-wider">
                                                                        {t('admin.youAdminBadge') || 'SEN (YÖNETİCİ)'}
                                                                    </span>
                                                                )}
                                                                {userIsAdmin && u.id !== user?.uid && (
                                                                    <span className="text-[9px] px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full font-black uppercase tracking-wider">
                                                                        ADMIN
                                                                    </span>
                                                                )}
                                                                {u.gender && (
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                                                                        u.gender === 'male'
                                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                                            : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                                                                    }`}>
                                                                        <FaVenusMars size={9} />
                                                                        {u.gender === 'male' ? (t('admin.filterMale') || 'Erkek') : (t('admin.filterFemale') || 'Kadın')}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-zinc-400">
                                                                <span className="flex items-center gap-1">
                                                                    <FaEnvelope size={10} className="opacity-60" />
                                                                    {u.email}
                                                                </span>
                                                                {u.location && (
                                                                    <span className="flex items-center gap-1">
                                                                        <FaMapMarkerAlt size={10} className="opacity-60" />
                                                                        {u.location}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Metadata row */}
                                                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-stone-400 dark:text-zinc-500">
                                                                {u.lastLoginAt ? (
                                                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                                        <FaSignInAlt size={9} />
                                                                        {t('admin.lastLogin') || 'Son Giriş'}: {formatDate(u.lastLoginAt)}
                                                                    </span>
                                                                ) : u.createdAt ? (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <FaCalendar size={9} />
                                                                        {t('admin.registration') || 'Kayıt'}: {formatDate(u.createdAt)}
                                                                    </span>
                                                                ) : null}

                                                                {u.lastDevice && (
                                                                    <span className="inline-flex items-center gap-1 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                                                        <FaLaptop size={9} />
                                                                        {u.lastDevice}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                        <button
                                                            onClick={() => handleEditUser(u)}
                                                            className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition cursor-pointer"
                                                            title={t('admin.editUserTitle') || 'Düzenle'}
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        {u.id !== user?.uid && (
                                                            <button
                                                                onClick={() => setConfirmDelete({
                                                                    type: 'user',
                                                                    id: u.id,
                                                                    name: u.displayName || u.email
                                                                })}
                                                                disabled={deletingUserId === u.id}
                                                                className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition disabled:opacity-50 cursor-pointer"
                                                                title={t('actions.delete') || 'Sil'}
                                                            >
                                                                {deletingUserId === u.id ? (
                                                                    <FaSpinner className="animate-spin" size={14} />
                                                                ) : (
                                                                    <FaTrash size={14} />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination (Rule #6 Standard) */}
                                    {filteredUsers.length > visibleUsersCount && (
                                        <div className="p-4 text-center border-t border-stone-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-900/50">
                                            <LoadMoreButton
                                                onClick={() => setVisibleUsersCount(prev => prev + PAGE_SIZE_USERS)}
                                                remainingCount={filteredUsers.length - visibleUsersCount}
                                                label={t('admin.loadMore') || 'Daha Fazla Göster'}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ===================== LOGINS TAB ===================== */}
                    {activeTab === 'logins' && (
                        <motion.div
                            key="logins"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            <div className="p-5 sm:px-6 py-4 border-b border-stone-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                                        <FaSignInAlt className="text-amber-500" />
                                        <span>{t('admin.loginsHeading') || 'Son Giriş Yapanlar & Cihaz Aktiviteleri'}</span>
                                    </h2>
                                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                                        {t('admin.loginsSub') || 'Kullanıcıların en son sisteme giriş yaptığı cihaz ve zaman kayıtları'}
                                    </p>
                                </div>

                                <div className="relative min-w-[240px]">
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.searchLogsPlaceholder') || 'Cihaz, IP veya isim ile ara...'}
                                        value={logsSearchQuery}
                                        onChange={(e) => {
                                            setLogsSearchQuery(e.target.value);
                                            setVisibleLogsCount(PAGE_SIZE_LOGS);
                                        }}
                                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white placeholder:text-stone-400 text-xs outline-none"
                                    />
                                </div>
                            </div>

                            {loginLogsLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <FaSpinner className="animate-spin text-3xl text-amber-500" />
                                </div>
                            ) : filteredLoginLogs.length === 0 ? (
                                <div className="text-center py-20">
                                    <FaSignInAlt className="text-5xl text-stone-300 dark:text-zinc-700 mx-auto mb-3" />
                                    <p className="text-stone-500 dark:text-zinc-400 font-medium">
                                        {t('admin.noLogsFound') || 'Henüz kaydedilmiş giriş hareketi bulunmuyor.'}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                                        {visibleLoginLogs.map((log, idx) => (
                                            <motion.div
                                                key={log.id || idx}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="px-5 sm:px-6 py-3.5 hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-sm font-black shrink-0 shadow-md">
                                                        {log.photoURL ? (
                                                            <img src={log.photoURL} alt="" className="w-full h-full object-cover rounded-xl" />
                                                        ) : (
                                                            (log.displayName || log.email || '?')[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-stone-900 dark:text-white text-sm truncate">
                                                                {log.displayName || log.email}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                                                            {log.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Device, Browser, OS and Timestamp */}
                                                <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-zinc-400 self-end sm:self-center shrink-0">
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-zinc-800 text-[11px] font-semibold">
                                                        {getDeviceIcon(log.deviceType)}
                                                        <span>{log.browser} · {log.os}</span>
                                                    </span>
                                                    <span className="text-[11px] font-bold text-stone-600 dark:text-zinc-300">
                                                        {formatDate(log.timestamp)}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Pagination (Rule #6 Standard) */}
                                    {filteredLoginLogs.length > visibleLogsCount && (
                                        <div className="p-4 text-center border-t border-stone-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-900/50">
                                            <LoadMoreButton
                                                onClick={() => setVisibleLogsCount(prev => prev + PAGE_SIZE_LOGS)}
                                                remainingCount={filteredLoginLogs.length - visibleLogsCount}
                                                label={t('admin.loadMore') || 'Daha Fazla Göster'}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ===================== COMMENTS TAB ===================== */}
                    {activeTab === 'comments' && (
                        <motion.div
                            key="comments"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            <div className="p-5 sm:px-6 py-4 border-b border-stone-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                                        <FaComments className="text-indigo-500" />
                                        <span>{t('admin.tabComments') || 'Yorumlar'}</span>
                                    </h2>
                                </div>

                                <div className="relative min-w-[240px]">
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.searchCommentsPlaceholder') || 'Yorum metni veya kullanıcı ara...'}
                                        value={commentsSearchQuery}
                                        onChange={(e) => {
                                            setCommentsSearchQuery(e.target.value);
                                            setVisibleCommentsCount(PAGE_SIZE_COMMENTS);
                                        }}
                                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white placeholder:text-stone-400 text-xs outline-none"
                                    />
                                </div>
                            </div>

                            {commentsLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <FaSpinner className="animate-spin text-3xl text-indigo-500" />
                                </div>
                            ) : filteredComments.length === 0 ? (
                                <div className="text-center py-20">
                                    <FaComments className="text-5xl text-stone-300 dark:text-zinc-700 mx-auto mb-3" />
                                    <p className="text-stone-500 dark:text-zinc-400 font-medium">
                                        {t('admin.noCommentsFound') || 'Henüz sistemde yorum bulunmuyor.'}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                                        {visibleComments.map((comment, idx) => (
                                            <motion.div
                                                key={comment.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="px-5 sm:px-6 py-4 hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors flex items-start justify-between gap-4"
                                            >
                                                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold shrink-0">
                                                        {comment.userAvatar ? (
                                                            <img src={comment.userAvatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                        ) : (
                                                            (comment.userName || '?')[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-stone-900 dark:text-white text-sm">
                                                                {comment.userName}
                                                            </span>
                                                            <span className="text-[10px] text-stone-400">
                                                                {formatDate(comment.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-stone-700 dark:text-zinc-300 leading-relaxed break-words">
                                                            {comment.text}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setConfirmDelete({
                                                        type: 'comment',
                                                        id: comment.id
                                                    })}
                                                    disabled={deletingCommentId === comment.id}
                                                    className="shrink-0 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition cursor-pointer"
                                                    title={t('actions.delete') || 'Sil'}
                                                >
                                                    {deletingCommentId === comment.id ? (
                                                        <FaSpinner className="animate-spin" size={14} />
                                                    ) : (
                                                        <FaTrash size={14} />
                                                    )}
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Pagination (Rule #6 Standard) */}
                                    {filteredComments.length > visibleCommentsCount && (
                                        <div className="p-4 text-center border-t border-stone-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-900/50">
                                            <LoadMoreButton
                                                onClick={() => setVisibleCommentsCount(prev => prev + PAGE_SIZE_COMMENTS)}
                                                remainingCount={filteredComments.length - visibleCommentsCount}
                                                label={t('admin.loadMore') || 'Daha Fazla Göster'}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ===================== FEATURES TAB (Clean Compact Collapsible Architecture) ===================== */}
                    {activeTab === 'features' && (
                        <motion.div
                            key="features"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-5 sm:px-6 py-4 border-b border-stone-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                                        <FaToggleOn className="text-emerald-500" />
                                        <span>{t('admin.featuresHeading') || 'Modül & Özellik Erişim Yönetimi'}</span>
                                    </h3>
                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                                        {t('admin.featuresSub') || 'Kullanıcı bazında modül erişimlerini (Kalori AI, Beden Profili vb.) anında açıp kapatın'}
                                    </p>
                                </div>

                                <div className="relative min-w-[240px]">
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.searchFeaturesPlaceholder') || 'Yetki düzenlemek için kullanıcı ara...'}
                                        value={featureSearchQuery}
                                        onChange={(e) => {
                                            setFeatureSearchQuery(e.target.value);
                                            setVisibleFeaturesCount(PAGE_SIZE_FEATURES);
                                        }}
                                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white placeholder:text-stone-400 text-xs outline-none"
                                    />
                                </div>
                            </div>

                            {featureAccessLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <FaSpinner className="animate-spin text-3xl text-emerald-500" />
                                </div>
                            ) : (
                                <div>
                                    <div className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                                        {visibleFeatureUsers.map(u => {
                                            const isExpanded = expandedFeatureUserId === u.id;
                                            const userAccess = featureAccessMap[u.id] || {};
                                            const activeCount = ALL_FEATURES.filter(f => userAccess[f] ?? (f !== 'calorieAi')).length;

                                            return (
                                                <div key={u.id} className="p-4 sm:p-5 hover:bg-stone-50/50 dark:hover:bg-zinc-800/25 transition-colors">
                                                    {/* User Bar with Summary & Accordion Toggle */}
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm">
                                                                {(u.displayName || u.email || '?')[0].toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-sm font-bold text-stone-900 dark:text-white truncate">
                                                                    {u.displayName || t('admin.anonymousUser') || 'İsimsiz Kullanıcı'}
                                                                </div>
                                                                <div className="text-[11px] text-stone-400 dark:text-zinc-500 truncate">
                                                                    {u.email}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right Badge + Toggle Button */}
                                                        <div className="flex items-center gap-2.5 shrink-0">
                                                            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                                                {activeCount} / {ALL_FEATURES.length} {t('nav.tools') || 'Aktif'}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedFeatureUserId(isExpanded ? null : u.id)}
                                                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                <span>{isExpanded ? (t('admin.hidePermissions') || 'Gizle') : (t('admin.managePermissions') || 'Yetkileri Yönet')}</span>
                                                                {isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Collapsible Feature Switches Grid */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden pt-4"
                                                            >
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 p-3 rounded-2xl bg-stone-100/60 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-700/50">
                                                                    {ALL_FEATURES.map(feature => {
                                                                        const isEnabled = userAccess[feature] ?? (feature !== 'calorieAi');
                                                                        const isToggling = togglingFeature === `${u.id}-${feature}`;
                                                                        const labelObj = FEATURE_LABELS[feature];
                                                                        const labelText = language === 'tr' ? labelObj?.tr : labelObj?.en;

                                                                        return (
                                                                            <button
                                                                                key={feature}
                                                                                onClick={() => handleToggleFeature(u.id, feature)}
                                                                                disabled={isToggling}
                                                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                                                    isEnabled
                                                                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                                                                        : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-400 dark:text-zinc-600'
                                                                                } ${isToggling ? 'opacity-50' : 'hover:scale-[1.02]'}`}
                                                                            >
                                                                                <span className="text-base">{labelObj?.icon || '⚙️'}</span>
                                                                                <span className="truncate flex-1 text-left">{labelText || feature}</span>
                                                                                {isToggling ? (
                                                                                    <FaSpinner className="animate-spin text-[10px] shrink-0" />
                                                                                ) : isEnabled ? (
                                                                                    <FaToggleOn className="text-emerald-500 text-lg shrink-0" />
                                                                                ) : (
                                                                                    <FaToggleOff className="text-stone-300 dark:text-zinc-600 text-lg shrink-0" />
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination (Rule #6 Standard) */}
                                    {featureFilteredUsers.length > visibleFeaturesCount && (
                                        <div className="p-4 text-center border-t border-stone-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-900/50">
                                            <LoadMoreButton
                                                onClick={() => setVisibleFeaturesCount(prev => prev + PAGE_SIZE_FEATURES)}
                                                remainingCount={featureFilteredUsers.length - visibleFeaturesCount}
                                                label={t('admin.loadMore') || 'Daha Fazla Göster'}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ===================== ACCESS REQUESTS TAB ===================== */}
                    {activeTab === 'requests' && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            {/* Search & Status Filters */}
                            <div className="p-5 sm:p-6 border-b border-stone-200/80 dark:border-zinc-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                                <div className="relative flex-1 max-w-md">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                                    <input
                                        type="text"
                                        placeholder={language === 'tr' ? 'İsim, e-posta, özellik veya mesaj ara...' : 'Search by name, email, feature or message...'}
                                        value={requestSearchQuery}
                                        onChange={(e) => {
                                            setRequestSearchQuery(e.target.value);
                                            setVisibleRequestsCount(PAGE_SIZE_REQUESTS);
                                        }}
                                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-rose-500 text-sm font-medium outline-none"
                                    />
                                </div>

                                {/* Status Filters */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                                    {[
                                        { key: 'all', label: language === 'tr' ? 'Tümü' : 'All' },
                                        { key: 'pending', label: language === 'tr' ? 'Bekleyenler' : 'Pending' },
                                        { key: 'approved', label: language === 'tr' ? 'Onaylananlar' : 'Approved' },
                                        { key: 'rejected', label: language === 'tr' ? 'Reddedilenler' : 'Rejected' },
                                    ].map((f) => (
                                        <button
                                            key={f.key}
                                            onClick={() => {
                                                setRequestFilter(f.key as any);
                                                setVisibleRequestsCount(PAGE_SIZE_REQUESTS);
                                            }}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                                requestFilter === f.key
                                                    ? 'bg-rose-600 text-white shadow-md'
                                                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Requests List */}
                            {requestsLoading ? (
                                <div className="p-12 text-center text-stone-400">
                                    <FaSpinner className="animate-spin text-2xl mx-auto mb-2 text-rose-500" />
                                    <span className="text-xs font-medium">{language === 'tr' ? 'Talepler yükleniyor...' : 'Loading requests...'}</span>
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                                        <FaPaperPlane />
                                    </div>
                                    <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
                                        {language === 'tr' ? 'Talep Bulunamadı' : 'No Requests Found'}
                                    </h4>
                                    <p className="text-xs text-stone-400">
                                        {language === 'tr' ? 'Henüz bu filtreye uygun bir erişim veya iletişim talebi bulunmuyor.' : 'No access or communication requests matching this filter.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                    {visibleRequests.map((req) => (
                                        <div key={req.id} className="p-5 sm:p-6 hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="flex items-start gap-3.5 min-w-0">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                                                        {(req.userName || req.userEmail || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-black text-sm text-stone-900 dark:text-white">
                                                                {req.userName || 'B12 Kullanıcısı'}
                                                            </span>
                                                            <span className="text-xs text-stone-400 dark:text-zinc-500">
                                                                {req.userEmail}
                                                            </span>
                                                            {/* Status Badge */}
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                                req.status === 'approved'
                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                                                    : req.status === 'rejected'
                                                                    ? 'bg-stone-200 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
                                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                                                            }`}>
                                                                {req.status === 'approved' ? (language === 'tr' ? '✓ Onaylandı' : '✓ Approved') : req.status === 'rejected' ? (language === 'tr' ? '✕ Reddedildi' : '✕ Rejected') : (language === 'tr' ? '⏳ Beklemede' : '⏳ Pending')}
                                                            </span>
                                                        </div>

                                                        {/* Feature badge & date */}
                                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-200/80 dark:border-amber-900/40 font-mono">
                                                                🎯 {req.featureLabel || req.featureKey}
                                                            </span>
                                                            <span className="text-[10px] text-stone-400 dark:text-zinc-500 flex items-center gap-1">
                                                                <FaClock className="text-[9px]" />
                                                                {formatDate(req.createdAt)}
                                                            </span>
                                                        </div>

                                                        {/* User message */}
                                                        {req.message && (
                                                            <div className="mt-2.5 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-950/60 border border-stone-200/70 dark:border-zinc-800 text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
                                                                <span className="font-semibold text-stone-400 dark:text-zinc-500 mr-1.5">{language === 'tr' ? 'Mesaj:' : 'Note:'}</span>
                                                                {req.message}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApproveRequest(req)}
                                                                disabled={processingRequestId === req.id}
                                                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                                            >
                                                                <FaCheckCircle className="text-xs" />
                                                                <span>{language === 'tr' ? 'Onayla & Yetki Ver' : 'Approve & Grant'}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRejectRequest(req)}
                                                                disabled={processingRequestId === req.id}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-stone-600 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                                                            >
                                                                <FaTimesCircle className="text-xs text-rose-500" />
                                                                <span>{language === 'tr' ? 'Reddet' : 'Reject'}</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    <a
                                                        href={`mailto:${req.userEmail}?subject=${encodeURIComponent(language === 'tr' ? `B12 ${req.featureLabel} Talebi Hakkında` : `Regarding your B12 ${req.featureLabel} request`)}`}
                                                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-900/50 text-xs transition-colors"
                                                        title={language === 'tr' ? 'E-posta ile yanıtla' : 'Reply via email'}
                                                    >
                                                        <FaReply />
                                                    </a>

                                                    <button
                                                        type="button"
                                                        onClick={() => req.id && handleDeleteRequest(req.id)}
                                                        className="p-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs transition-colors cursor-pointer"
                                                        title={language === 'tr' ? 'Talebi sil' : 'Delete request'}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Load More Button (Rule #6 Standard) */}
                            {filteredRequests.length > visibleRequestsCount && (
                                <div className="p-4 text-center border-t border-stone-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-900/50">
                                    <LoadMoreButton
                                        onClick={() => setVisibleRequestsCount(prev => prev + PAGE_SIZE_REQUESTS)}
                                        remainingCount={filteredRequests.length - visibleRequestsCount}
                                        label={language === 'tr' ? 'Daha Fazla Göster' : 'Load More'}
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Delete Confirmation Dialog (Rule #5 Standard) */}
            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (confirmDelete?.type === 'user') {
                        executeDeleteUser(confirmDelete.id);
                    } else if (confirmDelete?.type === 'comment') {
                        executeDeleteComment(confirmDelete.id);
                    }
                }}
                title={confirmDelete?.type === 'user'
                    ? (t('admin.deleteUserConfirmTitle') || 'Kullanıcıyı Sil')
                    : (t('admin.deleteCommentConfirmTitle') || 'Yorumu Sil')
                }
                message={confirmDelete?.type === 'user'
                    ? `${confirmDelete.name ? `"${confirmDelete.name}" ` : ''}${t('admin.deleteUserConfirmMessage') || 'kullanıcısını sistemden silmek istediğinize emin misiniz? Bu işlem geri alınamaz!'}`
                    : (t('admin.deleteCommentConfirmMessage') || 'Bu yorumu kalıcı olarak silmek istediğinize emin misiniz?')
                }
                confirmText={t('actions.delete') || 'Sil'}
                cancelText={t('lists.cancel') || 'Vazgeç'}
                variant="danger"
            />

            {/* Edit User Modal (Rule #5 Standard) */}
            <AnimatePresence>
                {editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-[120] p-4"
                        onClick={() => setEditingUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-zinc-800 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-lg">
                                        <FaEdit />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-stone-900 dark:text-white">
                                            {t('admin.editUserTitle') || 'Kullanıcı Profilini Düzenle'}
                                        </h3>
                                        <p className="text-xs text-stone-500 dark:text-zinc-400">
                                            {editingUser.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Scrollable Body (Rule #5) */}
                            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 mb-1.5">
                                        {t('admin.nameLabel') || 'İsim Soyisim'}
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 mb-1.5">
                                        {t('admin.genderLabel') || 'Cinsiyet'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, gender: 'male' })}
                                            className={`py-2.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                                                editForm.gender === 'male'
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                    : 'bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                                            }`}
                                        >
                                            {t('admin.filterMale') || 'Erkek'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, gender: 'female' })}
                                            className={`py-2.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                                                editForm.gender === 'female'
                                                    ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                                                    : 'bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                                            }`}
                                        >
                                            {t('admin.filterFemale') || 'Kadın'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 mb-1.5">
                                        {t('admin.locationLabel') || 'Konum'}
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 mb-1.5">
                                        {t('admin.bioLabel') || 'Biyografi'}
                                    </label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Sticky Footer (Rule #5) */}
                            <div className="sticky bottom-0 px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/90 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-zinc-400 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    {t('lists.cancel') || 'Vazgeç'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveUser}
                                    disabled={savingUser}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                                >
                                    {savingUser ? (
                                        <>
                                            <FaSpinner className="animate-spin text-xs" />
                                            <span>{t('admin.saving') || 'Kaydediliyor...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck className="text-xs" />
                                            <span>{t('admin.saveUser') || 'Değişiklikleri Kaydet'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}