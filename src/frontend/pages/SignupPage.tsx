import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../../backend/config/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FaGoogle, 
  FaArrowLeft, 
  FaEnvelope, 
  FaLock, 
  FaShieldAlt, 
  FaArrowRight, 
  FaCheckCircle,
  FaDatabase,
  FaBolt,
  FaKey,
  FaPause
} from 'react-icons/fa';
import '../index.css';

interface SecurityFeature {
  id: string;
  badge: string;
  badgeEn: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  tagline: string;
  taglineEn: string;
  icon: any;
  colorTheme: {
    accent: string;
    accentBg: string;
    border: string;
    pill: string;
    bar: string;
  };
  metrics: { label: string; labelEn: string; value: string }[];
  features: { tr: string; en: string }[];
}

const SECURITY_MODULES: SecurityFeature[] = [
  {
    id: 'isolation',
    badge: 'Gizlilik',
    badgeEn: 'Privacy',
    title: 'İzole & Güvenli Veri Alanı',
    titleEn: 'Isolated User Partition',
    subtitle: 'Kullanıcıya Özel Firestore Koruması',
    subtitleEn: 'User-Scoped Security Rules',
    tagline: 'Tüm finans, seyahat, takvim ve medya verileriniz sadece sizin yetkinizle şifrelenerek okunabilir.',
    taglineEn: 'All your finances, travel map, calendar and media files are strictly partitioned per user.',
    icon: FaShieldAlt,
    colorTheme: {
      accent: 'text-indigo-600 dark:text-indigo-400',
      accentBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
      pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      bar: 'bg-indigo-500'
    },
    metrics: [
      { label: 'Veri İzolasyonu', labelEn: 'Data Isolation', value: '%100 Özel' },
      { label: 'Şifreleme', labelEn: 'Encryption', value: 'AES-256' },
      { label: 'Güvenlik', labelEn: 'Security', value: 'Tier 1' }
    ],
    features: [
      { tr: 'Bireysel Firestore Kuralları', en: 'Custom Security Rules' },
      { tr: 'Yetkisiz Erişim Engeli', en: 'Zero Unauthorized Access' },
      { tr: 'Gizli Not Kasası Koruması', en: 'Encrypted Notes Vault' }
    ]
  },
  {
    id: 'backups',
    badge: 'Yedekleme',
    badgeEn: 'Auto Backups',
    title: 'Otomatik Cron & JSON Arşivi',
    titleEn: 'Automated Cron & JSON Vault',
    subtitle: 'Düzenli Veri Güvencesi',
    subtitleEn: 'Scheduled Cloud Backups',
    tagline: 'Her gece 00:00\'da medya koleksiyonunuz, her ayın 15\'inde ise harcamalarınız otomatik arşivlenir.',
    taglineEn: 'Nightly automated media catalog archives and monthly expenses snapshots processed on the 15th.',
    icon: FaDatabase,
    colorTheme: {
      accent: 'text-emerald-600 dark:text-emerald-400',
      accentBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      bar: 'bg-emerald-500'
    },
    metrics: [
      { label: 'Medya Cron', labelEn: 'Media Cron', value: 'Her Gece' },
      { label: 'Harcama Cron', labelEn: 'Expense Cron', value: 'Ayın 15\'i' },
      { label: 'Kurtarma Modu', labelEn: 'Disaster Vault', value: 'Korumalı' }
    ],
    features: [
      { tr: 'GitHub Actions Entegrasyonu', en: 'GitHub Actions Workflows' },
      { tr: 'Tek Tıkla JSON / TXT İndirme', en: 'One-Click Full Export' },
      { tr: 'Kaza İle Silinmeye Karşı Kilit', en: 'Protected Danger Zone' }
    ]
  },
  {
    id: 'sync',
    badge: 'Entegrasyon',
    badgeEn: 'Sync Engine',
    title: 'IMDb & TMDb API Entegrasyonu',
    titleEn: 'IMDb & TMDb API Connectivity',
    subtitle: 'Zengin Medya Dünyası',
    subtitleEn: 'Enriched Entertainment Hub',
    tagline: 'Kütüphanenizdeki eksik IMDb ID\'leri otomatik taranır, sezon ve bölüm sayaçları canlı işlenir.',
    taglineEn: 'Automatically fill missing IMDb IDs and keep track of live season and episode progress.',
    icon: FaBolt,
    colorTheme: {
      accent: 'text-amber-600 dark:text-amber-400',
      accentBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      bar: 'bg-amber-500'
    },
    metrics: [
      { label: 'OMDb & TMDb', labelEn: 'Dual APIs', value: 'Canlı Eşleme' },
      { label: 'Çift Kayıt', labelEn: 'Duplicate Guard', value: 'Akıllı Tespit' },
      { label: 'Dizi İlerlemesi', labelEn: 'Series Tracker', value: 'Bölüm Sayacı' }
    ],
    features: [
      { tr: 'Eksik IMDb ID Senkronizasyonu', en: 'Auto Fill IMDb IDs' },
      { tr: 'Tekrarlayan Film Tespiti', en: 'Duplicate Warning Modal' },
      { tr: 'Kişisel Puan & İnceleme', en: 'Custom Reviews & Stars' }
    ]
  }
];

const SLIDE_DURATION = 14000;

export default function SignupPage() {
  const { t, language, setLanguage } = useLanguage();
  const isTr = language === 'tr';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Auto rotate showcase modules with pause support
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveModuleIndex((prev) => (prev + 1) % SECURITY_MODULES.length);
      setProgressKey((k) => k + 1);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isPaused, activeModuleIndex]);

  const handleSelectModule = (index: number) => {
    setActiveModuleIndex(index);
    setProgressKey((k) => k + 1);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !surname.trim()) {
      setError(isTr ? 'Ad ve soyad zorunludur.' : 'Name and surname are required.');
      return;
    }
    if (password.length < 6) {
      setError(isTr ? 'Şifreniz en az 6 karakter olmalıdır.' : 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(isTr ? 'Şifreler birbiriyle eşleşmiyor.' : 'Passwords do not match.');
      return;
    }
    if (!gender) {
      setError(isTr ? 'Lütfen cinsiyetinizi seçiniz.' : 'Please select your gender.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = userCredential.user;

      await updateProfile(newUser, {
        displayName: `${name.trim()} ${surname.trim()}`
      });

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        displayName: `${name.trim()} ${surname.trim()}`,
        gender: gender,
        visitedProvinces: []
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(isTr ? 'Bu e-posta adresi zaten kullanımda.' : 'This email is already in use.');
      } else if (err.code === 'auth/weak-password') {
        setError(isTr ? 'Şifre çok zayıf.' : 'Password is too weak.');
      } else {
        setError(t('auth.signupError') || (isTr ? 'Kayıt sırasında bir hata oluştu.' : 'Signup failed.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userDocRef = doc(db, "users", googleUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          uid: googleUser.uid,
          email: googleUser.email,
          displayName: googleUser.displayName,
          photoURL: googleUser.photoURL || '',
          gender: '',
          visitedProvinces: []
        });
      } else {
        await setDoc(userDocRef, { photoURL: googleUser.photoURL || '' }, { merge: true });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(t('auth.googleError') || (isTr ? 'Google ile kayıt başarısız.' : 'Google signup failed.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const pwColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  const pwLabels = isTr
    ? ['', 'Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü']
    : ['', 'Very Weak', 'Weak', 'Fair', 'Strong'];

  const activeModule = SECURITY_MODULES[activeModuleIndex];
  const IconComponent = activeModule.icon;

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300 relative overflow-hidden">
      
      {/* Soft Ambient Background Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 dark:from-indigo-500/15 dark:to-emerald-500/10 blur-[130px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-purple-500/10 to-sky-500/10 dark:from-purple-500/10 dark:to-sky-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-60 dark:opacity-60" />
      </div>

      {/* Top Floating Nav */}
      <header className="absolute top-0 w-full px-6 py-6 sm:px-10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3.5">
          <Link 
            to="/" 
            className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs active:scale-95 backdrop-blur-md"
          >
            <FaArrowLeft className="text-xs" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-sm shadow-indigo-600/30">
              B12
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-[Orbitron]">
                B12 OS
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                {isTr ? 'Yeni Hesap Kaydı' : 'Account Registration'}
              </span>
            </div>
          </div>
        </div>

        {/* Language Switch */}
        <div className="flex bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <button 
            type="button"
            onClick={() => setLanguage('tr')} 
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${language === 'tr' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
          >
            TR
          </button>
          <button 
            type="button"
            onClick={() => setLanguage('en')} 
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
          >
            EN
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="w-full flex flex-col lg:flex-row min-h-screen relative z-10 pt-20 lg:pt-0">
        
        {/* ================= LEFT COLUMN: SIGNUP FORM ================= */}
        <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-center px-6 sm:px-12 lg:px-14 xl:px-18 py-8 lg:py-14">
          <div className="w-full max-w-md mx-auto space-y-5">
            
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {isTr ? 'Hesap Oluşturun' : 'Create Account'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                {isTr 
                  ? 'B12 kişisel hafıza ve yaşam asistanı sistemine hemen katılın.' 
                  : 'Join the B12 personal memory and intelligent suite today.'}
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-3.5 pt-1">
              
              {/* Name & Surname */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                    {isTr ? 'Ad' : 'First Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isTr ? 'Mustafa' : 'John'}
                    className="w-full px-3.5 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                    {isTr ? 'Soyad' : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder={isTr ? 'Ulusoy' : 'Doe'}
                    className="w-full px-3.5 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  {isTr ? 'E-posta' : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaEnvelope size={13} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Password with Eye Animation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                    {isTr ? 'Şifre' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      placeholder="••••••••"
                      className="w-full px-3.5 pr-8 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1"
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                        className="transition-transform duration-300"
                        style={{
                          transform: (!showPassword && isPasswordFocused) ? 'scaleY(0.35)' : 'scaleY(1)'
                        }}
                      >
                        {showPassword ? (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                    {isTr ? 'Şifre Tekrar' : 'Confirm'}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div 
                        key={step} 
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: step <= pwStrength ? pwColors[pwStrength] : '#e2e8f0'
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">{isTr ? 'Şifre Gücü:' : 'Password Strength:'}</span>
                    <span style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
                  </div>
                </div>
              )}

              {/* Gender Radio Buttons */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  {isTr ? 'Cinsiyet' : 'Gender'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 shadow-xs'
                        : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {isTr ? 'Erkek' : 'Male'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 shadow-xs'
                        : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {isTr ? 'Kadın' : 'Female'}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isTr ? 'Hesap Oluştur' : 'Sign Up'}</span>
                    <FaArrowRight className="text-xs" />
                  </>
                )}
              </button>

              {/* Google Sign In */}
              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <FaGoogle className="text-rose-500 text-xs" />
                <span>{isTr ? 'Google ile Kayıt Ol' : 'Sign up with Google'}</span>
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isTr ? 'Zaten hesabınız var mı? ' : 'Already have an account? '}
                  <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                    {isTr ? 'Giriş Yapın' : 'Sign In'}
                  </Link>
                </p>
              </div>

            </form>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: WHITE & ROTATING SHOWCASE ================= */}
        <div 
          className="w-full lg:w-[52%] xl:w-[55%] bg-slate-100/70 dark:bg-slate-900/50 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between p-6 sm:p-12 lg:p-14 xl:p-16 relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs">
                  <FaShieldAlt />
                </span>
                <span className="text-xs font-mono font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                  {isTr ? 'B12 Güvenlik & Gizlilik Mimarisi' : 'B12 Security Architecture'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {isPaused && (
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold bg-amber-100/80 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    <FaPause size={8} /> {isTr ? 'Okuma Duraklatıldı' : 'Paused'}
                  </span>
                )}
                <span>{activeModuleIndex + 1} / {SECURITY_MODULES.length}</span>
              </div>
            </div>

            {/* Module Pills Selector */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {SECURITY_MODULES.map((m, idx) => {
                const MIcon = m.icon;
                const isActive = activeModuleIndex === idx;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectModule(idx)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-white dark:bg-slate-800 border-indigo-500/50 dark:border-indigo-500/50 shadow-sm' 
                        : 'bg-white/60 dark:bg-slate-850/40 hover:bg-white dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <MIcon className={`text-sm mb-1.5 ${isActive ? m.colorTheme.accent : 'text-slate-400'}`} />
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                      {isTr ? m.badge : m.badgeEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Card Showcase with Progress Bar */}
          <div className="my-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-750 shadow-xl space-y-6 relative overflow-hidden"
              >
                {/* Reading Progress Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    key={progressKey}
                    initial={{ width: '0%' }}
                    animate={{ width: isPaused ? '100%' : '100%' }}
                    transition={{ duration: isPaused ? 0 : SLIDE_DURATION / 1000, ease: 'linear' }}
                    className={`h-full ${activeModule.colorTheme.bar}`}
                  />
                </div>

                <div className="flex items-start justify-between gap-4 pt-1">
                  <div className="space-y-1">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${activeModule.colorTheme.pill}`}>
                      {isTr ? activeModule.subtitle : activeModule.subtitleEn}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1">
                      {isTr ? activeModule.title : activeModule.titleEn}
                    </h3>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${activeModule.colorTheme.accentBg} flex items-center justify-center text-xl shrink-0 shadow-xs`}>
                    <IconComponent />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isTr ? activeModule.tagline : activeModule.taglineEn}
                </p>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {activeModule.metrics.map((metric, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {isTr ? metric.label : metric.labelEn}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {activeModule.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                      <FaCheckCircle className={`text-[10px] ${activeModule.colorTheme.accent}`} />
                      <span>{isTr ? feat.tr : feat.en}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isTr ? 'GÜVENLİ VE ŞİFRELİ BULUT ALTYAPISI' : 'ENCRYPTED SECURE CLOUD'}</span>
            </div>
            <span>B12 // PRIVACY FIRST OS</span>
          </div>

        </div>

      </div>
    </div>
  );
}