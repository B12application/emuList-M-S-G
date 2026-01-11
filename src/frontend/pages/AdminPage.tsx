// src/frontend/pages/AdminPage.tsx
// Admin paneli sayfası

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaTrash, FaComments, FaSpinner, FaUser, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { isAdmin } from '../../backend/config/adminConfig';
import { getAllComments, deleteCommentAsAdmin } from '../../backend/services/adminService';
import type { CommentWithActivity } from '../../backend/services/adminService';

export default function AdminPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [comments, setComments] = useState<CommentWithActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Admin kontrolü
    useEffect(() => {
        if (user && !isAdmin(user.uid)) {
            toast.error('Bu sayfaya erişim yetkiniz yok!');
            navigate('/');
        }
    }, [user, navigate]);

    // Yorumları yükle
    useEffect(() => {
        const fetchComments = async () => {
            if (!user || !isAdmin(user.uid)) return;

            setLoading(true);
            try {
                const data = await getAllComments(user.uid);
                setComments(data);
            } catch (error) {
                console.error('Yorumlar yüklenemedi:', error);
                toast.error('Yorumlar yüklenirken hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [user]);

    const handleDeleteComment = async (commentId: string) => {
        if (!user || !window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

        setDeletingId(commentId);
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
            setDeletingId(null);
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
        <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaComments className="text-indigo-500" /> Son Yorumlar
                    </h2>
                </div>

                {loading ? (
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
                                        disabled={deletingId === comment.id}
                                        className="shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                                        title="Yorumu Sil"
                                    >
                                        {deletingId === comment.id ? (
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
        </div>
    );
}
