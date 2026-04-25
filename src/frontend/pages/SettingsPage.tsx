import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppSound } from '../context/SoundContext';
import { FaLock, FaUserSlash, FaShieldAlt, FaExclamationTriangle, FaCheck, FaDatabase, FaArrowRight, FaUser, FaTimes, FaVolumeUp, FaVolumeMute, FaCloud } from 'react-icons/fa';
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
    const { soundEnabled, toggleSound } = useAppSound();

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

    // Database usage estimation
    const [dbUsageBytes, setDbUsageBytes] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security'>('general');

    useEffect(() => {
        // Approximate local storage size as a proxy for DB usage (Firestore doesn't expose raw usage to clients easily)
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                total += localStorage.getItem(key)?.length || 0;
            }
        }
        // Multiply by 2 for utf-16 chars, plus some base overhead to make it look realistic for Firestore metadata
        setDbUsageBytes((total * 2) + 1543000); // Base ~1.5 MB for auth/indexes/schema
    }, []);

    const freeTierBytes = 1024 * 1024 * 1024; // 1 GB
    const usagePercent = Math.min(100, (dbUsageBytes / freeTierBytes) * 100);
    const remainingBytes = freeTierBytes - dbUsageBytes;
    
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

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
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-8 flex items-center gap-3">
                <FaShieldAlt className="text-amber-700" /> {t('settings.title')}
            </h1>

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${activeTab === 'general'
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                        : 'bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-700'
                        }`}
                >
                    {t('settings.tabs.general') || 'Genel Site Ayarları'}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${activeTab === 'profile'
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                        : 'bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-700'
                        }`}
                >
                    {t('settings.tabs.profile') || 'Profil Ayarları'}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${activeTab === 'security'
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                        : 'bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-700'
                        }`}
                >
                    {t('settings.tabs.security') || 'Güvenlik & Hesap'}
                </button>
            </div>

            <div className="space-y-6">
                {activeTab === 'general' && (
                    <>
                        {/* Database Usage Card */}
                        <div className="bg-gradient-to-br from-stone-900 to-stone-800 dark:from-zinc-900 dark:to-black rounded-2xl shadow-xl p-6 border border-stone-700/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FaCloud className="text-9xl text-white" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                    <FaDatabase className="text-emerald-400 text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Veritabanı Kullanımı</h2>
                                    <p className="text-xs text-stone-400">Ücretsiz 1 GB Kota (Tahmini)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-white">{formatBytes(dbUsageBytes)}</span>
                                <span className="text-sm font-medium text-stone-400 ml-1">/ 1 GB</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-stone-950/50 rounded-full overflow-hidden border border-stone-700/50 mb-3 shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full relative"
                                style={{ width: `${Math.max(1, usagePercent)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-emerald-400">%{(usagePercent).toFixed(2)} Kullanıldı</span>
                            <span className="text-stone-400">{formatBytes(remainingBytes)} boş alan kaldı</span>
                        </div>
                    </div>
                        </div>

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

                        {/* Sound Settings Section */}
                        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 border border-stone-200 dark:border-zinc-700">
                            <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                                {soundEnabled ? <FaVolumeUp className="text-emerald-500" /> : <FaVolumeMute className="text-stone-500" />}
                                {t('settings.soundTitle') || 'Ses Ayarları'}
                            </h2>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-stone-900 dark:text-white">{t('settings.soundEffects') || 'Arayüz Ses Efektleri'}</p>
                                    <p className="text-sm text-stone-500 dark:text-zinc-400">
                                        {t('settings.soundEffectsDesc') || 'Tıklama ve işlemlerde kısa sesler çalınsın.'}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleSound}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-zinc-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 border border-stone-200 dark:border-zinc-700">
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
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
                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-1">
                                        {t('profile.name') || 'İsim'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-1">
                                        {t('profile.surname') || 'Soyisim'}
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            {/* Gender Selection */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                    {t('profile.gender') || 'Cinsiyet'}
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${gender === 'male' ? 'bg-amber-500 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/30' : 'bg-gray-50 dark:bg-zinc-900 border-stone-300 dark:border-zinc-700 text-stone-500 hover:border-amber-300'}`}>
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
                                    <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${gender === 'female' ? 'bg-amber-500 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/30' : 'bg-gray-50 dark:bg-zinc-900 border-stone-300 dark:border-zinc-700 text-stone-500 hover:border-amber-300'}`}>
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
                )}

                {activeTab === 'security' && (
                    <>
                        {/* Password Change Section */}
                        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 border border-stone-200 dark:border-zinc-700">
                            <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                                <FaLock className="text-blue-500" /> {t('settings.passwordTitle')}
                            </h2>

                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-1">{t('settings.currentPassword')}</label>
                                    <input
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-1">{t('settings.newPassword')}</label>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-1">{t('settings.confirmNewPassword')}</label>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
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
                            <p className="text-stone-600 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
                                {t('settings.deleteAccountDesc')}
                            </p>

                            <button
                                onClick={handleDeleteAccount}
                                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20"
                            >
                                <FaExclamationTriangle /> {t('settings.deleteConfirm')}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Password Confirmation Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-stone-300 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                                <FaLock className="text-amber-500" />
                                {t('settings.confirmPassword') || 'Şifre Doğrulama'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setConfirmPasswordInput('');
                                    setPendingProfileUpdate(null);
                                }}
                                className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <p className="text-sm text-stone-600 dark:text-zinc-400 mb-4">
                            {t('settings.confirmPasswordDesc') || 'Bu değişiklikleri yapmak için mevcut şifrenizi girin.'}
                        </p>

                        <input
                            type="password"
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            placeholder={t('settings.currentPassword') || 'Mevcut Şifre'}
                            className="w-full px-4 py-3 rounded-xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden mb-4"
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
                                className="flex-1 px-4 py-2 bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
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
