// src/pages/SignupPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 1. YENİ: Gerekli tüm importlar
import { 
  createUserWithEmailAndPassword, 
  updateProfile, // Profili (Ad/Soyad) güncellemek için
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; 
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import LoginPanda from '../components/LoginPanda';
import { useAuth } from '../context/AuthContext';
import { FaGoogle } from 'react-icons/fa';
import '../index.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // YENİ
  const [name, setName] = useState(''); // YENİ
  const [surname, setSurname] = useState(''); // YENİ
  const [gender, setGender] = useState<'male' | 'female' | ''>(''); 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(true); // Panda state'i
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/');
    return null;
  }

  // E-posta ile Kayıt
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // 2. YENİ: Validasyon (Kontroller)
    if (!name || !surname) {
      setError("Ad ve Soyad alanları zorunludur."); return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler uyuşmuyor."); return;
    }
    if (!gender) {
      setError("Lütfen cinsiyetinizi seçin."); return;
    }

    setLoading(true);
    setError(null);
    try {
      // 3. Auth'a kaydet
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 4. YENİ: Auth profiline Ad/Soyad ekle
      await updateProfile(user, {
        displayName: `${name} ${surname}`
      });

      // 5. Firestore 'users' koleksiyonuna kaydet
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: `${name} ${surname}`,
        gender: gender
      });

      navigate('/'); 
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Bu e-posta adresi zaten kullanımda.");
      } else if (err.code === 'auth/weak-password') {
        setError("Şifre çok zayıf. En az 6 karakter olmalı.");
      } else {
        setError("Kayıt sırasında bir hata oluştu.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google ile Kayıt (Login ile aynı)
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
          displayName: user.displayName, // Google'dan gelen adı al
          gender: '',
          visitedProvinces: []
        });
      }
      navigate('/');
    } catch (err: any) {
      setError("Google ile kayıt olunamadı.");
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
            Kayıt Ol
          </h2>
          
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            
            {/* 6. YENİ: Ad ve Soyad Alanları */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ad</label>
                <input id="name" type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setIsWatching(true)}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="surname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Soyad</label>
                <input id="surname" type="text" required value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  onFocus={() => setIsWatching(true)}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-posta</label>
              <input id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsWatching(true)}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şifre (En az 6 karakter)</label>
              <input id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsWatching(false)}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            
            {/* 7. YENİ: Şifre Tekrarı Alanı */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şifre Tekrar</label>
              <input id="confirmPassword" type="password" required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setIsWatching(false)}
                className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>

            {/* Cinsiyet Seçimi (Değişmedi) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cinsiyet</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name="gender" value="male" 
                    checked={gender === 'male'} onChange={() => setGender('male')}
                    className="h-4 w-4 text-sky-600 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Erkek</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="gender" value="female" 
                    checked={gender === 'female'} onChange={() => setGender('female')}
                    className="h-4 w-4 text-sky-600 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Kadın</span>
                </label>
              </div>
            </div>

            {error && (<p className="text-center text-sm text-red-500">{error}</p>)}

            <div>
              <button type="submit" disabled={loading || googleLoading}
                className="w-full px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-lg hover:bg-sky-700 transition disabled:opacity-50">
                {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
              </button>
            </div>
            
            {/* 8. YENİ: "veya" ayıracı ve Google Butonu */}
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
                {googleLoading ? "Yönlendiriliyor..." : "Google ile Kayıt Ol"}
              </button>
            </div>
            
            <div className="text-sm text-center">
              <Link to="/login" className="font-medium text-sky-600 hover:text-sky-500">
                Zaten hesabın var mı? Giriş Yap
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}