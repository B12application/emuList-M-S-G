import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppSound } from '../context/SoundContext';
import { useTheme } from '../context/ThemeContext';
import { useShift } from '../context/ShiftContext';
import {
    FaLock, FaUserShield, FaShieldAlt, FaExclamationTriangle, FaCheck, FaDatabase,
    FaArrowRight, FaUser, FaTimes, FaVolumeUp, FaVolumeMute, FaCloud, FaMoon,
    FaSun, FaPalette, FaBell, FaLanguage, FaInfoCircle, FaTrash, FaKey,
    FaUserEdit, FaEnvelope, FaCalendar, FaFingerprint, FaHistory, FaDownload,
    FaEye, FaEyeSlash, FaSignOutAlt, FaCog, FaHome, FaSyncAlt, FaFileCode,
    FaFileAlt, FaFileUpload, FaCheckCircle, FaSpinner, FaFilm, FaTv, FaBolt,
    FaMars, FaVenus
} from 'react-icons/fa';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../backend/config/firebaseConfig';
import { syncAllMissingImdbIds } from '../../backend/services/imdbSyncService';
import type { SyncProgress, SyncResult } from '../../backend/services/imdbSyncService';
import {
    downloadLibraryAsJson, downloadLibraryAsText, restoreLibraryFromJson, getLocalBackupInfo,
    downloadExpensesAsJson, restoreExpensesFromJson
} from '../../backend/services/backupService';
import { isAdmin } from '../../backend/config/adminConfig';

import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeaderBanner from '../components/ui/PageHeaderBanner';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function SettingsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { soundEnabled, toggleSound } = useAppSound();
    const { isDark, toggleTheme, lightBrightness, setLightBrightness, lightSoftness, setLightSoftness, resetLightThemeTuning } = useTheme();
    const { shiftSettings, updateSettings: updateShiftSettings } = useShift();

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
    const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security' | 'privacy' | 'vault'>('general');

    // IMDb Sync state
    const [isSyncingImdb, setIsSyncingImdb] = useState(false);
    const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

    // Backup & Restore state
    const [isExportingJson, setIsExportingJson] = useState(false);
    const [isExportingText, setIsExportingText] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [localBackupInfo, setLocalBackupInfo] = useState<{ exists: boolean; count: number; dateString: string }>({ exists: false, count: 0, dateString: '' });
    const [isRecoveryUnlocked, setIsRecoveryUnlocked] = useState(false);
    const restoreFileInputRef = useRef<HTMLInputElement>(null);
    const restoreExpensesFileInputRef = useRef<HTMLInputElement>(null);
    const [confirmRestoreType, setConfirmRestoreType] = useState<'media' | 'expenses' | null>(null);




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

    // Load local backup info on mount
    useEffect(() => {
        if (user) {
            setLocalBackupInfo(getLocalBackupInfo(user.uid));
        }
    }, [user]);

    const handleSyncImdb = async () => {
        if (!user) return;
        setIsSyncingImdb(true);
        setSyncProgress(null);
        setSyncResult(null);
        const toastId = toast.loading('Kütüphane taranıyor ve IMDb ID\'leri eşitleniyor...');

        try {
            const res = await syncAllMissingImdbIds(user.uid, (prog) => {
                setSyncProgress(prog);
            });
            setSyncResult(res);
            toast.success(`${res.updatedCount} içerik başarıyla IMDb ID ile eşitlendi!`, { id: toastId });
            queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
        } catch (error: any) {
            console.error('IMDb sync error:', error);
            toast.error('Senkronizasyon sırasında hata oluştu: ' + (error.message || 'Bilinmiyor'), { id: toastId });
        } finally {
            setIsSyncingImdb(false);
        }
    };

    const handleDownloadJson = async () => {
        if (!user) return;
        setIsExportingJson(true);
        const toastId = toast.loading('JSON veritabanı yedeği oluşturuluyor...');
        try {
            const count = await downloadLibraryAsJson(user.uid);
            toast.success(`${count} içerik içeren JSON yedeği indirildi! 💾`, { id: toastId });
            setLocalBackupInfo(getLocalBackupInfo(user.uid));
        } catch (error: any) {
            toast.error('Yedek indirilemedi: ' + (error.message || 'Hata'), { id: toastId });
        } finally {
            setIsExportingJson(false);
        }
    };

    const handleDownloadText = async () => {
        if (!user) return;
        setIsExportingText(true);
        const toastId = toast.loading('Okunabilir metin arşivi oluşturuluyor...');
        try {
            const count = await downloadLibraryAsText(user.uid);
            toast.success(`${count} içerik içeren metin arşivi indirildi! 📄`, { id: toastId });
        } catch (error: any) {
            toast.error('Arşiv indirilemedi: ' + (error.message || 'Hata'), { id: toastId });
        } finally {
            setIsExportingText(false);
        }
    };

    const handleFileRestoreChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsRestoring(true);
        const toastId = toast.loading('Yedek dosyası okunuyor ve geri yükleniyor...');

        try {
            const text = await file.text();
            const res = await restoreLibraryFromJson(user.uid, text);
            toast.success(`${res.importedCount} yeni içerik başarıyla geri yüklendi! (${res.skippedCount} mevcut içerik korundu)`, { id: toastId, duration: 5000 });
            queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
            setLocalBackupInfo(getLocalBackupInfo(user.uid));
        } catch (error: any) {
            console.error('Restore error:', error);
            toast.error('Geri yükleme başarısız: ' + (error.message || 'Geçersiz JSON'), { id: toastId });
        } finally {
            setIsRestoring(false);
            if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
        }
    };

    const handleDownloadExpensesJson = async () => {
        if (!user) return;
        setIsExportingJson(true);
        const toastId = toast.loading('Harcama veritabanı yedeği oluşturuluyor...');
        try {
            const count = await downloadExpensesAsJson(user.uid);
            toast.success(`${count} harcama kaydı içeren JSON yedeği indirildi! 💳`, { id: toastId });
        } catch (error: any) {
            toast.error('Harcama yedeği indirilemedi: ' + (error.message || 'Hata'), { id: toastId });
        } finally {
            setIsExportingJson(false);
        }
    };

    const handleExpensesRestoreChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsRestoring(true);
        const toastId = toast.loading('Harcama yedeği okunuyor ve geri yükleniyor...');

        try {
            const text = await file.text();
            const res = await restoreExpensesFromJson(user.uid, text);
            toast.success(`${res.importedCount} harcama kaydı başarıyla geri yüklendi!`, { id: toastId, duration: 5000 });
            queryClient.invalidateQueries({ queryKey: ['expensedata'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        } catch (error: any) {
            console.error('Expense restore error:', error);
            toast.error('Geri yükleme başarısız: ' + (error.message || 'Geçersiz JSON'), { id: toastId });
        } finally {
            setIsRestoring(false);
        }
    };

    // Tab configuration
    const tabs = [
        { id: 'general' as const, label: t('settings.tabs.general'), icon: <FaCog /> },
        { id: 'vault' as const, label: t('settings.tabs.vault'), icon: <FaDatabase /> },
        { id: 'profile' as const, label: t('settings.tabs.profile'), icon: <FaUserEdit /> },
        { id: 'security' as const, label: t('settings.tabs.security'), icon: <FaShieldAlt /> },
        { id: 'privacy' as const, label: t('settings.tabs.privacy'), icon: <FaEye /> },
    ];


    return (
        <div className="min-h-screen pb-12">
            {/* Hidden File Input for Media Restore */}
            <input
                type="file"
                ref={restoreFileInputRef}
                onChange={handleFileRestoreChange}
                accept=".json"
                className="hidden"
            />

            {/* Hidden File Input for Expenses Restore */}
            <input
                type="file"
                ref={restoreExpensesFileInputRef}
                onChange={handleExpensesRestoreChange}
                accept=".json"
                className="hidden"
            />


            {/* Page Header Banner */}
            <PageHeaderBanner
                title={t('settings.title')}
                subtitle={t('settings.subtitle')}
                icon={<FaCog />}
                backTo="/"
                backLabel={t('nav.home')}
            />

            <div className="w-full mx-auto">
                {/* Tab Navigation – Modern Segment Control */}
                <div className="mb-8">
                    <div className="bg-stone-100 dark:bg-zinc-800/80 rounded-2xl p-1.5 border border-stone-200/60 dark:border-zinc-700/60 shadow-sm overflow-x-auto">
                        <div className="flex gap-1.5 min-w-max sm:min-w-0 sm:grid sm:grid-cols-5">
                            {tabs.map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex-1 justify-center ${activeTab === tab.id
                                        ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-md shadow-black/5 dark:shadow-black/20'
                                        : 'text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-700/40'
                                        }`}
                                >
                                    <span className={`text-base transition-colors ${activeTab === tab.id ? 'text-amber-500' : ''}`}>
                                        {tab.icon}
                                    </span>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                <div className="space-y-6">
                                    {/* Quick Actions */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-5 flex items-center gap-2">
                                        <FaCog className="text-amber-500" />
                                        {t('settings.quickSettings')}
                                    </h2>
                                    <div className="space-y-3">
                                        {/* Theme Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800/70 rounded-xl border-l-4 border-amber-400 dark:border-amber-500">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                                    {isDark ? <FaMoon className="text-amber-500 text-lg" /> : <FaSun className="text-amber-500 text-lg" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-stone-900 dark:text-white">
                                                        {isDark ? t('settings.darkTheme') : t('settings.lightTheme')}
                                                    </p>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                        {isDark ? t('settings.darkThemeDesc') : t('settings.lightThemeDesc')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 shadow-inner ${isDark ? 'bg-amber-500' : 'bg-stone-300 dark:bg-zinc-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-white shadow-lg transition-all duration-300 ${isDark ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                >
                                                    {isDark ? <FaMoon className="text-amber-500 text-[10px]" /> : <FaSun className="text-amber-400 text-[10px]" />}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Sound Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800/70 rounded-xl border-l-4 border-emerald-400 dark:border-emerald-500">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${soundEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-stone-100 dark:bg-zinc-700'}`}>
                                                    {soundEnabled ? <FaVolumeUp className="text-emerald-500 text-lg" /> : <FaVolumeMute className="text-stone-400 text-lg" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-stone-900 dark:text-white">{t('settings.soundEffectsLabel')}</p>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                        {soundEnabled ? t('settings.soundOn') : t('settings.soundOff')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleSound}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 shadow-inner ${soundEnabled ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-zinc-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-white shadow-lg transition-all duration-300 ${soundEnabled ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                >
                                                    {soundEnabled ? <FaVolumeUp className="text-emerald-500 text-[10px]" /> : <FaVolumeMute className="text-stone-400 text-[10px]" />}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Shift System Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800/70 rounded-xl border-l-4 border-indigo-400 dark:border-indigo-500">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${shiftSettings.enableShiftSystem ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-stone-100 dark:bg-zinc-700'}`}>
                                                    <FaCalendar className={`text-lg ${shiftSettings.enableShiftSystem ? 'text-indigo-500' : 'text-stone-400'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-stone-900 dark:text-white">{t('settings.shiftSystem')}</p>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                        {shiftSettings.enableShiftSystem 
                                                            ? t('settings.shiftOn') 
                                                            : t('settings.shiftOff')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const nextVal = !shiftSettings.enableShiftSystem;
                                                    updateShiftSettings({ enableShiftSystem: nextVal });
                                                    toast.success(nextVal ? t('settings.shiftActivated') : t('settings.shiftDeactivated'));
                                                }}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 shadow-inner ${shiftSettings.enableShiftSystem ? 'bg-indigo-600' : 'bg-stone-300 dark:bg-zinc-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-white shadow-lg transition-all duration-300 ${shiftSettings.enableShiftSystem ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                >
                                                    <FaCalendar className={`text-[10px] ${shiftSettings.enableShiftSystem ? 'text-indigo-500' : 'text-stone-400'}`} />
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Light Theme Comfort Settings */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-stone-200 dark:border-zinc-800 p-6">
                                    <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                                        <FaPalette className="text-purple-500" />
                                        {t('settings.lightThemeComfort')}
                                    </h2>
                                    <p className="text-sm text-stone-500 dark:text-zinc-400 mb-6">
                                        {t('settings.lightThemeComfortDesc')}
                                    </p>

                                    <div className="space-y-5">
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-sm font-bold text-stone-700 dark:text-zinc-300">
                                                    {t('settings.brightness')}
                                                </label>
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg">
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
                                                className="w-full h-2.5 bg-gradient-to-r from-stone-200 to-amber-100 dark:from-zinc-700 dark:to-zinc-600 rounded-full appearance-none cursor-pointer accent-amber-500"
                                                disabled={isDark}
                                            />
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-sm font-bold text-stone-700 dark:text-zinc-300">
                                                    {t('settings.whiteSoftening')}
                                                </label>
                                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-lg">
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
                                                className="w-full h-2.5 bg-gradient-to-r from-stone-200 to-purple-100 dark:from-zinc-700 dark:to-zinc-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                                                disabled={isDark}
                                            />
                                        </div>

                                        <button
                                            onClick={resetLightThemeTuning}
                                            className="text-xs font-medium text-stone-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors underline"
                                        >
                                            {t('settings.resetToDefault')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
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
                                                    <h2 className="text-lg font-bold text-white">{t('settings.dbUsage')}</h2>
                                                    <p className="text-xs text-stone-400">{t('settings.dbFreeQuota')}</p>
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
                                            <span className="text-emerald-400">%{usagePercent.toFixed(2)} {t('settings.dbUsed')}</span>
                                            <span className="text-stone-400">{formatBytes(remainingBytes)} {t('settings.dbFree')}</span>
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
                                                <h2 className="text-lg font-bold text-white">{t('settings.dataMigration')}</h2>
                                                <p className="text-sm text-white/70">
                                                    {t('settings.dataMigrationDesc')}
                                                </p>
                                            </div>
                                        </div>
                                        <FaArrowRight className="text-white/70 text-xl group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                                </div>
                            </div>
                        )}

                        {activeTab === 'vault' && (
                            <>
                                {/* 1. IMDb ID SYNC CARD */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-stone-200 dark:border-zinc-800 p-6 sm:p-7 space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center text-xl font-black shadow-md shadow-amber-400/20 shrink-0">
                                                <FaBolt />
                                            </div>
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                                                    IMDb ID Senkronizasyon Motoru
                                                </h2>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                                                    Kütüphanedeki tüm film ve dizileri tarar, eksik IMDb ID'lerini otomatik eşitler.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSyncImdb}
                                            disabled={isSyncingImdb}
                                            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
                                        >
                                            {isSyncingImdb ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    <span>Eşitleniyor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaSyncAlt />
                                                    <span>IMDb ID'lerini Eşitle</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Progress Bar (While Syncing) */}
                                    {isSyncingImdb && syncProgress && (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2.5 animate-fade-in">
                                            <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-zinc-200">
                                                <span className="truncate max-w-[250px] sm:max-w-md">
                                                    Taranıyor: <strong className="text-amber-600 dark:text-amber-400">{syncProgress.currentItemTitle || '...'}</strong>
                                                </span>
                                                <span>
                                                    {syncProgress.current} / {syncProgress.total} (%{Math.round((syncProgress.current / syncProgress.total) * 100)})
                                                </span>
                                            </div>
                                            <div className="h-2.5 w-full bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                                                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                                                />
                                            </div>
                                            <div className="text-[11px] text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                                                <FaCheckCircle className="text-emerald-500" />
                                                Şu ana kadar {syncProgress.updatedCount} yeni IMDb ID veritabanına yazıldı.
                                            </div>
                                        </div>
                                    )}

                                    {/* Summary (After Completed) */}
                                    {syncResult && !isSyncingImdb && (
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-2 animate-fade-in">
                                            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                                                <FaCheckCircle className="text-emerald-500" />
                                                <span>Senkronizasyon Tamamlandı!</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                                                <div className="p-2.5 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-stone-200/50 dark:border-zinc-800">
                                                    <span className="text-stone-400 block text-[10px]">Taranan İçerik</span>
                                                    <strong className="text-sm text-stone-900 dark:text-white">{syncResult.totalChecked}</strong>
                                                </div>
                                                <div className="p-2.5 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-stone-200/50 dark:border-zinc-800">
                                                    <span className="text-emerald-500 block text-[10px]">Yeni Eşitlenen</span>
                                                    <strong className="text-sm text-emerald-600 dark:text-emerald-400">+{syncResult.updatedCount}</strong>
                                                </div>
                                                <div className="p-2.5 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-stone-200/50 dark:border-zinc-800">
                                                    <span className="text-stone-400 block text-[10px]">Zaten IMDb ID'si Olan</span>
                                                    <strong className="text-sm text-stone-900 dark:text-white">{syncResult.alreadyHadImdbCount}</strong>
                                                </div>
                                                <div className="p-2.5 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-stone-200/50 dark:border-zinc-800">
                                                    <span className="text-stone-400 block text-[10px]">Eşleşmeyen</span>
                                                    <strong className="text-sm text-stone-500">{syncResult.failedCount}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Features list */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 dark:text-zinc-400">
                                        <div className="p-3.5 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/60 dark:border-zinc-800 flex items-start gap-2.5">
                                            <FaCheck className="text-amber-500 mt-0.5 shrink-0" />
                                            <span><strong>Çapraz Dil Eşitlemesi:</strong> Türkçe eklediğiniz bir film otomatik olarak İngilizce IMDb ID'sine bağlanır.</span>
                                        </div>
                                        <div className="p-3.5 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/60 dark:border-zinc-800 flex items-start gap-2.5">
                                            <FaCheck className="text-amber-500 mt-0.5 shrink-0" />
                                            <span><strong>Dizi Sezon & Bölüm Uyumu:</strong> IMDb ID'si olan dizilerin tüm sezon bölüm sayıları otomatik senkronize olur.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. DATA VAULT & BACKUP / RESTORE CARD */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-stone-200 dark:border-zinc-800 p-6 sm:p-7 space-y-6">
                                    <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100 dark:border-zinc-800">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-indigo-600/20 shrink-0">
                                            <FaDatabase />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                                                Veritabanı Koruma & Kurtarma Kasası
                                            </h2>
                                            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                                                Veritabanınız silinse dahi tüm listeniz JSON ve TXT olarak korunur ve tek tıkla geri yüklenebilir.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Local Storage Backup Health Card */}
                                    <div className="p-4 bg-gradient-to-r from-stone-900 via-zinc-900 to-black text-white rounded-2xl border border-stone-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Otomatik Lokal Yedek Devrede</span>
                                            </div>
                                            <p className="text-xs text-stone-400">
                                                {localBackupInfo.exists 
                                                    ? `Tarayıcınızda ${localBackupInfo.count} içerik son haliyle güvence altında (${localBackupInfo.dateString}).`
                                                    : 'Uygulamayı her açtığınızda kütüphaneniz cihazınızın yerel hafızasına da yedeklenir.'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* User-friendly Personal Data Notice */}
                                    <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                                        <FaShieldAlt className="text-blue-500 mt-0.5 shrink-0 text-sm" />
                                        <span className="leading-relaxed">
                                            {t('vault.userExportNotice')}
                                        </span>
                                    </div>

                                    {/* Section 1: Media Library Backups (Harmless Downloads) */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
                                            <span>🎬 {t('vault.mediaBackupTitle')}</span>
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Download Media JSON */}
                                            <button
                                                type="button"
                                                onClick={handleDownloadJson}
                                                disabled={isExportingJson}
                                                className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700/80 text-left transition-all group cursor-pointer active:scale-95 disabled:opacity-50"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm mb-2 group-hover:scale-110 transition-transform">
                                                    <FaFileCode />
                                                </div>
                                                <h4 className="text-xs font-extrabold text-stone-900 dark:text-white">
                                                    {t('vault.downloadMediaJson')}
                                                </h4>
                                                <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">
                                                    {t('vault.downloadMediaJsonDesc')}
                                                </p>
                                            </button>

                                            {/* Download Media TXT */}
                                            <button
                                                type="button"
                                                onClick={handleDownloadText}
                                                disabled={isExportingText}
                                                className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700/80 text-left transition-all group cursor-pointer active:scale-95 disabled:opacity-50"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm mb-2 group-hover:scale-110 transition-transform">
                                                    <FaFileAlt />
                                                </div>
                                                <h4 className="text-xs font-extrabold text-stone-900 dark:text-white">
                                                    {t('vault.downloadMediaTxt')}
                                                </h4>
                                                <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">
                                                    {t('vault.downloadMediaTxtDesc')}
                                                </p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Section 2: Expenses Backups */}
                                    <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
                                        <h3 className="text-xs font-black uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
                                            <span>💳 {t('vault.expensesBackupTitle')}</span>
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Download Expenses JSON */}
                                            <button
                                                type="button"
                                                onClick={handleDownloadExpensesJson}
                                                disabled={isExportingJson}
                                                className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700/80 text-left transition-all group cursor-pointer active:scale-95 disabled:opacity-50"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm mb-2 group-hover:scale-110 transition-transform">
                                                    <FaDownload />
                                                </div>
                                                <h4 className="text-xs font-extrabold text-stone-900 dark:text-white">
                                                    {t('vault.downloadExpensesJson')}
                                                </h4>
                                                <p className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">
                                                    {t('vault.downloadExpensesJsonDesc')}
                                                </p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Section 3: Automated Scheduled Cron Jobs (EMU / Admin Only) */}
                                    {user && isAdmin(user.uid) && (
                                        <div className="p-4 sm:p-5 bg-gradient-to-br from-stone-50 to-amber-50/20 dark:from-zinc-800/60 dark:to-zinc-800/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">
                                                    <FaCalendar className="text-amber-500" />
                                                    <span>{t('vault.cronScheduleTitle')}</span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                    {t('vault.cronAdminBadge')}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed">
                                                {t('vault.cronAdminNotice')}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                                <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-stone-200/60 dark:border-zinc-800 space-y-1.5 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                                                            <span>🎬</span>
                                                            <span>{t('vault.biweeklyMediaJob')}</span>
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                                            {t('vault.biweeklyMediaTime')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed">
                                                        {t('vault.biweeklyMediaJobDesc')}
                                                    </p>
                                                </div>

                                                <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-stone-200/60 dark:border-zinc-800 space-y-1.5 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                                                            <span>💳</span>
                                                            <span>{t('vault.biweeklyExpensesJob')}</span>
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                                            {t('vault.biweeklyExpensesTime')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed">
                                                        {t('vault.biweeklyExpensesJobDesc')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 4: 🚨 GUARDED DISASTER RECOVERY (LOCKED BY DEFAULT) 🚨 */}
                                    <div className="p-4 sm:p-5 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/80 dark:border-red-900/40 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
                                                    <FaLock className="text-sm" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-red-900 dark:text-red-200 uppercase tracking-wider">
                                                        🚨 Acil Durum Veri Kurtarma (Korumalı Alan)
                                                    </h4>
                                                    <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                                                        Yanlışlıkla basılmaması için kilitlidir. Yalnızca veritabanı silindiğinde kullanılır.
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setIsRecoveryUnlocked(!isRecoveryUnlocked)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${isRecoveryUnlocked
                                                    ? 'bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300'
                                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20'
                                                    }`}
                                            >
                                                {isRecoveryUnlocked ? '🔒 Kilitle' : '🔓 Kilidi Aç'}
                                            </button>
                                        </div>

                                        {isRecoveryUnlocked && (
                                            <div className="space-y-3 pt-3 border-t border-red-200/60 dark:border-red-900/50 animate-fade-in">
                                                <div className="p-3 bg-red-100/70 dark:bg-red-900/30 rounded-xl text-[11px] text-red-900 dark:text-red-200 flex items-start gap-2 leading-relaxed">
                                                    <FaExclamationTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5 text-xs" />
                                                    <span>
                                                        <strong>Uyarı:</strong> Bu işlem indirdiğiniz JSON dosyasındaki içerikleri Firebase veritabanınıza geri yazar. Var olan güncel kayıtlarınızın üzerine eski kayıt aktarmamak için sadece acil durumlarda kullanınız.
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmRestoreType('media')}
                                                        disabled={isRestoring}
                                                        className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-800/80 text-left hover:border-red-500 transition-all group cursor-pointer disabled:opacity-50"
                                                    >
                                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-xs mb-1">
                                                            <FaFileUpload />
                                                            <span>Medya JSON Yedeğini Firebase'e Aktar</span>
                                                        </div>
                                                        <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                                                            JSON dosyasındaki film/dizileri Firestore'a aktarır.
                                                        </p>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmRestoreType('expenses')}
                                                        disabled={isRestoring}
                                                        className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-800/80 text-left hover:border-red-500 transition-all group cursor-pointer disabled:opacity-50"
                                                    >
                                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-xs mb-1">
                                                            <FaFileUpload />
                                                            <span>Harcama JSON Yedeğini Firebase'e Aktar</span>
                                                        </div>
                                                        <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                                                            JSON dosyasındaki harcama/bütçeyi Firestore'a aktarır.
                                                        </p>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </>
                        )}



                        {activeTab === 'profile' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                {/* Profile Info Form */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6 sm:p-7">
                                    <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-stone-100 dark:border-zinc-800/80">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                            <FaUserEdit className="text-lg" />
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                                                {t('settings.profileInfo')}
                                            </h2>
                                            <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                Kişisel bilgilerinizi ve profil tercihlerinizi yönetin
                                            </p>
                                        </div>
                                    </div>

                                    {profileLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSaveProfileInfo} className="space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                                        <FaUser className="inline mr-1.5 text-stone-400 text-xs" />
                                                        {t('settings.firstName')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700/80 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none transition-all text-sm font-medium text-stone-900 dark:text-white"
                                                        placeholder={t('settings.firstNamePlaceholder')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                                        <FaUser className="inline mr-1.5 text-stone-400 text-xs" />
                                                        {t('settings.lastName')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700/80 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none transition-all text-sm font-medium text-stone-900 dark:text-white"
                                                        placeholder={t('settings.lastNamePlaceholder')}
                                                    />
                                                </div>
                                            </div>

                                            {/* Gender Selection - Segmented Executive Control */}
                                            <div>
                                                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                                    {t('settings.gender')}
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setGender('male')}
                                                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer ${gender === 'male'
                                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-xs'
                                                            : 'bg-stone-50 dark:bg-zinc-800/70 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-700/80 hover:bg-stone-100 dark:hover:bg-zinc-800'
                                                            }`}
                                                    >
                                                        <FaMars className={`text-sm ${gender === 'male' ? 'text-amber-500' : 'text-stone-400 dark:text-zinc-500'}`} />
                                                        <span>{t('settings.genderMale')}</span>
                                                        {gender === 'male' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1"></span>}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGender('female')}
                                                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer ${gender === 'female'
                                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-xs'
                                                            : 'bg-stone-50 dark:bg-zinc-800/70 text-stone-600 dark:text-zinc-400 border border-stone-200/80 dark:border-zinc-700/80 hover:bg-stone-100 dark:hover:bg-zinc-800'
                                                            }`}
                                                    >
                                                        <FaVenus className={`text-sm ${gender === 'female' ? 'text-amber-500' : 'text-stone-400 dark:text-zinc-500'}`} />
                                                        <span>{t('settings.genderFemale')}</span>
                                                        {gender === 'female' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1"></span>}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Email (read-only) */}
                                            <div>
                                                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                                    <FaEnvelope className="inline mr-1.5 text-stone-400 text-xs" />
                                                    {t('settings.email')}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        value={user?.email || ''}
                                                        disabled
                                                        className="w-full px-4 py-3 rounded-xl bg-stone-100/80 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-700/60 text-stone-500 dark:text-zinc-400 text-sm font-medium cursor-not-allowed pr-10"
                                                    />
                                                    <FaLock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500 text-xs" />
                                                </div>
                                                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1.5">
                                                    <FaLock className="text-[9px]" />
                                                    {t('settings.emailNotEditable')}
                                                </p>
                                            </div>

                                            {/* Submit Button - Sleek Right-Aligned */}
                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={profileSaving}
                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    {profileSaving ? (
                                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <FaCheck className="text-xs" />
                                                    )}
                                                    <span>{t('settings.updateInfo')}</span>
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* Account Info – Modern Card */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6 sm:p-7">
                                    <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-stone-100 dark:border-zinc-800/80">
                                        <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-stone-600 dark:text-zinc-300">
                                            <FaInfoCircle className="text-base" />
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                                                {t('settings.accountInfo')}
                                            </h2>
                                            <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                Hesap kimliği ve kayıt zaman çizelgesi
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-stone-50/70 dark:bg-zinc-800/40 rounded-2xl border border-stone-200/60 dark:border-zinc-800/60 hover:bg-stone-50 dark:hover:bg-zinc-800/60 transition-colors">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-stone-200/60 dark:bg-zinc-700/50 flex items-center justify-center text-stone-600 dark:text-zinc-300">
                                                    <FaCalendar className="text-xs" />
                                                </div>
                                                <span className="text-xs font-semibold text-stone-600 dark:text-zinc-400">{t('settings.accountCreated')}</span>
                                            </div>
                                            <span className="text-xs font-bold text-stone-900 dark:text-white">{accountCreated}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-stone-50/70 dark:bg-zinc-800/40 rounded-2xl border border-stone-200/60 dark:border-zinc-800/60 hover:bg-stone-50 dark:hover:bg-zinc-800/60 transition-colors">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-stone-200/60 dark:bg-zinc-700/50 flex items-center justify-center text-stone-600 dark:text-zinc-300">
                                                    <FaHistory className="text-xs" />
                                                </div>
                                                <span className="text-xs font-semibold text-stone-600 dark:text-zinc-400">{t('settings.lastLogin')}</span>
                                            </div>
                                            <span className="text-xs font-bold text-stone-900 dark:text-white">{lastLogin}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-stone-50/70 dark:bg-zinc-800/40 rounded-2xl border border-stone-200/60 dark:border-zinc-800/60 hover:bg-stone-50 dark:hover:bg-zinc-800/60 transition-colors">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-stone-200/60 dark:bg-zinc-700/50 flex items-center justify-center text-stone-600 dark:text-zinc-300">
                                                    <FaFingerprint className="text-xs" />
                                                </div>
                                                <span className="text-xs font-semibold text-stone-600 dark:text-zinc-400">{t('settings.userId')}</span>
                                            </div>
                                            <span className="text-[11px] font-mono font-medium text-stone-600 dark:text-zinc-300 truncate ml-4 max-w-[180px] bg-stone-200/70 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-stone-300/60 dark:border-zinc-700/50 select-all">
                                                {user?.uid}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                {/* Password Change */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6 sm:p-7">
                                    <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-stone-100 dark:border-zinc-800/80">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                            <FaKey className="text-base" />
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                                                {t('settings.passwordTitle')}
                                            </h2>
                                            <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                Güçlü ve benzersiz bir şifre belirleyin
                                            </p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                                {t('settings.currentPassword')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    required
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700/80 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none pr-12 text-sm font-medium text-stone-900 dark:text-white transition-all"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 transition-colors p-1"
                                                >
                                                    {showCurrentPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                                {t('settings.newPassword')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    required
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700/80 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none pr-12 text-sm font-medium text-stone-900 dark:text-white transition-all"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 transition-colors p-1"
                                                >
                                                    {showNewPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                                {t('settings.confirmNewPassword')}
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700/80 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none text-sm font-medium text-stone-900 dark:text-white transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-100 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <FaCheck className="text-xs" />
                                                )}
                                                <span>{t('settings.updatePassword')}</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="space-y-6">
                                    {/* Session Management Card */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6 sm:p-7">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-stone-600 dark:text-zinc-300">
                                                    <FaSignOutAlt className="text-sm" />
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-bold text-stone-900 dark:text-white">
                                                        {t('settings.session')}
                                                    </h2>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-md leading-relaxed">
                                                        {t('settings.sessionDesc')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 active:scale-[0.98] font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer"
                                            >
                                                <FaSignOutAlt className="text-xs text-stone-400" />
                                                <span>{t('settings.logout')}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Danger Zone: Delete Account */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-rose-200/70 dark:border-rose-900/40 p-6 sm:p-7">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                                                    <FaTrash className="text-sm" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="text-base font-bold text-stone-900 dark:text-white">
                                                            {t('settings.deleteAccount')}
                                                        </h2>
                                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 tracking-wider">
                                                            Tehlikeli Alan
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-md leading-relaxed">
                                                        {t('settings.deleteAccountDesc')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs shadow-sm shadow-rose-600/20 transition-all shrink-0 cursor-pointer"
                                            >
                                                <FaExclamationTriangle className="text-xs" />
                                                <span>{t('settings.deleteConfirm')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <>
                                {/* Privacy Header */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6 sm:p-7">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                            <FaShieldAlt className="text-base" />
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                                                {t('settings.privacyTitle')}
                                            </h2>
                                            <p className="text-xs text-stone-500 dark:text-zinc-400">
                                                {t('settings.privacySubtitle')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Privacy Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Data Collection */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6">
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <FaShieldAlt className="text-base" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">{t('settings.privacyDataCollection')}</h3>
                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full">
                                                        {t('settings.privacyDataCollectionBadge')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                                                    {t('settings.privacyDataCollectionDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cookies */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6">
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                <FaLock className="text-base" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">{t('settings.privacyCookies')}</h3>
                                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 rounded-full">
                                                        {t('settings.privacyCookiesBadge')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                                                    {t('settings.privacyCookiesDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Third Party */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6">
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                                <FaCloud className="text-base" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">{t('settings.privacyThirdParty')}</h3>
                                                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2.5 py-0.5 rounded-full">
                                                        {t('settings.privacyThirdPartyBadge')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                                                    {t('settings.privacyThirdPartyDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Export */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-stone-200/80 dark:border-zinc-800/80 p-6">
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                                <FaDownload className="text-base" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">{t('settings.privacyDataExport')}</h3>
                                                </div>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed mb-3">
                                                    {t('settings.privacyDataExportDesc')}
                                                </p>
                                                <button
                                                    onClick={() => setActiveTab('vault')}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                                                >
                                                    <span>{t('settings.privacyDataExportAction')}</span>
                                                    <span>→</span>
                                                </button>
                                            </div>
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
                        className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-[120] p-4"
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
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-zinc-800/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm">
                                        <FaLock />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-stone-900 dark:text-white">
                                            Şifre Doğrulama
                                        </h3>
                                        <p className="text-xs text-stone-500 dark:text-zinc-400">
                                            Güvenlik için lütfen mevcut şifrenizi girin
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setConfirmPasswordInput('');
                                        setPendingProfileUpdate(null);
                                    }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                                    Profil bilgilerinizi kaydetmek ve güncellemek için mevcut hesabınızın şifresini onaylayınız.
                                </p>
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                        Mevcut Şifre
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPasswordInput}
                                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700/80 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none text-sm font-medium text-stone-900 dark:text-white transition-all"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') confirmProfileUpdate();
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-stone-50 dark:bg-zinc-900/80 border-t border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setConfirmPasswordInput('');
                                        setPendingProfileUpdate(null);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmProfileUpdate}
                                    disabled={profileSaving || !confirmPasswordInput}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {profileSaving ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <FaCheck className="text-xs" />
                                    )}
                                    <span>Onayla</span>
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
                        className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-[120] p-4"
                        onClick={() => {
                            setShowDeleteModal(false);
                            setDeletePassword('');
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md border border-rose-200/80 dark:border-rose-900/60 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-zinc-800/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-sm">
                                        <FaExclamationTriangle />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-stone-900 dark:text-white">
                                            Hesabınızı Silmek Üzeresiniz
                                        </h3>
                                        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                                            Bu işlem geri alınamaz!
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword('');
                                    }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                                    Hesabınızı sildiğinizde kütüphaneniz, favorileriniz, ajanda ve geçmiş kayıtlarınız dahil tüm verileriniz kalıcı olarak imha edilir.
                                </p>
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                                        Onaylamak İçin Şifrenizi Girin
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/80 dark:border-zinc-700/80 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 focus:outline-none text-sm font-medium text-stone-900 dark:text-white transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-stone-50 dark:bg-zinc-900/80 border-t border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword('');
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={loading || !deletePassword}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <FaTrash className="text-xs" />
                                    )}
                                    <span>Hesabımı Kalıcı Olarak Sil</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Disaster Recovery Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmRestoreType !== null}
                onClose={() => setConfirmRestoreType(null)}
                onConfirm={() => {
                    if (confirmRestoreType === 'media') {
                        restoreFileInputRef.current?.click();
                    } else if (confirmRestoreType === 'expenses') {
                        restoreExpensesFileInputRef.current?.click();
                    }
                }}
                title={confirmRestoreType === 'media' ? 'Medya JSON Yedeği Aktarımı' : 'Harcama JSON Yedeği Aktarımı'}
                message="Bu işlem seçtiğiniz JSON yedek dosyasındaki kayıtları doğrudan Firebase veritabanınıza geri aktaracaktır. Devam etmek istediğinize emin misiniz?"
                confirmText="Yedekten Geri Yükle"
                cancelText="İptal"
                variant="danger"
            />
        </div>
    );
}