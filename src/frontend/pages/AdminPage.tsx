// src/frontend/pages/AdminPage.tsx
// Admin paneli sayfası - Yorum ve Kullanıcı Yönetimi

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaShieldAlt, FaTrash, FaComments, FaSpinner, FaUser, FaClock,
    FaExclamationTriangle, FaUsers, FaEdit, FaTimes, FaCheck, FaSearch,
    FaEnvelope, FaMapMarkerAlt, FaCrown, FaArrowRight, FaUserShield,
    FaCalendar, FaVenusMars, FaQuoteRight, FaIdBadge
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { isAdmin } from '../../backend/config/adminConfig';
import { getAllComments, deleteCommentAsAdmin, getAllUsers, updateUserAsAdmin, deleteUserAsAdmin } from '../../backend/services/adminService';
import type { CommentWithActivity, AdminUser } from '../../backend/services/adminService';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'users' | 'comments';

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

    // Yorumları yükle
    useEffect(() => {
        const fetchComments = async () => {
            if (!user || !isAdmin(user.uid) || activeTab !== 'comments') return;
            if (comments.length > 0) return;

            setCommentsLoading(true);
            try {
                const data = await getAllComments(user.uid);
                setComments(data);
            } catch (error) {
                console.error('Yorumlar yüklenemedi:', error);
                toast.error('Yorumlar yüklenirken hata oluştu');
            } finally {
                setCommentsLoading(false);
            }
        };

        fetchComments();
    }, [user, activeTab]);

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
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user || !isAdmin(user.uid)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaExclamationTriangle className="text-5xl text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Erişim Reddedildi</h1>
                    <p className="text-stone-500 dark:text-zinc-400 mb-6">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold rounded-xl hover:opacity-90 transition-all"
                    >
                        <FaArrowRight className="rotate-180" />
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <FaCrown className="text-2xl text-stone" />
                                </div>
                                Admin Paneli
                            </h1>
                            <p className="text-stone-500 dark:text-zinc-400 mt-2 flex items-center gap-2">
                                <FaUserShield className="text-yellow-300" />
                                Sistem yönetimi ve moderasyon işlemleri
                            </p>
                        </div>
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all text-sm font-medium border border-white/20"
                        >
                            <FaArrowRight className="rotate-180" />
                            <span className="hidden sm:inline">Siteye Dön</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-lg border border-stone-200 dark:border-zinc-800 flex items-center gap-4"
                    >
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                            <FaUsers className="text-2xl text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">{users.length}</div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">Kayıtlı Kullanıcı</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-lg border border-stone-200 dark:border-zinc-800 flex items-center gap-4"
                    >
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
                            <FaComments className="text-2xl text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">{comments.length}</div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">Toplam Yorum</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-lg border border-stone-200 dark:border-zinc-800 flex items-center gap-4"
                    >
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
                            <FaIdBadge className="text-2xl text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-stone-900 dark:text-white">
                                {users.filter(u => u.gender).length}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">Profili Tamamlanmış</div>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'users'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                    >
                        <FaUsers />
                        Kullanıcılar
                        <span className="text-xs opacity-70 ml-1">({filteredUsers.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'comments'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                            : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                            }`}
                    >
                        <FaComments />
                        Yorumlar
                        <span className="text-xs opacity-70 ml-1">({comments.length})</span>
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 overflow-hidden"
                        >
                            {/* Search */}
                            <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                        <input
                                            type="text"
                                            placeholder="İsim veya email ile ara..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {usersLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <FaSpinner className="animate-spin text-3xl text-blue-500" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-16">
                                    <FaUsers className="text-5xl text-stone-300 dark:text-zinc-700 mx-auto mb-4" />
                                    <p className="text-stone-500 dark:text-zinc-400">Kullanıcı bulunamadı.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                    {filteredUsers.map((u, idx) => (
                                        <motion.div
                                            key={u.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="px-6 py-4 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition group"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden shadow-lg">
                                                        {u.photoURL ? (
                                                            <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.displayName?.charAt(0)?.toUpperCase() || <FaUser size={16} />
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-stone-900 dark:text-white truncate">
                                                                {u.displayName || 'İsimsiz Kullanıcı'}
                                                            </span>
                                                            {u.id === user?.uid && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-bold">
                                                                    SEN
                                                                </span>
                                                            )}
                                                            {u.gender && (
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${u.gender === 'male'
                                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                    : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                                                                    }`}>
                                                                    <FaVenusMars size={8} />
                                                                    {u.gender === 'male' ? 'Erkek' : 'Kadın'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-zinc-400">
                                                            <span className="flex items-center gap-1 truncate">
                                                                <FaEnvelope size={10} />
                                                                {u.email}
                                                            </span>
                                                            {u.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <FaMapMarkerAlt size={10} />
                                                                    {u.location}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3 mt-1">
                                                            {u.createdAt && (
                                                                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                                                                    <FaCalendar size={10} />
                                                                    {formatDate(u.createdAt)}
                                                                </span>
                                                            )}
                                                            {u.bio && (
                                                                <span className="text-[11px] text-stone-400 flex items-center gap-1 truncate">
                                                                    <FaQuoteRight size={10} />
                                                                    {u.bio.substring(0, 50)}...
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                                        title="Düzenle"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    {u.id !== user?.uid && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id, u.displayName || 'İsimsiz')}
                                                            disabled={deletingUserId === u.id}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
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

                    {activeTab === 'comments' && (
                        <motion.div
                            key="comments"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
                                <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
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
                                    <p className="text-stone-500 dark:text-zinc-400">Henüz yorum bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                    {comments.map((comment, idx) => (
                                        <motion.div
                                            key={comment.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="px-6 py-4 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
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
                                                        <p className="text-[10px] text-stone-400 mt-1.5 font-mono">
                                                            ID: {comment.activityId?.substring(0, 12)}...
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    disabled={deletingCommentId === comment.id}
                                                    className="shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50 opacity-0 group-hover:opacity-100"
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
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-stone-200 dark:border-zinc-800"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <FaEdit className="text-blue-500" size={14} />
                                    </div>
                                    Kullanıcı Düzenle
                                </h3>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                        İsim
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Kullanıcı adı"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                        Cinsiyet
                                    </label>
                                    <div className="flex gap-3">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${editForm.gender === 'male'
                                            ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/25'
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
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${editForm.gender === 'female'
                                            ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/25'
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
                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                        Konum
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Şehir, Ülke"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                        Biyografi
                                    </label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                        placeholder="Kullanıcı hakkında kısa bilgi..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSaveUser}
                                    disabled={savingUser}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
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