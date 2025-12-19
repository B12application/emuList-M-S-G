import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaLock, FaUserSlash, FaShieldAlt, FaExclamationTriangle, FaCheck, FaSync, FaTags } from 'react-icons/fa';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
// import { auth } from '../../backend/config/firebaseConfig';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { countItemsWithoutGenre, migrateGenresForUser } from '../../backend/services/genreMigrationService';

export default function SettingsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Genre Migration States
    const [itemsWithoutGenre, setItemsWithoutGenre] = useState<number | null>(null);
    const [migrationLoading, setMigrationLoading] = useState(false);
    const [migrationProgress, setMigrationProgress] = useState({
        total: 0,
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        currentItem: '',
    });

    // Load count on mount
    useEffect(() => {
        if (user) {
            countItemsWithoutGenre(user.uid).then(setItemsWithoutGenre);
        }
    }, [user]);

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
            // Re-auth is often required for sensitive operations
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
                toast.error(t('admin.adminWrongPassword')); // Reuse or add new string
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

        // For delete, usually need re-auth too. We can prompt simple prompt here or use the same form logic.
        // For simplicity in this iteration, assuming recent login or handling error.
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

    const handleMigrateGenres = async () => {
        if (!user) return;

        const confirmed = window.confirm(
            `${itemsWithoutGenre} kayıt için tür bilgisi eklenecek.\n\nBu işlem API çağrısı yapacağı için biraz zaman alabilir.\n\nDevam etmek istiyor musunuz?`
        );

        if (!confirmed) return;

        setMigrationLoading(true);
        setMigrationProgress({ total: 0, processed: 0, updated: 0, skipped: 0, failed: 0, currentItem: '' });

        try {
            const result = await migrateGenresForUser(user.uid, (progress) => {
                setMigrationProgress(progress);
            }, false);

            toast.success(`✅ Tamamlandı! ${result.updated} kayıt güncellendi, ${result.skipped} atlandı.`);
            setItemsWithoutGenre(0);
        } catch (error: any) {
            console.error('Migration error:', error);
            toast.error('Migration hatası: ' + error.message);
        } finally {
            setMigrationLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                <FaShieldAlt className="text-rose-500" /> {t('settings.title')}
            </h1>

            <div className="space-y-8">
                {/* Genre Migration Section */}
                {itemsWithoutGenre !== null && itemsWithoutGenre > 0 && (
                    <div className="bg-sky-50 dark:bg-sky-900/10 rounded-2xl shadow-lg p-8 border border-sky-100 dark:border-sky-900/30">
                        <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-4 flex items-center gap-2">
                            <FaTags /> Tür Bilgisi Ekle
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                            Mevcut {itemsWithoutGenre} kaydınızda tür (genre) bilgisi eksik.
                            Bu işlem, her kayıt için API'den tür bilgisini çekip güncelleyecek.
                        </p>

                        {migrationLoading ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <FaSync className="animate-spin" />
                                    <span>İşleniyor: {migrationProgress.currentItem || '...'}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${migrationProgress.total > 0 ? (migrationProgress.processed / migrationProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{migrationProgress.processed} / {migrationProgress.total}</span>
                                    <span>✓ {migrationProgress.updated} güncellendi, ⚠ {migrationProgress.skipped} atlandı</span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleMigrateGenres}
                                className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-600/20"
                            >
                                <FaSync /> Tür Bilgilerini Ekle ({itemsWithoutGenre} kayıt)
                            </button>
                        )}
                    </div>
                )}

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

