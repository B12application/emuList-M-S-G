import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { 
  FaArrowLeft, 
  FaKey, 
  FaLock, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaShieldAlt, 
  FaArrowRight 
} from 'react-icons/fa';
import '../index.css';

export default function ResetPasswordPage() {
  const { t, language, setLanguage } = useLanguage();
  const isTr = language === 'tr';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get('oobCode') || '';
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCodeValid, setIsCodeValid] = useState<boolean | null>(null);
  const [codeChecking, setCodeChecking] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth.languageCode = isTr ? 'tr' : 'en';
    if (!oobCode) {
      setIsCodeValid(false);
      setCodeChecking(false);
      setError(isTr ? 'Geçersiz veya eksik şifre sıfırlama kodu.' : 'Invalid or missing action code.');
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setUserEmail(email);
        setIsCodeValid(true);
        setError(null);
      })
      .catch((err) => {
        console.error('Password reset code error:', err);
        setIsCodeValid(false);
        if (err.code === 'auth/expired-action-code') {
          setError(isTr ? 'Bu şifre sıfırlama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı talep edin.' : 'This reset link has expired. Please request a new one.');
        } else if (err.code === 'auth/invalid-action-code') {
          setError(isTr ? 'Bu şifre sıfırlama bağlantısı geçersiz veya daha önce kullanılmış.' : 'This reset link is invalid or already used.');
        } else {
          setError(isTr ? 'Şifre sıfırlama kodu doğrulanamadı.' : 'Action code could not be verified.');
        }
      })
      .finally(() => {
        setCodeChecking(false);
      });
  }, [oobCode, isTr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError(isTr ? 'Şifreniz en az 6 karakter olmalıdır.' : 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isTr ? 'Şifreler birbiriyle eşleşmiyor.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Confirm reset error:', err);
      if (err.code === 'auth/weak-password') {
        setError(isTr ? 'Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.' : 'Password is too weak.');
      } else {
        setError(err.message || (isTr ? 'Şifre güncellenemedi.' : 'Failed to update password.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;
  const pwColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  const pwLabels = isTr
    ? ['', 'Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü']
    : ['', 'Very Weak', 'Weak', 'Fair', 'Strong'];

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300 relative overflow-hidden">
      
      {/* Ambient Lighting */}
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
                {isTr ? 'Şifre Belirleme' : 'Password Reset'}
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
              {codeChecking ? (
                /* 1. Checking Code */
                <motion.div
                  key="checking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 space-y-4 text-center"
                >
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isTr ? 'Bağlantı Doğrulanıyor...' : 'Verifying Link...'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isTr ? 'Güvenlik kodu kontrol ediliyor, lütfen bekleyin.' : 'Checking security authorization code.'}
                  </p>
                </motion.div>
              ) : isSuccess ? (
                /* 2. Success */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 py-2 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto shadow-xs">
                    <FaCheckCircle />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {isTr ? 'Şifreniz Güncellendi!' : 'Password Updated!'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {isTr 
                        ? 'Yeni şifreniz başarıyla kaydedildi. Otomatik olarak giriş sayfasına aktarılıyorsunuz...' 
                        : 'Your new password is saved. Redirecting to login shortly...'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex w-full justify-center py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-600/25 transition-colors"
                    >
                      {isTr ? 'Hemen Giriş Yap' : 'Sign In Now'}
                    </Link>
                  </div>
                </motion.div>
              ) : !isCodeValid ? (
                /* 3. Invalid Code */
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 py-2 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl mx-auto">
                    <FaExclamationCircle />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {isTr ? 'Bağlantı Geçersiz' : 'Invalid Link'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {error || (isTr ? 'Bu şifre sıfırlama linki geçerli değil ya da daha önce kullanılmış.' : 'This reset link has expired or has already been used.')}
                    </p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <Link
                      to="/sifremi-unuttum"
                      className="inline-flex w-full justify-center py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-colors"
                    >
                      {isTr ? 'Yeni Bağlantı Talep Et' : 'Request New Link'}
                    </Link>
                    <Link
                      to="/login"
                      className="inline-block w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      {isTr ? 'Giriş Sayfasına Dön' : 'Back to Sign In'}
                    </Link>
                  </div>
                </motion.div>
              ) : (
                /* 4. Valid Code: Set Password Form */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-2 shadow-xs">
                      <FaKey size={18} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                      {isTr ? 'Yeni Şifre Belirleyin' : 'Set New Password'}
                    </h1>
                    {userEmail && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-white">{userEmail}</span> {isTr ? 'hesabınız için yeni şifrenizi girin.' : 'account.'}
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    
                    {/* New Password */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                        {isTr ? 'Yeni Şifre' : 'New Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <FaLock size={13} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
                          placeholder={isTr ? 'En az 6 karakter' : 'At least 6 characters'}
                          className="w-full pl-9 pr-9 py-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1"
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

                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && (
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

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                        {isTr ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <FaLock size={13} />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={isTr ? 'Şifreyi tekrar girin' : 'Repeat password'}
                          className="w-full pl-9 pr-9 py-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1"
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !newPassword || !confirmPassword}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-sm mt-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{isTr ? 'Şifreyi Güncelle' : 'Update Password'}</span>
                          <FaArrowRight className="text-xs" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-1">
                    <Link to="/login" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors">
                      {isTr ? 'Vazgeç ve Giriş Yap' : 'Cancel and Sign In'}
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          
          <p className="text-center mt-6 text-[11px] text-slate-400 font-mono">
            B12 // AUTH RECOVERY SYSTEM
          </p>
        </div>
      </main>
    </div>
  );
}
