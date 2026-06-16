import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppSound } from '../context/SoundContext';
import { useTheme } from '../context/ThemeContext';
import {
    FaLock, FaUserShield, FaShieldAlt, FaExclamationTriangle, FaCheck, FaDatabase,
    FaArrowRight, FaUser, FaTimes, FaVolumeUp, FaVolumeMute, FaCloud, FaMoon,
    FaSun, FaPalette, FaBell, FaLanguage, FaInfoCircle, FaTrash, FaKey,
    FaUserEdit, FaEnvelope, FaCalendar, FaFingerprint, FaHistory, FaDownload,
    FaEye, FaEyeSlash, FaSignOutAlt, FaCog, FaHome
} from 'react-icons/fa';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../backend/config/firebaseConfig';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { soundEnabled, toggleSound } = useAppSound();
    const { isDark, toggleTheme, lightBrightness, setLightBrightness, lightSoftness, setLightSoftness, resetLightThemeTuning } = useTheme();

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
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Delete account modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteStep, setDeleteStep] = useState(0); // 0: warning, 1: password, 2: confirmation

    // Database usage estimation
    const [dbUsageBytes, setDbUsageBytes] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security' | 'privacy'>('general');

    // Account info
    const [accountCreated, setAccountCreated] = useState<string>('');
    const [lastLogin, setLastLogin] = useState<string>('');

    useEffect(() => {
        // Account metadata
        if (user?.metadata) {
            const creationTime = user.metadata.creationTime;
            const lastSignInTime = user.metadata.lastSignInTime;

            if (creationTime) {
                setAccountCreated(new Date(creationTime).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }));
            }

            if (lastSignInTime) {
                setLastLogin(new Date(lastSignInTime).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }));
            }
        }

        // Database usage calculation
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                total += localStorage.getItem(key)?.length || 0;
            }
        }
        setDbUsageBytes((total * 2) + 1543000);
    }, [user]);

    const freeTierBytes = 1024 * 1024 * 1024;
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
                    const displayName = data.displayName || user.displayName || '';
                    const nameParts = displayName.split(' ');
                    setFirstName(nameParts[0] || '');
                    setLastName(nameParts.slice(1).join(' ') || '');
                    setGender(data.gender || '');
                } else {
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

    // Handle profile info save
    const handleSaveProfileInfo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim()) {
            toast.error(t('auth.nameRequired') || 'İsim alanı zorunludur.');
            return;
        }

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
            await reauthenticate(confirmPasswordInput);

            const newDisplayName = `${pendingProfileUpdate.firstName} ${pendingProfileUpdate.lastName}`.trim();
            if (user) {
                await updateProfile(user, {
                    displayName: newDisplayName
                });

                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, {
                    displayName: newDisplayName,
                    gender: pendingProfileUpdate.gender
                });

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
        if (!deletePassword) {
            toast.error('Lütfen şifrenizi girin.');
            return;
        }

        setLoading(true);
        try {
            await reauthenticate(deletePassword);
            if (user) {
                // Delete user data from Firestore first
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { deleted: true });

                // Delete auth account
                await deleteUser(user);
                toast.success('Hesabınız başarıyla silindi.');
                navigate('/');
            }
        } catch (error: any) {
            console.error('Delete user error:', error);
            if (error.code === 'auth/wrong-password') {
                toast.error('Hatalı şifre!');
            } else {
                toast.error('Silme başarısız: ' + error.message);
            }
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success('Başarıyla çıkış yapıldı.');
            navigate('/');
        } catch (error) {
            toast.error('Çıkış yapılırken hata oluştu.');
        }
    };

    // Tab configuration
    const tabs = [
        { id: 'general' as const, label: 'Genel', icon: <FaCog />, description: 'Site ayarları ve tercihler' },
        { id: 'profile' as const, label: 'Profil', icon: <FaUserEdit />, description: 'Kişisel bilgileriniz' },
        { id: 'security' as const, label: 'Güvenlik', icon: <FaShieldAlt />, description: 'Şifre ve hesap güvenliği' },
        { id: 'privacy' as const, label: 'Gizlilik', icon: <FaEye />, description: 'Veri ve gizlilik ayarları' },
    ];

    return (
        <div className="min-h-screen pb-12">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 mb-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                                <FaCog className="text-amber-500" />
                                {t('settings.title')}
                            </h1>
                            <p className="text-stone-500 dark:text-zinc-400 mt-2">
                                Hesap ayarlarınızı ve tercihlerinizi yönetin
                            </p>
                        </div>
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-sm font-medium"
                        >
                            <FaHome />
                            <span className="hidden sm:inline">Ana Sayfa</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Tab Navigation - Modern Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-4 rounded-2xl border text-left transition-all ${activeTab === tab.id
                                ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/25'
                                : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:border-amber-300 dark:hover:border-amber-700'
                                }`}
                        >
                            <div className="text-xl mb-2">{tab.icon}</div>
                            <div className="font-bold text-sm">{tab.label}</div>
                            <div className={`text-xs mt-1 ${activeTab === tab.id ? 'text-white/70' : 'text-stone-400 dark:text-zinc-500'}`}>
                                {tab.description}
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Content Sections */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {activeTab === 'general' && (
                            <>
                                {/* Quick Actions */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FaCog className="text-amber-500" />
                                        Hızlı Ayarlar
                                    </h2>
                                    <div className="space-y-4">
                                        {/* Theme Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                                                    {isDark ? <FaMoon className="text-amber-600" /> : <FaSun className="text-amber-600" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-stone-900 dark:text-white">
                                                        {isDark ? 'Karanlık Tema' : 'Aydınlık Tema'}
                                                    </p>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                        {isDark ? 'Göz yorgunluğunu azaltır' : 'Daha parlak görünüm'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isDark ? 'bg-amber-500' : 'bg-stone-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Sound Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${soundEnabled ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-stone-100 dark:bg-zinc-700'}`}>
                                                    {soundEnabled ? <FaVolumeUp className="text-emerald-600" /> : <FaVolumeMute className="text-stone-400" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-stone-900 dark:text-white">Ses Efektleri</p>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                        {soundEnabled ? 'Arayüz sesleri açık' : 'Sessiz mod'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleSound}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-zinc-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Light Theme Comfort Settings */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                                        <FaPalette className="text-purple-500" />
                                        Aydınlık Tema Konforu
                                    </h2>
                                    <p className="text-sm text-stone-500 dark:text-zinc-400 mb-6">
                                        Beyaz temada göz yorgunluğunu azaltmak için ayarları kişiselleştirin.
                                    </p>

                                    <div className="space-y-5">
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-sm font-medium text-stone-700 dark:text-zinc-300">
                                                    Parlaklık
                                                </label>
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg">
                                                    %{lightBrightness}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={82}
                                                max={105}
                                                step={1}
                                                value={lightBrightness}
                                                onChange={(e) => setLightBrightness(Number(e.target.value))}
                                                className="w-full h-2 bg-stone-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                disabled={isDark}
                                            />
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-sm font-medium text-stone-700 dark:text-zinc-300">
                                                    Beyazlık Yumuşatma
                                                </label>
                                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-lg">
                                                    %{lightSoftness}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={35}
                                                step={1}
                                                value={lightSoftness}
                                                onChange={(e) => setLightSoftness(Number(e.target.value))}
                                                className="w-full h-2 bg-stone-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                                disabled={isDark}
                                            />
                                        </div>

                                        <button
                                            onClick={resetLightThemeTuning}
                                            className="text-xs font-medium text-stone-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors underline"
                                        >
                                            Varsayılana Dön
                                        </button>
                                    </div>
                                </div>

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
                                                    <p className="text-xs text-stone-400">Ücretsiz 1 GB Kota</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-white">{formatBytes(dbUsageBytes)}</span>
                                                <span className="text-sm font-medium text-stone-400 ml-1">/ 1 GB</span>
                                            </div>
                                        </div>

                                        <div className="h-3 w-full bg-stone-950/50 rounded-full overflow-hidden border border-stone-700/50 mb-3">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full relative transition-all duration-500"
                                                style={{ width: `${Math.max(1, usagePercent)}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-emerald-400">%{usagePercent.toFixed(2)} Kullanıldı</span>
                                            <span className="text-stone-400">{formatBytes(remainingBytes)} boş</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Migration Link */}
                                <Link
                                    to="/migration"
                                    className="block bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 border border-indigo-400/30 hover:scale-[1.02] transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <FaDownload className="text-2xl text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-white">Veri Migrasyon</h2>
                                                <p className="text-sm text-white/70">
                                                    Eksik bilgileri API'lerden çekerek tamamlayın
                                                </p>
                                            </div>
                                        </div>
                                        <FaArrowRight className="text-white/70 text-xl group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            </>
                        )}

                        {activeTab === 'profile' && (
                            <>
                                {/* Profile Info Form */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                                        <FaUserEdit className="text-amber-500" />
                                        Profil Bilgileri
                                    </h2>

                                    {profileLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSaveProfileInfo} className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                                        İsim
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                                                        placeholder="Adınız"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                                        Soyisim
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                                                        placeholder="Soyadınız"
                                                    />
                                                </div>
                                            </div>

                                            {/* Gender Selection */}
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-3">
                                                    Cinsiyet
                                                </label>
                                                <div className="flex gap-3">
                                                    <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${gender === 'male'
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-400'
                                                        : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-500 hover:border-blue-300'
                                                        }`}>
                                                        <input
                                                            type="radio"
                                                            name="gender"
                                                            value="male"
                                                            checked={gender === 'male'}
                                                            onChange={() => setGender('male')}
                                                            className="hidden"
                                                        />
                                                        <span className="text-2xl">👨</span>
                                                        <span className="font-medium text-sm">Erkek</span>
                                                    </label>
                                                    <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${gender === 'female'
                                                        ? 'bg-pink-50 border-pink-500 text-pink-700 dark:bg-pink-900/20 dark:border-pink-400 dark:text-pink-400'
                                                        : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-500 hover:border-pink-300'
                                                        }`}>
                                                        <input
                                                            type="radio"
                                                            name="gender"
                                                            value="female"
                                                            checked={gender === 'female'}
                                                            onChange={() => setGender('female')}
                                                            className="hidden"
                                                        />
                                                        <span className="text-2xl">👩</span>
                                                        <span className="font-medium text-sm">Kadın</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Email (read-only) */}
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                                    <FaEnvelope className="inline mr-2 text-stone-400" />
                                                    E-posta
                                                </label>
                                                <input
                                                    type="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="w-full px-4 py-3 rounded-xl bg-stone-100 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 text-stone-500 cursor-not-allowed"
                                                />
                                                <p className="text-xs text-stone-400 mt-1">E-posta adresi değiştirilemez</p>
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-2"
                                            >
                                                <FaCheck />
                                                Bilgileri Güncelle
                                            </button>
                                        </form>
                                    )}
                                </div>

                                {/* Account Info */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FaInfoCircle className="text-blue-500" />
                                        Hesap Bilgileri
                                    </h2>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <FaCalendar className="text-stone-400" />
                                                <span className="text-sm text-stone-600 dark:text-zinc-400">Hesap Oluşturma</span>
                                            </div>
                                            <span className="text-sm font-medium text-stone-900 dark:text-white">{accountCreated}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <FaHistory className="text-stone-400" />
                                                <span className="text-sm text-stone-600 dark:text-zinc-400">Son Giriş</span>
                                            </div>
                                            <span className="text-sm font-medium text-stone-900 dark:text-white">{lastLogin}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <FaFingerprint className="text-stone-400" />
                                                <span className="text-sm text-stone-600 dark:text-zinc-400">Kullanıcı ID</span>
                                            </div>
                                            <span className="text-xs font-mono text-stone-500 dark:text-zinc-400 truncate ml-4 max-w-[200px]">{user?.uid}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'security' && (
                            <>
                                {/* Password Change */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                                        <FaKey className="text-blue-500" />
                                        Şifre Değiştir
                                    </h2>

                                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                                Mevcut Şifre
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    required
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                                >
                                                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                                Yeni Şifre
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    required
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                                >
                                                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                                Yeni Şifre (Tekrar)
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <FaCheck />
                                                    Şifreyi Güncelle
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                {/* Logout */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FaSignOutAlt className="text-orange-500" />
                                        Oturum
                                    </h2>
                                    <p className="text-sm text-stone-500 dark:text-zinc-400 mb-4">
                                        Mevcut oturumunuzu sonlandırın.
                                    </p>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                                    >
                                        <FaSignOutAlt />
                                        Çıkış Yap
                                    </button>
                                </div>

                                {/* Delete Account */}
                                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl shadow-lg border border-red-200 dark:border-red-800 p-6">
                                    <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                                        <FaTrash />
                                        Hesabı Sil
                                    </h2>
                                    <p className="text-sm text-stone-600 dark:text-zinc-400 mb-4">
                                        Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                                    >
                                        <FaExclamationTriangle />
                                        Hesabımı Sil
                                    </button>
                                </div>
                            </>
                        )}

                        {activeTab === 'privacy' && (
                            <>
                                {/* Privacy Settings */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FaEye className="text-purple-500" />
                                        Gizlilik Ayarları
                                    </h2>
                                    <p className="text-sm text-stone-500 dark:text-zinc-400 mb-6">
                                        Verilerinizin nasıl kullanıldığını kontrol edin.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <h3 className="font-medium text-stone-900 dark:text-white mb-2">Veri Toplama</h3>
                                            <p className="text-sm text-stone-500 dark:text-zinc-400">
                                                Sadece uygulama işlevselliği için gerekli veriler toplanır.
                                                Üçüncü taraflarla paylaşılmaz.
                                            </p>
                                        </div>

                                        <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                                            <h3 className="font-medium text-stone-900 dark:text-white mb-2">Çerezler</h3>
                                            <p className="text-sm text-stone-500 dark:text-zinc-400">
                                                Oturum yönetimi ve kullanıcı tercihlerinizi hatırlamak için
                                                gerekli çerezler kullanılır.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Password Confirmation Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => {
                            setShowPasswordModal(false);
                            setConfirmPasswordInput('');
                            setPendingProfileUpdate(null);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-stone-200 dark:border-zinc-800"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                                    <FaLock className="text-amber-500" />
                                    Şifre Doğrulama
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
                                Profil bilgilerinizi güncellemek için mevcut şifrenizi girin.
                            </p>

                            <input
                                type="password"
                                value={confirmPasswordInput}
                                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                                placeholder="Mevcut Şifre"
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500 focus:outline-none mb-4"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmProfileUpdate();
                                }}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setConfirmPasswordInput('');
                                        setPendingProfileUpdate(null);
                                    }}
                                    className="flex-1 py-3 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={confirmProfileUpdate}
                                    disabled={profileSaving || !confirmPasswordInput}
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {profileSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FaCheck />
                                            Onayla
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Account Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-stone-200 dark:border-zinc-800"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaExclamationTriangle className="text-red-500 text-2xl" />
                                </div>
                                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                                    Hesabınızı Silmek Üzeresiniz
                                </h3>
                                <p className="text-sm text-stone-500 dark:text-zinc-400">
                                    Bu işlem geri alınamaz. Tüm verileriniz, favorileriniz ve geçmişiniz kalıcı olarak silinecektir.
                                </p>
                            </div>

                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Devam etmek için şifrenizi girin"
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 focus:ring-2 focus:ring-red-500 focus:outline-none mb-4"
                                autoFocus
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword('');
                                    }}
                                    className="flex-1 py-3 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading || !deletePassword}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FaTrash />
                                            Hesabımı Sil
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