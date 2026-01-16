import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaLock, FaUserSlash, FaShieldAlt, FaExclamationTriangle, FaCheck, FaDatabase, FaArrowRight, FaUser, FaTimes } from 'react-icons/fa';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export default function SettingsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Profile info states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);

    // Password confirmation modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [pendingProfileUpdate, setPendingProfileUpdate] = useState<{
        firstName: string;
        lastName: string;
        gender: 'male' | 'female' | '';
    } | null>(null);

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Load user profile data
    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return;
            setProfileLoading(true);
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    // Parse displayName into first and last name
                    const displayName = data.displayName || user.displayName || '';
                    const nameParts = displayName.split(' ');
                    setFirstName(nameParts[0] || '');
                    setLastName(nameParts.slice(1).join(' ') || '');
                    setGender(data.gender || '');
                } else {
                    // Fallback to auth displayName
                    const displayName = user.displayName || '';
                    const nameParts = displayName.split(' ');
                    setFirstName(nameParts[0] || '');
                    setLastName(nameParts.slice(1).join(' ') || '');
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setProfileLoading(false);
            }
        };
        loadProfile();
    }, [user]);

    const reauthenticate = async (password: string) => {
        if (!user || !user.email) throw new Error('User not found');
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
    };

    // Handle profile info save (triggers password modal)
    const handleSaveProfileInfo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim()) {
            toast.error(t('auth.nameRequired') || 'İsim alanı zorunludur.');
            return;
        }

        // Store the pending update and show password modal
        setPendingProfileUpdate({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            gender
        });
        setShowPasswordModal(true);
    };

    // Confirm profile update with password
    const confirmProfileUpdate = async () => {
        if (!confirmPasswordInput || !pendingProfileUpdate) return;

        setProfileSaving(true);
        try {
            // First verify password
            await reauthenticate(confirmPasswordInput);

            // Update Firebase Auth profile
            const newDisplayName = `${pendingProfileUpdate.firstName} ${pendingProfileUpdate.lastName}`.trim();
            if (user) {
                await updateProfile(user, {
                    displayName: newDisplayName
                });

                // Update Firestore document
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, {
                    displayName: newDisplayName,
                    gender: pendingProfileUpdate.gender
                });

                // Invalidate user profile cache
                queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });

                toast.success(t('settings.profileUpdated') || 'Profil bilgileri güncellendi.');
                setShowPasswordModal(false);
                setConfirmPasswordInput('');
                setPendingProfileUpdate(null);
            }
        } catch (error: any) {
            console.error('Profile update error:', error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error(t('home.adminWrongPassword') || 'Hatalı şifre!');
            } else {
                toast.error('Hata: ' + error.message);
            }
        } finally {
            setProfileSaving(false);
        }
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
                toast.error(t('home.adminWrongPassword') || 'Hatalı şifre!');
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

                {/* Profile Info Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <FaUser className="text-amber-500" /> {t('settings.profileInfo') || 'Profil Bilgileri'}
                    </h2>

                    {profileLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveProfileInfo} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('profile.name') || 'İsim'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('profile.surname') || 'Soyisim'}
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            {/* Gender Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('profile.gender') || 'Cinsiyet'}
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${gender === 'male' ? 'bg-amber-500 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/30' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-300'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={gender === 'male'}
                                            onChange={() => setGender('male')}
                                            className="hidden"
                                        />
                                        {gender === 'male' && <FaCheck className="text-sm" />}
                                        <span className="font-medium text-sm">{t('profile.male') || 'Erkek'}</span>
                                    </label>
                                    <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${gender === 'female' ? 'bg-amber-500 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/30' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-300'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={gender === 'female'}
                                            onChange={() => setGender('female')}
                                            className="hidden"
                                        />
                                        {gender === 'female' && <FaCheck className="text-sm" />}
                                        <span className="font-medium text-sm">{t('profile.female') || 'Kadın'}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20"
                                >
                                    <FaCheck /> {t('settings.saveProfileInfo') || 'Bilgileri Kaydet'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

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

            {/* Password Confirmation Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaLock className="text-amber-500" />
                                {t('settings.confirmPassword') || 'Şifre Doğrulama'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setConfirmPasswordInput('');
                                    setPendingProfileUpdate(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {t('settings.confirmPasswordDesc') || 'Bu değişiklikleri yapmak için mevcut şifrenizi girin.'}
                        </p>

                        <input
                            type="password"
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            placeholder={t('settings.currentPassword') || 'Mevcut Şifre'}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden mb-4"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    confirmProfileUpdate();
                                }
                            }}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setConfirmPasswordInput('');
                                    setPendingProfileUpdate(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                            >
                                {t('actions.cancel') || 'İptal'}
                            </button>
                            <button
                                onClick={confirmProfileUpdate}
                                disabled={profileSaving || !confirmPasswordInput}
                                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {profileSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <FaCheck /> {t('common.confirm') || 'Onayla'}
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
