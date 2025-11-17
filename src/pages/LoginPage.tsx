// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 1. YENİ: Google girişi için gerekli import'lar eklendi
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; // db import edildi
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Firestore kontrolü için import edildi
import { useAuth } from '../context/AuthContext';
import LoginPanda from '../components/LoginPanda'; 
import { FaGoogle } from 'react-icons/fa'; // Google ikonu
import '../index.css'; 

export default function LoginPage() {
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

  // E-posta ile giriş
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); 
    } catch (err: any) {
      setError("E-posta veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  // 2. YENİ: Google ile Giriş Fonksiyonu
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ÖNEMLİ: Google ile ilk kez mi giriş yapıyor?
      // Firestore 'users' koleksiyonunda kaydı var mı diye kontrol et.
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Kaydı yoksa, Firestore'a temel bilgilerini (cinsiyet olmadan) ekle
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          gender: '' // Cinsiyet daha sonra profilden ayarlanabilir
        });
      }
      navigate('/'); // Giriş başarılı
    } catch (err: any) {
      setError("Google ile giriş yapılamadı.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen py-12 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6">
        
        <LoginPanda isWatching={isWatching} />
        
        <div className="bg-white dark:bg-gray-800 p-8 shadow-2xl rounded-2xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Giriş Yap
          </h2>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {/* ... (E-posta ve Şifre alanları aynı) ... */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-posta</label>
              <input
                id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsWatching(true)}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şifre</label>
              <input
                id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsWatching(false)}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>

            {error && (<p className="text-center text-sm text-red-500">{error}</p>)}

            <div>
              <button type="submit" disabled={loading || googleLoading}
                className="w-full px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-lg hover:bg-sky-700 transition disabled:opacity-50">
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </div>

            {/* 3. YENİ: "veya" ayıracı ve Google Butonu */}
            <div className="relative flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-gray-300 dark:bg-gray-600"></span>
              <span className="relative bg-white dark:bg-gray-800 px-4 text-sm text-gray-500">
                veya
              </span>
            </div>
            <div>
              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center gap-3 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                <FaGoogle className="text-red-500" />
                {googleLoading ? "Yönlendiriliyor..." : "Google ile Giriş Yap"}
              </button>
            </div>
            
            <div className="text-sm text-center">
              <Link to="/signup" className="font-medium text-sky-600 hover:text-sky-500">
                Hesabın yok mu? Kayıt Ol
              </Link>
            </div>
            <div className="text-sm text-center">
              <Link to="/sifremi-unuttum" className="font-medium text-gray-500 hover:text-gray-400">
                Şifremi unuttum
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}