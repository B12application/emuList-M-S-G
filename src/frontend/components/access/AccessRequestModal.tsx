// src/frontend/components/access/AccessRequestModal.tsx
// Kullanıcıların kilitli özellikler veya AI yetkisi için EMU'ya talep gönderebileceği standart modal

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPaperPlane, FaEnvelope, FaRobot, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { createAccessRequest } from '../../services/accessRequestService';
import type { FeatureKey } from '../../services/featureAccessService';
import toast from 'react-hot-toast';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureKey: FeatureKey | 'general';
  featureTitle: string;
  featureDescription?: string;
  onSuccess?: () => void;
}

export default function AccessRequestModal({
  isOpen,
  onClose,
  featureKey,
  featureTitle,
  featureDescription,
  onSuccess
}: AccessRequestModalProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isTr = language === 'tr';

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(isTr ? 'Lütfen önce giriş yapın.' : 'Please sign in first.');
      return;
    }

    setSubmitting(true);
    try {
      await createAccessRequest({
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
        featureKey,
        featureLabel: featureTitle,
        message: message.trim()
      });

      setSubmitted(true);
      toast.success(
        isTr
          ? 'Erişim talebiniz EMU’ya iletildi! İncelendikten sonra özelliğiniz açılacaktır.'
          : 'Access request sent to EMU! Your feature will be unlocked upon review.'
      );
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2000);
    } catch (err: any) {
      console.error('Talep gönderme hatası:', err);
      toast.error(isTr ? 'Talep gönderilemedi. Lütfen doğrudan e-posta atın.' : 'Failed to send request. Please email directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const mailSubject = encodeURIComponent(`B12 Erişim Talebi: ${featureTitle} (${user?.email || ''})`);
  const mailBody = encodeURIComponent(
    `Merhaba Mustafa (EMU),\n\nB12 platformundaki "${featureTitle}" özelliğini hesabımda aktif etmeni rica ediyorum.\n\nKullanıcı: ${user?.displayName || ''}\nE-posta: ${user?.email || ''}\nMesajım: ${message || 'Erişim izni talep ediyorum.'}`
  );
  const directMailUrl = `mailto:emuwhilist@gmail.com?subject=${mailSubject}&body=${mailBody}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                <FaRobot />
              </div>
              <div>
                <h3 className="font-black text-sm text-stone-900 dark:text-white">
                  {isTr ? 'Erişim & İletişim Talebi' : 'Access & Feature Request'}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  {isTr ? 'Geliştirici: Mustafa Ulusoy (EMU)' : 'Developer: Mustafa Ulusoy (EMU)'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="max-h-[75vh] overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
            {/* Feature Target Box */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-850 border border-stone-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                {isTr ? 'Talep Edilen Özellik' : 'Requested Feature'}
              </span>
              <h4 className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                {featureTitle}
              </h4>
              {featureDescription && (
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {featureDescription}
                </p>
              )}
            </div>

            {/* User Account Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-950/60 border border-stone-200/80 dark:border-zinc-800">
                <div className="text-[10px] text-stone-400 dark:text-zinc-500 font-medium">
                  {isTr ? 'Hesap' : 'Account'}
                </div>
                <div className="font-bold text-stone-800 dark:text-zinc-200 truncate mt-0.5">
                  {user?.displayName || isTr ? 'Kullanıcı' : 'User'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-950/60 border border-stone-200/80 dark:border-zinc-800">
                <div className="text-[10px] text-stone-400 dark:text-zinc-500 font-medium">
                  {isTr ? 'E-posta' : 'Email'}
                </div>
                <div className="font-bold text-stone-800 dark:text-zinc-200 truncate mt-0.5">
                  {user?.email || ''}
                </div>
              </div>
            </div>

            {/* Note/Message Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-zinc-300">
                {isTr ? 'EMU’ya İletmek İstediğiniz Not (İsteğe Bağlı)' : 'Note for EMU (Optional)'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder={
                  isTr
                    ? 'Merhaba EMU, bu özelliği hesabımda aktif edebilir misin? Teşekkürler...'
                    : 'Hello EMU, could you please enable this feature for my account? Thank you...'
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-white text-xs placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
              />
            </div>

            {/* Direct Mail Option info */}
            <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FaEnvelope className="text-indigo-600 dark:text-indigo-400 text-sm shrink-0" />
                <div className="text-[11px] text-stone-600 dark:text-zinc-300 truncate">
                  <span className="font-bold">E-posta:</span> emuwhilist@gmail.com
                </div>
              </div>
              <a
                href={directMailUrl}
                className="px-3 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded-xl shrink-0 transition-colors"
              >
                {isTr ? 'Doğrudan Mail At' : 'Direct Email'}
              </a>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/80 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              {isTr ? 'Vazgeç' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || submitted}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin text-xs" />
                  <span>{isTr ? 'Gönderiliyor...' : 'Sending...'}</span>
                </>
              ) : submitted ? (
                <>
                  <FaCheckCircle className="text-xs text-emerald-800" />
                  <span>{isTr ? 'Talebiniz Alındı!' : 'Request Sent!'}</span>
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-xs" />
                  <span>{isTr ? 'Talebi EMU’ya İlet' : 'Send Request to EMU'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
