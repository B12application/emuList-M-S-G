import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  signInWithEmailAndPassword,
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
  FaPlay, 
  FaEnvelope, 
  FaLock, 
  FaWallet, 
  FaFilm, 
  FaCalendarAlt, 
  FaMapMarkedAlt, 
  FaShieldAlt, 
  FaCheckCircle,
  FaArrowRight,
  FaBrain,
  FaPause
} from 'react-icons/fa';
import { seedDemoData } from '../utils/demoSeeder';
import '../index.css';

interface ModuleHighlight {
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

const ASSISTANT_MODULES: ModuleHighlight[] = [
  {
    id: 'finance',
    badge: 'Finans Radarı',
    badgeEn: 'Finance Radar',
    title: 'Harcama & Bütçe Yönetimi',
    titleEn: 'Expense & Budget Intelligence',
    subtitle: 'Altın, Araç, Bütçe & Fatura',
    subtitleEn: 'Gold, Vehicle, Budget & Bills',
    tagline: 'Tüm gelir, gider, taksit, altın yatırımı, araç masrafları ve faturaları tek noktadan yönetin.',
    taglineEn: 'Manage all incomes, expenses, installments, gold investments, vehicle costs, and bills in one place.',
    icon: FaWallet,
    colorTheme: {
      accent: 'text-emerald-600 dark:text-emerald-400',
      accentBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      bar: 'bg-emerald-500'
    },
    metrics: [
      { label: 'Aylık Net Bakiye', labelEn: 'Monthly Net', value: 'Anlık Hesap' },
      { label: 'Altın & Yatırım', labelEn: 'Gold Assets', value: 'Canlı Kur' },
      { label: 'Araç Takibi', labelEn: 'Vehicle Tracker', value: 'Yakıt & Bakım' }
    ],
    features: [
      { tr: 'Harcamalar & Gelir Girişi', en: 'Expenses & Income Entries' },
      { tr: 'Aylık Bütçe Planlama', en: 'Budget Planner' },
      { tr: 'Altın & Yatırım Takibi', en: 'Gold & Investments' },
      { tr: 'Araç Yakıt & Bakım Takibi', en: 'My Vehicle Tracking' },
      { tr: 'Fatura & Şifre Kasası', en: 'Bills & Passwords' },
      { tr: 'AI PDF Ekstre Okuyucu', en: 'AI Bank Statement PDF Parser' },
      { tr: 'JSON İçe Aktar / Dışa Aktar', en: 'JSON Import/Export' },
      { tr: 'Gelişmiş Raporlama & Grafikler', en: 'Advanced Reports & Charts' },
      { tr: 'Toplu Düzenleme Barı', en: 'Bulk Actions Bar' },
      { tr: 'Blur Filtresi / Gizlilik Modu', en: 'Privacy Blur Mode Toggle' }
    ]
  },
  {
    id: 'media',
    badge: 'Medya Kalesi',
    badgeEn: 'Media Vault',
    title: 'Film, Dizi & Kitap Arşivi',
    titleEn: 'Movies, Series & Books Vault',
    subtitle: 'Akıllı Eğlence Kütüphanesi',
    subtitleEn: 'Entertainment Intelligence',
    tagline: 'IMDb eşitlemeli kütüphane, canlı sezon/bölüm sayaçları ve tekrarlayan kayıt kontrolü.',
    taglineEn: 'IMDb-synced catalog, live season/episode counters, and smart duplicate protection.',
    icon: FaFilm,
    colorTheme: {
      accent: 'text-indigo-600 dark:text-indigo-400',
      accentBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
      pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      bar: 'bg-indigo-500'
    },
    metrics: [
      { label: 'IMDb Eşitleme', labelEn: 'IMDb Sync', value: 'Tek Tık' },
      { label: 'Dizi Sayacı', labelEn: 'Series Tracker', value: 'Canlı Takip' },
      { label: 'Gece Yedeği', labelEn: 'Nightly Backup', value: '00:00 TRT' }
    ],
    features: [
      { tr: 'OMDb & TMDb API Entegrasyonu', en: 'OMDb & TMDb API Sync' },
      { tr: 'Sezon / Bölüm Sayaçları', en: 'Season & Episode Counter' },
      { tr: 'Çift Kayıt Önleme Sistemi', en: 'Duplicate Guard' },
      { tr: 'Kişisel İnceleme & Puanlama', en: 'Custom Reviews & Ratings' },
      { tr: 'Kişisel Okuma / İzleme Listesi', en: 'Personal Watch & Read Lists' },
      { tr: 'IMDb Canlı Veri Çekme', en: 'Live IMDb Data Fetching' },
      { tr: 'Gece Otomatik Veri Yedeği', en: 'Auto Nightly Data Backups' }
    ]
  },
  {
    id: 'planner',
    badge: 'Zaman Planlayıcı',
    badgeEn: 'Time Planner',
    title: 'Takvim & İş Planı',
    titleEn: 'Calendar & Work Plan',
    subtitle: 'Dinamik Ajanda Motoru',
    subtitleEn: 'Dynamic Schedule Hub',
    tagline: 'Vardiyalarınızı, yapılacak işlerinizi, JIRA tasklarını, antrenmanlarınızı ve seyahat planlarınızı tek takvimde buluşturun.',
    taglineEn: 'Unify your shifts, tasks, JIRA tickets, workout routines, and travel schedules in a single interactive calendar.',
    icon: FaCalendarAlt,
    colorTheme: {
      accent: 'text-rose-600 dark:text-rose-400',
      accentBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      bar: 'bg-rose-500'
    },
    metrics: [
      { label: 'Ajanda Görünümü', labelEn: 'Calendar Views', value: 'Gün/Hafta/Ay' },
      { label: 'Jira Entegrasyonu', labelEn: 'Jira Sync', value: 'Kanban Board' },
      { label: 'Galatasaray ICS', labelEn: 'GS Fixture', value: 'Canlı Fikstür' }
    ],
    features: [
      { tr: 'Günlük Görünüm & Zaman Akışı', en: 'Daily View & Hourly Timeline' },
      { tr: 'Haftalık Zaman Planı', en: 'Weekly Timeline' },
      { tr: 'Aylık Takvim Hücreleri', en: 'Monthly Calendar Grid' },
      { tr: 'Jira Görev Entegrasyonu', en: 'Jira Task Board' },
      { tr: 'Esnek Vardiya Şablonları', en: 'Shift Cycle System' },
      { tr: 'Tekrarlayan Seriler Motoru', en: 'Recurring Tasks Engine' },
      { tr: 'Todo / Görev Yöneticisi', en: 'Categorized Todo Lists' },
      { tr: 'Antrenman & Spor Takibi', en: 'Workout & Exercise Logs' },
      { tr: 'Seyahat & Yolculuk Şeritleri', en: 'Travel Banner Overlays' },
      { tr: 'Galatasaray Canlı Fikstürü', en: 'Galatasaray Fixture Sync' }
    ]
  },
  {
    id: 'travel',
    badge: 'İkinci Beyin',
    badgeEn: 'Second Brain',
    title: 'Dünya Haritası & Not Kalesi',
    titleEn: 'World Map & Encrypted Notes',
    subtitle: 'Yaşam Bellek Merkezi',
    subtitleEn: 'Personal Memory Vault',
    tagline: 'Ziyaret ettiğiniz ülkeleri haritada renklendirin, fikirlerinizi şifreli not defterinde saklayın.',
    taglineEn: 'Pin countries and cities on your map, and safeguard your thoughts in your encrypted notebook.',
    icon: FaMapMarkedAlt,
    colorTheme: {
      accent: 'text-sky-600 dark:text-sky-400',
      accentBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800',
      pill: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      bar: 'bg-sky-500'
    },
    metrics: [
      { label: 'Harita Gezisi', labelEn: 'Map Places', value: 'Şehir & Ülke' },
      { label: 'Not Koruması', labelEn: 'Note Security', value: 'Gizli Klasör' },
      { label: 'Yıllık Analiz', labelEn: 'Yearly Recap', value: 'Wrapped' }
    ],
    features: [
      { tr: 'İnteraktif Dünya & Şehir Haritası', en: 'Interactive World Map & Cities' },
      { tr: 'Ziyaret Edilen Ülke Boyama', en: 'Visited Country Highlighter' },
      { tr: 'Şifreli & Zengin Metin Not Defteri', en: 'Encrypted Rich Notes' },
      { tr: 'Kategori & Renk Etiketleri', en: 'Category & Color Tags' },
      { tr: 'PDF, TXT & JSON Dışa Aktar', en: 'PDF, TXT & JSON Export' },
      { tr: 'Yıllık Kişisel Özet (Wrapped)', en: 'Personal Yearly Recap' },
      { tr: 'Güvenli Bulut Senkronizasyonu', en: 'Secure Cloud Sync' }
    ]
  }
];

const SLIDE_DURATION = 14000; // 14 seconds rotation

export default function LoginPage() {
  const { t, language, setLanguage } = useLanguage();
  const isTr = language === 'tr';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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

  // Auto rotate showcase modules with pause on hover
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveModuleIndex((prev) => (prev + 1) % ASSISTANT_MODULES.length);
      setProgressKey((k) => k + 1);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isPaused, activeModuleIndex]);

  const handleSelectModule = (index: number) => {
    setActiveModuleIndex(index);
    setProgressKey((k) => k + 1);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError(isTr ? 'E-posta adresi veya şifre hatalı.' : 'Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError(isTr ? 'Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.' : 'Too many attempts. Please try again later.');
      } else {
        setError(t('auth.loginError') || (isTr ? 'Giriş yapılamadı. Bilgilerinizi kontrol edin.' : 'Could not log in.'));
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
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || '',
          gender: ''
        });
      } else {
        await setDoc(userDocRef, { photoURL: user.photoURL || '' }, { merge: true });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(t('auth.googleError') || (isTr ? 'Google ile giriş yapılamadı.' : 'Google login failed.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const demoEmail = 'demo@emulist.com';
      const demoPassword = 'demouser123';
      
      const result = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      const user = result.user;
      await seedDemoData(user.uid);
      navigate('/');
    } catch (err: any) {
      console.error('Demo Login Error:', err);
      setError(err.code === 'auth/user-not-found' 
        ? (isTr ? 'Demo hesabı bulunamadı. Lütfen yöneticiye danışın.' : 'Demo account not found.') 
        : (t('auth.loginError') || (isTr ? 'Giriş yapılamadı.' : 'Could not log in.')));
    } finally {
      setLoading(false);
    }
  };

  const activeModule = ASSISTANT_MODULES[activeModuleIndex];
  const IconComponent = activeModule.icon;

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300 relative overflow-hidden">
      
      {/* Soft Ambient Mesh Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 dark:from-indigo-500/15 dark:to-emerald-500/10 blur-[130px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-rose-500/10 to-sky-500/10 dark:from-rose-500/10 dark:to-sky-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-60 dark:opacity-60" />
      </div>

      {/* TOP FLOATING NAV */}
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
                {isTr ? 'Kişisel Yaşam Asistanı' : 'Personal Life Assistant'}
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

      {/* MAIN CONTENT SPLIT */}
      <div className="w-full flex flex-col lg:flex-row min-h-screen relative z-10 pt-20 lg:pt-0">
        
        {/* ================= LEFT COLUMN: AUTHENTICATION FORM ================= */}
        <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-center px-6 sm:px-12 lg:px-14 xl:px-18 py-8 lg:py-14">
          <div className="w-full max-w-md mx-auto space-y-6">
            
            {/* Form Title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/50 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                <FaBrain className="text-xs" />
                <span>{isTr ? 'Kişisel Hafıza Merkezi' : 'Personal Memory Hub'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {isTr ? 'Asistanınıza Bağlanın' : 'Connect to Assistant'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                {isTr 
                  ? 'Finans, medya arşivi, takvim, notlar ve seyahat hafızanız tek noktada.' 
                  : 'Finances, media vault, shifts, travel and encrypted notes in one place.'}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5 pt-1">
              
              {/* Unified Input Group Container */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  {isTr ? 'Giriş Bilgileri' : 'Credentials'}
                </label>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10">
                  {/* Email Input */}
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isTr ? 'E-posta Adresi' : 'Email Address'}
                      className="w-full px-4 py-3.5 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  
                  {/* Separator Line */}
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800/60" />
                  
                  {/* Password Input with Animated Eye */}
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      placeholder={isTr ? 'Şifre' : 'Password'}
                      className="w-full pl-4 pr-12 py-3.5 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 font-medium"
                    />

                    {/* Animated Eye Button */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? (isTr ? 'Şifreyi Gizle' : 'Hide Password') : (isTr ? 'Şifreyi Göster' : 'Show Password')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <svg 
                        width="18" 
                        height="18" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                        className="transition-transform duration-300"
                        style={{
                          transform: (!showPassword && isPasswordFocused) ? 'scaleY(0.35)' : 'scaleY(1)',
                          transformOrigin: 'center'
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
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end px-1">
                <Link 
                  to="/sifremi-unuttum" 
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  {isTr ? 'Şifremi Unuttum?' : 'Forgot Password?'}
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isTr ? 'Sisteme Bağlan' : 'Connect to System'}</span>
                    <FaArrowRight className="text-xs" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="py-1 flex items-center gap-3 opacity-40">
                <div className="h-[1px] flex-grow bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {isTr ? 'veya' : 'or'}
                </span>
                <div className="h-[1px] flex-grow bg-slate-200 dark:bg-slate-800"></div>
              </div>

              {/* Google Login & Demo Mode Buttons Row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loading || googleLoading}
                  onClick={handleGoogleLogin}
                  className="py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-250 font-bold text-xs rounded-2xl transition-all shadow-3xs active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FaGoogle className="text-rose-500 text-xs" />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading || googleLoading}
                  className="py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-250 font-bold text-xs rounded-2xl transition-all shadow-3xs active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FaPlay className="text-indigo-500 text-[10px]" />
                  <span>{isTr ? 'Demo Modu' : 'Demo Mode'}</span>
                </button>
              </div>

              {/* Signup Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isTr ? 'Hesabınız yok mu? ' : "Don't have an account? "}
                  <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                    {isTr ? 'Hemen Kayıt Olun' : 'Sign Up Now'}
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
          {/* Top Showcase Bar */}
          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs">
                  <FaShieldAlt />
                </span>
                <span className="text-xs font-mono font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                  {isTr ? 'B12 Kişisel Asistan Yetenekleri' : 'B12 Assistant Capabilities'}
                </span>
              </div>

              {/* Pause / Countdown indicator */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {isPaused && (
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold bg-amber-100/80 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    <FaPause size={8} /> {isTr ? 'Okuma Duraklatıldı' : 'Paused'}
                  </span>
                )}
                <span>{activeModuleIndex + 1} / {ASSISTANT_MODULES.length}</span>
              </div>
            </div>

            {/* Module Pills Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {ASSISTANT_MODULES.map((m, idx) => {
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

                {/* Header of Active Module */}
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

                {/* Metrics */}
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

                {/* Feature Highlights */}
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

          {/* Footer Bar */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isTr ? 'GÜVENLİ VE ŞİFRELİ BULUT ALTYAPISI' : 'ENCRYPTED SECURE CLOUD'}</span>
            </div>
            <span>B12 // PERSONAL OS & ASSISTANT</span>
          </div>

        </div>

      </div>
    </div>
  );
}