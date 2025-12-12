import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { FaGoogle, FaArrowLeft } from 'react-icons/fa';
import '../index.css';

export default function SignupPage() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !surname) {
      setError(t('auth.nameRequired') || 'İsim ve soyisim gerekli.'); return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch') || 'Şifreler uyuşmuyor.'); return;
    }
    if (!gender) {
      setError(t('auth.genderRequired') || 'Cinsiyet seçimi gerekli.'); return;
    }

    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${name} ${surname}`
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: `${name} ${surname}`,
        gender: gender
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse') || 'Bu e-posta kullanımda.');
      } else if (err.code === 'auth/weak-password') {
        setError(t('auth.weakPassword') || 'Şifre çok zayıf.');
      } else {
        setError(t('auth.signupError') || 'Kayıt olurken hata oluştu.');
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
          gender: '',
          visitedProvinces: []
        });
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
    <div className="flex h-screen w-full items-center justify-center bg-stone-950 font-sans relative overflow-hidden">

      {/* Page Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/auth-bg.png"
          alt="Background"
          className="w-full h-full object-cover blur-md scale-105 opacity-40"
        />
        <div className="absolute inset-0 bg-stone-950/70"></div>
      </div>

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-5xl h-[85vh] max-h-[800px] bg-stone-950 rounded-3xl shadow-2xl overflow-hidden flex border border-white/5 animate-fade-in-up mx-4">

        {/* LEFT SIDE - VISUAL */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-stone-900">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/auth-bg.png"
              alt="Library Atmosphere"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-stone-900/40 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Branding (Top Left) */}
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-widest text-white font-[Orbitron] drop-shadow-lg">
              EMU
            </h1>
          </div>

          {/* Back Link (Top Right) */}
          <div className="absolute top-12 right-12 z-10">
            <Link to="/" className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all text-sm font-medium text-white/90 hover:text-white">
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> {t('common.back') || 'Geri Dön'}
            </Link>
          </div>

          {/* Caption (Bottom) */}
          <div className="relative z-10 max-w-lg mb-12">
            <h2 className="text-4xl font-bold leading-tight mb-6 drop-shadow-xl text-white">
              Capturing Moments,<br />
              <span className="text-amber-400">Creating Memories</span>
            </h2>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 bg-stone-950 relative overflow-y-auto">
          {/* Mobile Branding */}
          <div className="lg:hidden absolute top-8 left-8">
            <h1 className="text-2xl font-black tracking-widest text-white font-[Orbitron]">EMU</h1>
          </div>
          <div className="lg:hidden absolute top-8 right-8">
            <Link to="/" className="text-stone-400 hover:text-white"><FaArrowLeft /></Link>
          </div>

          {/* Language Switcher (Absolute Top Right for Desktop, relative for Mobile) */}
          <div className="absolute top-8 right-8 hidden lg:flex gap-2">
            <button onClick={() => setLanguage('tr')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${language === 'tr' ? 'bg-amber-500 text-stone-900' : 'bg-stone-800 text-stone-400 hover:text-white'}`}>TR</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-amber-500 text-stone-900' : 'bg-stone-800 text-stone-400 hover:text-white'}`}>EN</button>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="text-center lg:text-left">
              <h3 className="text-3xl font-bold text-white mb-2">{t('auth.signup')}</h3>
              <p className="text-stone-400 text-sm">
                {t('auth.alreadyHaveAccount')} <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors hover:underline underline-offset-4">{t('auth.login')}</Link>
              </p>
            </div>

            <form className="space-y-4 mt-6" onSubmit={handleSignup}>
              <div className="grid grid-cols-2 gap-3">
                <div className="group">
                  <label htmlFor="name" className="block text-xs font-medium text-stone-400 mb-1 ml-1 transition-colors group-focus-within:text-amber-500">{t('profile.name')}</label>
                  <input
                    id="name" type="text" required value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder-stone-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-hidden transition-all text-sm"
                    placeholder="John"
                  />
                </div>
                <div className="group">
                  <label htmlFor="surname" className="block text-xs font-medium text-stone-400 mb-1 ml-1 transition-colors group-focus-within:text-amber-500">{t('profile.surname')}</label>
                  <input
                    id="surname" type="text" required value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder-stone-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-hidden transition-all text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="group">
                <label htmlFor="email" className="block text-xs font-medium text-stone-400 mb-1 ml-1 transition-colors group-focus-within:text-amber-500">{t('auth.email')}</label>
                <input
                  id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder-stone-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-hidden transition-all text-sm"
                  placeholder="name@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group">
                  <label htmlFor="password" className="block text-xs font-medium text-stone-400 mb-1 ml-1 transition-colors group-focus-within:text-amber-500">{t('auth.password')}</label>
                  <input
                    id="password" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder-stone-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-hidden transition-all text-sm"
                    placeholder="••••••"
                  />
                </div>
                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-stone-400 mb-1 ml-1 transition-colors group-focus-within:text-amber-500">{t('auth.confirmPassword')}</label>
                  <input
                    id="confirmPassword" type="password" required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder-stone-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-hidden transition-all text-sm"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-medium text-stone-400 mb-2 ml-1">{t('profile.gender')}</label>
                <div className="flex gap-4">
                  <label className={`flex items-center justify-center w-full px-4 py-3 rounded-xl border cursor-pointer transition-all ${gender === 'male' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-700'}`}>
                    <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} className="hidden" />
                    <span className="font-medium text-sm">{t('profile.male')}</span>
                  </label>
                  <label className={`flex items-center justify-center w-full px-4 py-3 rounded-xl border cursor-pointer transition-all ${gender === 'female' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-700'}`}>
                    <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} className="hidden" />
                    <span className="font-medium text-sm">{t('profile.female')}</span>
                  </label>
                </div>
              </div>

              {error && (<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium animate-pulse">{error}</div>)}

              <button type="submit" disabled={loading || googleLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('auth.signingUp')}
                  </div>
                ) : t('auth.signup')}
              </button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-800"></div></div>
                <div className="relative flex justify-center text-xs"><span className="px-4 bg-stone-950 text-stone-500">{t('auth.or')}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loading || googleLoading}
                  onClick={handleGoogleLogin}
                  className="flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold transition-all hover:border-stone-700 text-sm"
                >
                  <FaGoogle className="text-lg" /> Google
                </button>
                <button type="button" disabled className="flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 opacity-50 cursor-not-allowed text-stone-500 font-semibold grayscale text-sm">
                  Apple
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}