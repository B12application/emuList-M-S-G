import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { FaArrowLeft, FaEnvelope, FaKey, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import '../index.css';

export default function ForgotPasswordPage() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
    } catch (err: any) {
      console.error(err);
      setError(t('auth.passwordResetError') || 'Şifre sıfırlama e-postası gönderilemedi. Lütfen adresi kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-stone-50 dark:bg-black text-black dark:text-white font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      {/* HEADER / NAVIGATION */}
      <div className="absolute top-0 w-full p-6 md:p-10 flex justify-between items-center z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Link to="/login" className="p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm hover:shadow-md active:scale-95">
            <FaArrowLeft />
          </Link>
          <span className="hidden md:block text-sm font-bold tracking-widest font-[Orbitron] text-emerald-600 dark:text-emerald-400">B12 SYSTEM</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="flex bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-1 rounded-full border border-stone-200 dark:border-zinc-800 shadow-sm">
            <button onClick={() => setLanguage('tr')} className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'tr' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'}`}>TR</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'en' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'}`}>EN</button>
          </div>
        </motion.div>
      </div>

      {/* MAIN CONTENT */}
      <main className="w-full flex items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-8 md:p-10 rounded-[32px] border border-stone-200/50 dark:border-zinc-800/50 shadow-2xl shadow-emerald-500/5">
            
            <AnimatePresence mode="wait">
              {!isSent ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-3">
                    <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-2">
                      <FaKey size={24} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
                      Şifremi Unuttum
                    </h1>
                    <p className="text-stone-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                      Sorun değil, e-posta adresinizi girin ve size bir kurtarma bağlantısı gönderelim.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 ml-1">
                        E-posta Adresi
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors">
                          <FaEnvelope size={18} />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ornek@mail.com"
                          className="w-full pl-12 pr-4 py-4 bg-stone-100 dark:bg-zinc-800/50 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl outline-none transition-all text-stone-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium border border-rose-100 dark:border-rose-900/30"
                      >
                        <FaExclamationCircle className="flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            İşleniyor...
                          </>
                        ) : (
                          'Sıfırlama Bağlantısı Gönder'
                        )}
                      </span>
                      <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-sm text-stone-500 dark:text-zinc-500 font-medium">
                      Hatırladınız mı? <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline underline-offset-4 decoration-2">Giriş Yap</Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-4"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="inline-flex p-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full mb-2"
                  >
                    <FaCheckCircle size={48} />
                  </motion.div>
                  
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-stone-900 dark:text-white">Kontrol Edin!</h2>
                    <p className="text-stone-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{email}</span> adresine bir bağlantı gönderdik. Lütfen gelen kutunuzu kontrol edin.
                    </p>
                  </div>

                  <div className="pt-4 space-y-4">
                    <Link
                      to="/login"
                      className="inline-flex w-full justify-center py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                    >
                      Giriş Sayfasına Dön
                    </Link>
                    <button 
                      onClick={() => setIsSent(false)}
                      className="text-sm font-bold text-stone-400 dark:text-zinc-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                    >
                      E-postayı yanlış mı girdiniz? Tekrar deneyin.
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          
          <p className="text-center mt-10 text-[10px] font-bold tracking-[0.2em] text-stone-400 dark:text-zinc-600 uppercase">
            © {new Date().getFullYear()} B12 Sport Ecosystem
          </p>
        </motion.div>
      </main>
    </div>
  );
}
