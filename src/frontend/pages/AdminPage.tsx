// src/frontend/pages/AdminPage.tsx
// Admin paneli sayfası - Yorum, Kullanıcı ve Giriş Hareketleri Yönetimi

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaShieldAlt, FaTrash, FaComments, FaSpinner, FaUser, FaClock,
    FaExclamationTriangle, FaUsers, FaEdit, FaTimes, FaCheck, FaSearch,
    FaEnvelope, FaMapMarkerAlt, FaCrown, FaArrowRight, FaUserShield,
    FaCalendar, FaVenusMars, FaQuoteRight, FaIdBadge, FaSignInAlt,
    FaMobileAlt, FaDesktop, FaTabletAlt, FaGlobe, FaLaptop
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { isAdmin } from '../../backend/config/adminConfig';
import { getAllComments, deleteCommentAsAdmin, getAllUsers, updateUserAsAdmin, deleteUserAsAdmin } from '../../backend/services/adminService';
import type { CommentWithActivity, AdminUser } from '../../backend/services/adminService';
import { getLoginLogs } from '../../backend/services/loginLogService';
import type { LoginLog } from '../../backend/services/loginLogService';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'users' | 'comments' | 'logins';

export default function AdminPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('users');

    // Comments state
    const [comments, setComments] = useState<CommentWithActivity[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

    // Users state
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({ displayName: '', gender: '' as 'male' | 'female' | '', bio: '', location: '' });
    const [savingUser, setSavingUser] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Login logs state
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
    const [loginLogsLoading, setLoginLogsLoading] = useState(false);

    // Admin kontrolü
    useEffect(() => {
        if (user && !isAdmin(user.uid)) {
            toast.error('Bu sayfaya erişim yetkiniz yok!');
            navigate('/');
        }
    }, [user, navigate]);

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
    }, [user, activeTab, comments.length, loginLogs.length]);

    const handleDeleteComment = async (commentId: string) => {
        if (!user || !window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

        setDeletingCommentId(commentId);
        try {
            const success = await deleteCommentAsAdmin(user.uid, commentId);
            if (success) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                toast.success('Yorum silindi');
            } else {
                toast.error('Yorum silinemedi');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setDeletingCommentId(null);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!user) return;
        if (!window.confirm(`"${userName}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return;

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
                toast.success('Kullanıcı güncellendi');
                setEditingUser(null);
            } else {
                toast.error('Güncellenemedi');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setSavingUser(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Bilinmiyor';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('tr-TR', {
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

    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user || !isAdmin(user.uid)) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-xl max-w-md w-full">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
                        <FaExclamationTriangle className="text-4xl text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-black text-stone-900 dark:text-white mb-2">Erişim Reddedildi</h1>
                    <p className="text-stone-500 dark:text-zinc-400 text-sm mb-6">Bu sayfaya yalnızca sistem yöneticisi erişebilir.</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-stone-950 font-bold rounded-2xl shadow-md hover:bg-amber-300 transition-all text-sm"
                    >
                        <FaArrowRight className="rotate-180" />
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-black text-white border-b border-stone-800/80 mb-8 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 bg-amber-400 pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 border border-amber-400/30 text-amber-300 mb-2">
                            <FaCrown className="text-xs" />
                            <span>Yönetici Paneli</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            Sistem Yönetimi & Güvenlik
                        </h1>
                        <p className="text-stone-400 text-xs sm:text-sm mt-1 flex items-center gap-2">
                            <FaUserShield className="text-amber-400" />
                            Kullanıcılar, yorumlar ve son giriş aktiviteleri
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl transition-all text-xs font-bold border border-white/15 shrink-0"
                    >
                        <FaArrowRight className="rotate-180 text-xs" />
                        <span>Siteye Dön</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-1 sm:px-2">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-stone-200/80 dark:border-zinc-800/80 flex items-center gap-4"
                    >
                        <div className="p-3 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <FaUsers className="text-2xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">{users.length}</div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-bold">Kayıtlı Kullanıcı</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-stone-200/80 dark:border-zinc-800/80 flex items-center gap-4"
                    >
                        <div className="p-3 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-2xl">
                            <FaSignInAlt className="text-2xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">
                                {users.filter(u => u.lastLoginAt).length || users.length}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-bold">Aktif / Giriş Yapan</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16 }}
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-stone-200/80 dark:border-zinc-800/80 flex items-center gap-4"
                    >
                        <div className="p-3 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                            <FaComments className="text-2xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">{comments.length}</div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-bold">Toplam Yorum</div>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'users'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-800 hover:border-blue-400'
                            }`}
                    >
                        <FaUsers />
                        Kullanıcılar
                        <span className="text-xs opacity-75 ml-1">({filteredUsers.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('logins')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'logins'
                            ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/25'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-800 hover:border-amber-400'
                            }`}
                    >
                        <FaSignInAlt />
                        Son Girişler (Güvenlik)
                        {loginLogs.length > 0 && <span className="text-xs opacity-75 ml-1">({loginLogs.length})</span>}
                    </button>

                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${activeTab === 'comments'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-800 hover:border-indigo-400'
                            }`}
                    >
                        <FaComments />
                        Yorumlar
                        <span className="text-xs opacity-75 ml-1">({comments.length})</span>
                    </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            {/* Search */}
                            <div className="px-5 sm:px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
                                <div className="relative">
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                                    <input
                                        type="text"
                                        placeholder="İsim veya email ile ara..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            {usersLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <FaSpinner className="animate-spin text-3xl text-blue-500" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-16">
                                    <FaUsers className="text-5xl text-stone-300 dark:text-zinc-700 mx-auto mb-4" />
                                    <p className="text-stone-500 dark:text-zinc-400 font-medium">Kullanıcı bulunamadı.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                    {filteredUsers.map((u, idx) => (
                                        <motion.div
                                            key={u.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="px-5 sm:px-6 py-4 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition group"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden shadow-md">
                                                        {u.photoURL ? (
                                                            <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.displayName?.charAt(0)?.toUpperCase() || <FaUser size={16} />
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                            <span className="font-extrabold text-stone-900 dark:text-white truncate">
                                                                {u.displayName || 'İsimsiz Kullanıcı'}
                                                            </span>
                                                            {u.id === user?.uid && (
                                                                <span className="text-[9px] px-2 py-0.5 bg-amber-400 text-stone-950 rounded-full font-black uppercase tracking-wider">
                                                                    SEN (YÖNETİCİ)
                                                                </span>
                                                            )}
                                                            {u.gender && (
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${u.gender === 'male'
                                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                                    : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                                                                    }`}>
                                                                    <FaVenusMars size={9} />
                                                                    {u.gender === 'male' ? 'Erkek' : 'Kadın'}
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

                                                        {/* Last login & device metadata */}
                                                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-stone-400 dark:text-zinc-500">
                                                            {u.lastLoginAt ? (
                                                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                                    <FaSignInAlt size={9} />
                                                                    Son Giriş: {formatDate(u.lastLoginAt)}
                                                                </span>
                                                            ) : (
                                                                u.createdAt && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <FaCalendar size={9} />
                                                                        Kayıt: {formatDate(u.createdAt)}
                                                                    </span>
                                                                )
                                                            )}
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
                                                <div className="flex items-center gap-2 self-end sm:self-center">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition cursor-pointer"
                                                        title="Düzenle"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    {u.id !== user?.uid && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id, u.displayName || 'İsimsiz')}
                                                            disabled={deletingUserId === u.id}
                                                            className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition disabled:opacity-50 cursor-pointer"
                                                            title="Sil"
                                                        >
                                                            {deletingUserId === u.id ? (
                                                                <FaSpinner className="animate-spin" size={14} />
                                                            ) : (
                                                                <FaTrash size={14} />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* LOGIN LOGS TAB (Giriş Hareketleri) */}
                    {activeTab === 'logins' && (
                        <motion.div
                            key="logins"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            <div className="px-5 sm:px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                                    <FaSignInAlt className="text-amber-500" />
                                    Son Giriş Yapanlar & Cihaz Aktiviteleri
                                </h2>
                                <span className="text-xs font-bold text-stone-400">
                                    En son {loginLogs.length} hareket
                                </span>
                            </div>

                            {loginLogsLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <FaSpinner className="animate-spin text-3xl text-amber-500" />
                                </div>
                            ) : loginLogs.length === 0 ? (
                                <div className="text-center py-16 space-y-2">
                                    <FaSignInAlt className="text-5xl text-stone-300 dark:text-zinc-700 mx-auto mb-2" />
                                    <p className="text-stone-600 dark:text-zinc-400 font-bold">Henüz kaydedilmiş giriş hareketi yok.</p>
                                    <p className="text-xs text-stone-400">Kullanıcılar uygulamaya giriş yaptıkça burada listelenecektir.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                    {loginLogs.map((log, idx) => (
                                        <motion.div
                                            key={log.id || idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="px-5 sm:px-6 py-4 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-base font-black shrink-0 shadow-md">
                                                        {log.photoURL ? (
                                                            <img src={log.photoURL} alt="" className="w-full h-full object-cover rounded-xl" />
                                                        ) : (
                                                            log.displayName?.charAt(0)?.toUpperCase() || <FaUser size={14} />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-sm text-stone-900 dark:text-white truncate">
                                                                {log.displayName || 'Kullanıcı'}
                                                            </span>
                                                            {log.userId === user?.uid && (
                                                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-400/20 text-amber-700 dark:text-amber-300 rounded font-black">
                                                                    SEN
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                                                            {log.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Device, OS & Time Badges */}
                                                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-xs font-bold border border-stone-200/60 dark:border-zinc-700/60">
                                                        {getDeviceIcon(log.deviceType)}
                                                        <span>{log.os}</span>
                                                        <span className="opacity-40">•</span>
                                                        <span>{log.browser}</span>
                                                    </div>

                                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                                                        <FaClock size={10} />
                                                        <span>{formatDate(log.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* COMMENTS TAB */}
                    {activeTab === 'comments' && (
                        <motion.div
                            key="comments"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            <div className="px-5 sm:px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
                                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                                    <FaComments className="text-indigo-500" />
                                    Son Yorumlar
                                </h2>
                            </div>

                            {commentsLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <FaSpinner className="animate-spin text-3xl text-indigo-500" />
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-16">
                                    <FaComments className="text-5xl text-stone-300 dark:text-zinc-700 mx-auto mb-4" />
                                    <p className="text-stone-500 dark:text-zinc-400 font-medium">Henüz yorum bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                    {comments.map((comment, idx) => (
                                        <motion.div
                                            key={comment.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="px-5 sm:px-6 py-4 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                                            {comment.userName?.charAt(0)?.toUpperCase() || <FaUser size={12} />}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-stone-900 dark:text-white text-sm">
                                                                {comment.userName || 'Anonim'}
                                                            </span>
                                                            <div className="text-[11px] text-stone-400 flex items-center gap-1">
                                                                <FaClock size={9} />
                                                                {formatDate(comment.timestamp)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="pl-11">
                                                        <p className="text-stone-700 dark:text-zinc-300 text-sm bg-stone-50 dark:bg-zinc-800 rounded-xl p-3">
                                                            {comment.text}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    disabled={deletingCommentId === comment.id}
                                                    className="shrink-0 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition disabled:opacity-50 cursor-pointer"
                                                    title="Yorumu Sil"
                                                >
                                                    {deletingCommentId === comment.id ? (
                                                        <FaSpinner className="animate-spin" size={14} />
                                                    ) : (
                                                        <FaTrash size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Edit User Modal */}
            <AnimatePresence>
                {editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setEditingUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-stone-200 dark:border-zinc-800"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                                        <FaEdit className="text-blue-500" size={14} />
                                    </div>
                                    Kullanıcı Düzenle
                                </h3>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300 mb-1.5">
                                        İsim
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium"
                                        placeholder="Kullanıcı adı"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300 mb-1.5">
                                        Cinsiyet
                                    </label>
                                    <div className="flex gap-3">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all font-bold text-xs ${editForm.gender === 'male'
                                            ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                                            : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 hover:border-blue-300'
                                            }`}>
                                            <input
                                                type="radio"
                                                checked={editForm.gender === 'male'}
                                                onChange={() => setEditForm({ ...editForm, gender: 'male' })}
                                                className="hidden"
                                            />
                                            👨 Erkek
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all font-bold text-xs ${editForm.gender === 'female'
                                            ? 'bg-pink-500 border-pink-500 text-white shadow-md'
                                            : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 hover:border-pink-300'
                                            }`}>
                                            <input
                                                type="radio"
                                                checked={editForm.gender === 'female'}
                                                onChange={() => setEditForm({ ...editForm, gender: 'female' })}
                                                className="hidden"
                                            />
                                            👩 Kadın
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300 mb-1.5">
                                        Konum
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium"
                                        placeholder="Şehir, Ülke"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300 mb-1.5">
                                        Biyografi
                                    </label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm font-medium"
                                        placeholder="Kullanıcı hakkında kısa bilgi..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-xs cursor-pointer"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSaveUser}
                                    disabled={savingUser}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 text-xs cursor-pointer"
                                >
                                    {savingUser ? (
                                        <FaSpinner className="animate-spin" />
                                    ) : (
                                        <>
                                            <FaCheck />
                                            Kaydet
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