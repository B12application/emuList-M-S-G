import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { FaArrowLeft } from 'react-icons/fa';
import '../index.css';

export default function ForgotPasswordPage() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(t('auth.passwordResetSuccess') || 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve spam klasörünüzü) kontrol edin.');
    } catch (err: any) {
      console.error(err);
      setError(t('auth.passwordResetError') || 'Şifre sıfırlama e-postası gönderilemedi. Lütfen adresi kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* MOBILE-ONLY TOP HEADER */}
      <div className="lg:hidden absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold tracking-widest font-[Orbitron]">B12</h1>
        <div className="flex items-center gap-5">
            <button onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')} className="text-sm font-semibold uppercase opacity-60 hover:opacity-100 transition-opacity">{language}</button>
            <Link to="/login" className="text-xl opacity-60 hover:opacity-100 transition-opacity"><FaArrowLeft /></Link>
        </div>
      </div>

      {/* LEFT SIDE - FORM CONTENT */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-16 lg:p-24 relative z-10 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden lg:flex w-full justify-between items-center absolute top-12 left-12 right-12 pr-24">
          <Link to="/login" className="flex items-center gap-3 text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity"><FaArrowLeft /> {t('common.back') || 'Geri'}</Link>
          <div className="flex gap-4">
            <button onClick={() => setLanguage('tr')} className={`text-sm font-semibold uppercase transition-opacity ${language === 'tr' ? 'opacity-100 text-neutral-500' : 'opacity-40 hover:opacity-100'}`}>TR</button>
            <button onClick={() => setLanguage('en')} className={`text-sm font-semibold uppercase transition-opacity ${language === 'en' ? 'opacity-100 text-neutral-500' : 'opacity-40 hover:opacity-100'}`}>EN</button>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto mt-16 md:mt-0 pt-10 sm:pt-0 pb-10 animate-fade-in-up">
          <div className="mb-10 space-y-2">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Şifremi Unuttum</h3>
            <p className="text-sm font-medium opacity-60">
              Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 opacity-80">{t('auth.email') || 'E-posta adresi'}</label>
              <input
                id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-black/20 dark:border-white/20 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:border-black dark:focus:border-white focus:outline-none py-2 transition-colors text-base"
                placeholder="name@example.com"
              />
            </div>
            
            {message && (<div className="py-2 text-emerald-500 text-sm font-medium">{message}</div>)}
            {error && (<div className="py-2 text-red-500 text-sm font-medium">{error}</div>)}

            <button type="submit" disabled={loading || !email}
              className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 rounded-[4px]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-current rounded-full animate-spin"></div>
                  Gönderiliyor...
                </div>
              ) : 'Şifre Sıfırlama Bağlantısı Gönder'}
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
            Emu Sport App
          </h2>
          <div className="w-8 h-1 bg-black/20 dark:bg-white/20 my-6 rounded-full"></div>
          <p className="font-medium text-sm text-neutral-500 uppercase tracking-widest">Şifre Kurtarma</p>
        </div>
      </div>
    </div>
  );
}
