import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { 
  FaArrowLeft, 
  FaEnvelope, 
  FaKey, 
  FaCheckCircle, 
  FaShieldAlt, 
  FaArrowRight 
} from 'react-icons/fa';
import '../index.css';

export default function ForgotPasswordPage() {
  const { t, language, setLanguage } = useLanguage();
  const isTr = language === 'tr';
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      auth.languageCode = isTr ? 'tr' : 'en';
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
      setIsSent(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError(isTr ? 'Bu e-posta adresine kayıtlı kullanıcı bulunamadı.' : 'No user found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError(isTr ? 'Geçersiz bir e-posta adresi.' : 'Invalid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError(isTr ? 'Çok fazla deneme yapıldı. Lütfen bekleyip tekrar deneyin.' : 'Too many attempts. Please wait.');
      } else {
        setError(t('auth.passwordResetError') || (isTr ? 'Sıfırlama e-postası gönderilemedi.' : 'Could not send reset email.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300 relative overflow-hidden">
      
      {/* Soft Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 dark:from-indigo-500/15 dark:to-emerald-500/10 blur-[130px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-purple-500/10 to-sky-500/10 dark:from-purple-500/10 dark:to-sky-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-60 dark:opacity-60" />
      </div>

      {/* Top Floating Nav */}
      <header className="absolute top-0 w-full px-6 py-6 sm:px-10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3.5">
          <Link 
            to="/login" 
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
                {isTr ? 'Şifre Kurtarma' : 'Password Recovery'}
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

      {/* Main Centered Box */}
      <main className="w-full flex items-center justify-center p-6 min-h-screen relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white/90 dark:bg-slate-850 p-8 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-750 shadow-xl space-y-6 backdrop-blur-md">
            
            <AnimatePresence mode="wait">
              {!isSent ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-3 shadow-xs">
                      <FaKey size={18} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                      {isTr ? 'Şifremi Unuttum' : 'Forgot Password'}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                      {isTr 
                        ? 'E-posta adresinizi girin, güvenli şifre sıfırlama bağlantısını anında iletelim.' 
                        : 'Enter your email address to receive a secure password reset link.'}
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                        {isTr ? 'E-Posta Adresi' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <FaEnvelope size={14} />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-2xl outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400 font-medium"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-sm mt-1"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{isTr ? 'Sıfırlama Bağlantısı Gönder' : 'Send Reset Link'}</span>
                          <FaArrowRight className="text-xs" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-1">
                    <Link to="/login" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors">
                      {isTr ? '← Giriş Sayfasına Dön' : '← Back to Sign In'}
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-5 py-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto shadow-xs">
                    <FaCheckCircle />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {isTr ? 'E-postanızı Kontrol Edin' : 'Check Your Email'}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                      <span className="font-semibold text-slate-900 dark:text-white">{email}</span> {isTr ? 'adresine şifre sıfırlama bağlantısı gönderildi.' : 'has been sent a password reset link.'}
                    </p>
                  </div>

                  <div className="pt-3 space-y-2">
                    <Link
                      to="/login"
                      className="inline-flex w-full justify-center py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-colors"
                    >
                      {isTr ? 'Giriş Sayfasına Dön' : 'Return to Login'}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsSent(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {isTr ? 'Farklı bir e-posta dene' : 'Try another email'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          
          <p className="text-center mt-6 text-[11px] text-slate-400 font-mono">
            B12 // SECURITY & RECOVERY ENGINE
          </p>
        </div>
      </main>
    </div>
  );
}
