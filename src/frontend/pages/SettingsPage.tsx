import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaLock, FaUserSlash, FaShieldAlt, FaExclamationTriangle, FaCheck, FaDatabase, FaArrowRight } from 'react-icons/fa';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function SettingsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const reauthenticate = async (password: string) => {
        if (!user || !user.email) throw new Error('User not found');
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t('auth.passwordMismatch'));
            return;
        }
        if (newPassword.length < 6) {
            toast.error(t('auth.weakPassword'));
            return;
        }

        setLoading(true);
        try {
            await reauthenticate(currentPassword);
            if (user) {
                await updatePassword(user, newPassword);
                toast.success(t('settings.passwordUpdated'));
                setNewPassword('');
                setConfirmPassword('');
                setCurrentPassword('');
            }
        } catch (error: any) {
            console.error('Password update error:', error);
            if (error.code === 'auth/wrong-password') {
                toast.error(t('admin.adminWrongPassword'));
            } else if (error.code === 'auth/requires-recent-login') {
                toast.error(t('settings.reauthRequired'));
            } else {
                toast.error('Hata: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm(t('settings.deleteWarning'))) return;

        const password = prompt(t('settings.reauthRequired') + '\n' + t('settings.currentPassword'));
        if (!password) return;

        setLoading(true);
        try {
            await reauthenticate(password);
            if (user) {
                await deleteUser(user);
                toast.success('Hesabınız silindi.');
                navigate('/');
            }
        } catch (error: any) {
            console.error('Delete user error:', error);
            toast.error('Silme başarısız: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                <FaShieldAlt className="text-rose-500" /> {t('settings.title')}
            </h1>

            <div className="space-y-6">
                {/* Migration Link */}
                <Link
                    to="/migration"
                    className="block bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 border border-indigo-400/30 hover:scale-[1.02] transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <FaDatabase className="text-2xl text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Veri Migrasyon</h2>
                                <p className="text-sm text-white/70">
                                    Eksik bilgileri API'lerden çekerek tamamlayın
                                </p>
                            </div>
                        </div>
                        <FaArrowRight className="text-white/70 text-xl" />
                    </div>
                </Link>

                {/* Password Change Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <FaLock className="text-blue-500" /> {t('settings.passwordTitle')}
                    </h2>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.currentPassword')}</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.newPassword')}</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.confirmNewPassword')}</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                            >
                                {loading ? '...' : <><FaCheck /> {t('settings.updatePassword')}</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Delete Account Section */}
                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl shadow-lg p-8 border border-red-100 dark:border-red-900/30">
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                        <FaUserSlash /> {t('settings.deleteAccount')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                        {t('settings.deleteAccountDesc')}
                    </p>

                    <button
                        onClick={handleDeleteAccount}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20"
                    >
                        <FaExclamationTriangle /> {t('settings.deleteConfirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
