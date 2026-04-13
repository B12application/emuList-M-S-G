import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../../backend/config/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaGoogle, FaArrowLeft } from 'react-icons/fa';
import '../index.css';

export default function LoginPage() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(t('auth.loginError') || 'Giriş yapılamadı.');
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
      setError(t('auth.googleError') || 'Google ile giriş başarısız.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* MOBILE-ONLY TOP HEADER */}
      <div className="lg:hidden absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold tracking-widest font-[Orbitron]">B12</h1>
        <div className="flex items-center gap-5">
            <button onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')} className="text-sm font-semibold uppercase opacity-60 hover:opacity-100 transition-opacity">{language}</button>
            <Link to="/" className="text-xl opacity-60 hover:opacity-100 transition-opacity"><FaArrowLeft /></Link>
        </div>
      </div>

      {/* LEFT SIDE - FORM CONTENT */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-16 lg:p-24 relative z-10 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden lg:flex w-full justify-between items-center absolute top-12 left-12 right-12 pr-24">
          <Link to="/" className="flex items-center gap-3 text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity"><FaArrowLeft /> {t('common.back') || 'Geri'}</Link>
          <div className="flex gap-4">
            <button onClick={() => setLanguage('tr')} className={`text-sm font-semibold uppercase transition-opacity ${language === 'tr' ? 'opacity-100 text-neutral-500' : 'opacity-40 hover:opacity-100'}`}>TR</button>
            <button onClick={() => setLanguage('en')} className={`text-sm font-semibold uppercase transition-opacity ${language === 'en' ? 'opacity-100 text-neutral-500' : 'opacity-40 hover:opacity-100'}`}>EN</button>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto mt-16 md:mt-0 pt-10 sm:pt-0 pb-10 animate-fade-in-up">
          <div className="mb-10 space-y-2">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{t('auth.login') || 'Giriş Yap'}</h3>
            <p className="text-sm font-medium opacity-60">
              {t('auth.dontHaveAccount') || 'Hesabınız yok mu?'} <Link to="/signup" className="underline underline-offset-4 hover:opacity-100 opacity-80 transition-opacity">{t('auth.signup') || 'Kayıt Ol'}</Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 opacity-80">{t('auth.email') || 'E-posta adresi'}</label>
              <input
                id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-black/20 dark:border-white/20 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:border-black dark:focus:border-white focus:outline-none py-2 transition-colors text-base"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5 opacity-80">{t('auth.password') || 'Şifre'}</label>
              <input
                id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-black/20 dark:border-white/20 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:border-black dark:focus:border-white focus:outline-none py-2 transition-colors text-base"
                placeholder="••••••"
              />
            </div>
            
            <div className="flex justify-between items-center py-2">
                <Link to="/sifremi-unuttum" className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">Şifremi Unuttum</Link>
            </div>

            {error && (<div className="py-2 text-red-500 text-sm font-medium">{error}</div>)}

            <button type="submit" disabled={loading || googleLoading}
              className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 rounded-[4px]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-current rounded-full animate-spin"></div>
                  {t('auth.signingIn') || 'Giriş Yapılıyor'}
                </div>
              ) : (t('auth.login') || 'Giriş Yap')}
            </button>

            <div className="py-2 flex items-center gap-4 opacity-30">
              <div className="h-[1px] flex-grow bg-current"></div>
              <span className="text-xs font-semibold">{t('auth.or') || 'Veya'}</span>
              <div className="h-[1px] flex-grow bg-current"></div>
            </div>

            <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3.5 border border-black dark:border-white flex justify-center items-center gap-2 font-semibold text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-[4px] group"
              >
                <FaGoogle className="text-base" /> Google ile Devam Et
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE - VISUAL (DESKTOP ONLY) */}
      <div className="hidden lg:flex flex-col lg:w-1/2 relative bg-zinc-50 dark:bg-zinc-900 overflow-hidden items-center justify-center border-l border-black/5 dark:border-white/5 p-12">
        <div className="absolute inset-0">
          <img src="/auth-bg.png" alt="Atmosphere" className="w-full h-full object-cover opacity-[0.15] dark:opacity-[0.05] grayscale mix-blend-multiply dark:mix-blend-screen" />
        </div>
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-black dark:border-white rounded-full flex items-center justify-center mb-6">
            <span className="font-bold font-[Orbitron] tracking-wider">B12</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Emu Sport App ile <br/>
            <span className="opacity-50">Sürecinizi Takip Edin</span>
          </h2>
          <div className="w-8 h-1 bg-black/20 dark:bg-white/20 my-6 rounded-full"></div>
          <p className="font-medium text-sm text-neutral-500 uppercase tracking-widest">Mustafa Ulusoy</p>
        </div>
      </div>
    </div>
  );
}