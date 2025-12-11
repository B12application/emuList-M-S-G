// src/pages/LoginPage.tsx
import { useState } from 'react';
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
import LoginPanda from '../components/LoginPanda';
import { FaGoogle } from 'react-icons/fa';
import '../index.css';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(t('auth.loginError'));
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
          gender: ''
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(t('auth.googleError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen py-12 px-4 overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Floating Stars Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
        {/* Shooting Stars */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`shoot-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-shoot"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${i * 5}s`
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md space-y-8 z-10">

        <LoginPanda isWatching={isWatching} />

        <div className="bg-gray-900/40 backdrop-blur-md p-8 shadow-2xl rounded-2xl border border-gray-700/50">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white mb-8">
            {t('auth.login')}
          </h2>

          <form className="mt-6 space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">{t('auth.email')}</label>
              <input
                id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsWatching(true)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">{t('auth.password')}</label>
              <input
                id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsWatching(false)}
                onBlur={() => setIsWatching(true)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (<p className="text-center text-sm text-red-400 bg-red-900/20 py-2 px-4 rounded-lg border border-red-800/30">{error}</p>)}

            <div>
              <button type="submit" disabled={loading || googleLoading}
                className="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:hover:shadow-none">
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </button>
            </div>

            <div className="relative flex items-center justify-center my-6">
              <span className="absolute inset-x-0 h-px bg-gray-700"></span>
              <span className="relative bg-gray-900 px-4 text-sm text-gray-400">
                {t('auth.or')}
              </span>
            </div>
            <div>
              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center gap-3 px-6 py-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-white font-semibold transition-all disabled:opacity-50"
              >
                <FaGoogle className="text-red-400" />
                {googleLoading ? t('auth.redirecting') : t('auth.googleLogin')}
              </button>
            </div>

            <div className="text-sm text-center space-y-3 mt-6">
              <Link to="/signup" className="block text-gray-300 hover:text-white transition font-medium">
                {t('auth.dontHaveAccount')} <span className="text-blue-400 hover:text-blue-300">{t('auth.signup')}</span>
              </Link>
              <Link to="/sifremi-unuttum" className="block text-gray-500 hover:text-gray-400 transition text-xs">
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}