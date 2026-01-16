// src/frontend/pages/AdminPage.tsx
// Admin paneli sayfası - Yorum ve Kullanıcı Yönetimi

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaShieldAlt, FaTrash, FaComments, FaSpinner, FaUser, FaClock, FaExclamationTriangle, FaUsers, FaEdit, FaTimes, FaCheck, FaSearch, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { isAdmin } from '../../backend/config/adminConfig';
import { getAllComments, deleteCommentAsAdmin, getAllUsers, updateUserAsAdmin, deleteUserAsAdmin } from '../../backend/services/adminService';
import type { CommentWithActivity, AdminUser } from '../../backend/services/adminService';

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

    // Yorumları yükle (sadece tab aktif olduğunda)
    useEffect(() => {
        const fetchComments = async () => {
            if (!user || !isAdmin(user.uid) || activeTab !== 'comments') return;
            if (comments.length > 0) return; // Zaten yüklenmişse tekrar yükleme

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
                    <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erişim Reddedildi</h1>
                    <p className="text-gray-500 dark:text-gray-400">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FaShieldAlt className="text-red-500" /> Admin Paneli
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Sistem yönetimi ve moderasyon işlemleri
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3">
                        <FaUsers className="text-3xl opacity-80" />
                        <div>
                            <p className="text-sm opacity-80">Kayıtlı Kullanıcı</p>
                            <p className="text-2xl font-bold">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3">
                        <FaComments className="text-3xl opacity-80" />
                        <div>
                            <p className="text-sm opacity-80">Toplam Yorum</p>
                            <p className="text-2xl font-bold">{comments.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'users'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    <FaUsers /> Kullanıcılar
                </button>
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'comments'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    <FaComments /> Yorumlar
                </button>
            </div>

            {/* Content */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Search */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Kullanıcı ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <span className="text-sm text-gray-500">{filteredUsers.length} kullanıcı</span>
                        </div>
                    </div>

                    {usersLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <FaSpinner className="animate-spin text-3xl text-gray-400" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            Kullanıcı bulunamadı.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden">
                                                {u.photoURL ? (
                                                    <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    u.displayName?.charAt(0)?.toUpperCase() || <FaUser size={16} />
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/user/${u.id}`}
                                                        className="font-semibold text-gray-900 dark:text-white hover:text-blue-500 transition truncate"
                                                    >
                                                        {u.displayName || 'İsimsiz'}
                                                    </Link>
                                                    {u.gender && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.gender === 'male' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                                                            {u.gender === 'male' ? 'Erkek' : 'Kadın'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                    <span className="flex items-center gap-1 truncate">
                                                        <FaEnvelope size={10} /> {u.email}
                                                    </span>
                                                    {u.location && (
                                                        <span className="flex items-center gap-1">
                                                            <FaMapMarkerAlt size={10} /> {u.location}
                                                        </span>
                                                    )}
                                                </div>
                                                {u.createdAt && (
                                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                        <FaClock size={10} /> Kayıt: {formatDate(u.createdAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleEditUser(u)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                                title="Düzenle"
                                            >
                                                <FaEdit />
                                            </button>
                                            {u.id !== user.uid && (
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.displayName)}
                                                    disabled={deletingUserId === u.id}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                                                    title="Sil"
                                                >
                                                    {deletingUserId === u.id ? (
                                                        <FaSpinner className="animate-spin" />
                                                    ) : (
                                                        <FaTrash />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'comments' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FaComments className="text-indigo-500" /> Son Yorumlar
                        </h2>
                    </div>

                    {commentsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <FaSpinner className="animate-spin text-3xl text-gray-400" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            Henüz yorum bulunmuyor.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {comments.map(comment => (
                                <div
                                    key={comment.id}
                                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                                    {comment.userName?.charAt(0)?.toUpperCase() || <FaUser size={12} />}
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {comment.userName || 'Anonim'}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <FaClock size={10} />
                                                    {formatDate(comment.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm pl-10">
                                                {comment.text}
                                            </p>
                                            <p className="text-xs text-gray-400 pl-10 mt-1">
                                                Activity ID: {comment.activityId?.substring(0, 8)}...
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            disabled={deletingCommentId === comment.id}
                                            className="shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                                            title="Yorumu Sil"
                                        >
                                            {deletingCommentId === comment.id ? (
                                                <FaSpinner className="animate-spin" />
                                            ) : (
                                                <FaTrash />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaEdit className="text-blue-500" /> Kullanıcıyı Düzenle
                            </h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    İsim
                                </label>
                                <input
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Cinsiyet
                                </label>
                                <div className="flex gap-3">
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${editForm.gender === 'male' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                                        <input
                                            type="radio"
                                            checked={editForm.gender === 'male'}
                                            onChange={() => setEditForm({ ...editForm, gender: 'male' })}
                                            className="hidden"
                                        />
                                        Erkek
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${editForm.gender === 'female' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                                        <input
                                            type="radio"
                                            checked={editForm.gender === 'female'}
                                            onChange={() => setEditForm({ ...editForm, gender: 'female' })}
                                            className="hidden"
                                        />
                                        Kadın
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Konum
                                </label>
                                <input
                                    type="text"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Şehir, Ülke"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Biyografi
                                </label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                    placeholder="Kullanıcı hakkında..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={savingUser}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {savingUser ? (
                                    <FaSpinner className="animate-spin" />
                                ) : (
                                    <>
                                        <FaCheck /> Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
