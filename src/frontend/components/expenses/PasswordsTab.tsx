import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { FaKey, FaPlus, FaTimes, FaEdit, FaTrash, FaEye, FaEyeSlash, FaCopy, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../../backend/config/firebaseConfig';
import { useAppSound } from '../../context/SoundContext';
import ConfirmDialog from '../ui/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';

const COLLECTION = 'familyPasswords';

interface PasswordItem {
  id: string;
  userId: string;
  title: string;
  details: string;
  passwordValue: string;
}

export default function PasswordsTab() {
  const { user } = useAuth();
  const { playPop, playSuccess } = useAppSound();
  
  const [items, setItems] = useState<PasswordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PasswordItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({ title: '', details: '', passwordValue: '' });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    const fetchItems = async () => {
      try {
        const q = query(collection(db, COLLECTION), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PasswordItem));
        data.sort((a, b) => a.title.localeCompare(b.title));
        setItems(data);
      } catch (err) {
        console.error('Failed to load passwords', err);
        toast.error('Şifreler yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [user?.uid]);

  const handleOpenAdd = () => {
    setForm({ title: '', details: '', passwordValue: '' });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PasswordItem) => {
    setForm({ title: item.title, details: item.details || '', passwordValue: item.passwordValue || '' });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !form.title.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        userId: user.uid,
        title: form.title.trim(),
        details: form.details.trim(),
        passwordValue: form.passwordValue.trim()
      };

      if (editingItem) {
        await updateDoc(doc(db, COLLECTION, editingItem.id), payload);
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...payload } : i));
        toast.success('Güncellendi');
      } else {
        const d = await addDoc(collection(db, COLLECTION), payload);
        setItems([...items, { id: d.id, ...payload }].sort((a, b) => a.title.localeCompare(b.title)));
        toast.success('Kaydedildi');
      }
      playSuccess();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, COLLECTION, deleteId));
      setItems(items.filter(i => i.id !== deleteId));
      playPop();
      toast.success('Silindi');
    } catch (err) {
      toast.error('Silinemedi');
    } finally {
      setDeleteId(null);
    }
  };

  const toggleReveal = (id: string) => setRevealed(p => ({ ...p, [id]: !p[id] }));

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    playPop();
    setCopiedKey(key);
    toast.success('Kopyalandı', { duration: 1500 });
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Yükleniyor...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Şifreler & Bilgiler</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Unutulmaması gereken kritik bilgileri basitçe kaydedin.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <FaPlus /> Yeni Ekle
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl">
          <FaKey className="mx-auto text-3xl text-slate-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">Henüz bilgi eklemediniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {items.map(item => {
              const isVisible = revealed[item.id];
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate">{item.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600"><FaEdit size={12} /></button>
                      <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-slate-400 hover:text-red-500"><FaTrash size={12} /></button>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl space-y-2 text-xs">
                    {item.details && (
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/50 dark:border-zinc-700/50 pb-2">
                        <span className="font-medium text-slate-600 dark:text-zinc-300 truncate">{item.details}</span>
                        <button onClick={() => copy(item.details, `det-${item.id}`)} className="text-slate-400 hover:text-indigo-600">
                          {copiedKey === `det-${item.id}` ? <FaCheck size={11} className="text-emerald-500" /> : <FaCopy size={11} />}
                        </button>
                      </div>
                    )}
                    {item.passwordValue && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">
                          {isVisible ? item.passwordValue : '••••••••'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleReveal(item.id)} className="text-slate-400 hover:text-slate-600">
                            {isVisible ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                          </button>
                          <button onClick={() => copy(item.passwordValue, `pw-${item.id}`)} className="text-slate-400 hover:text-indigo-600">
                            {copiedKey === `pw-${item.id}` ? <FaCheck size={11} className="text-emerald-500" /> : <FaCopy size={11} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg dark:text-white">{editingItem ? 'Düzenle' : 'Yeni Ekle'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Başlık (Kimin/Neyin?)</label>
                <input
                  type="text"
                  placeholder="Örn: Babamın e-Devleti"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bilgi / T.C. / Kullanıcı Adı</label>
                <input
                  type="text"
                  placeholder="Örn: 12345678901 veya mail"
                  value={form.details}
                  onChange={e => setForm({ ...form, details: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Şifre / PIN</label>
                <input
                  type="text"
                  placeholder="Opsiyonel"
                  value={form.passwordValue}
                  onChange={e => setForm({ ...form, passwordValue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Sil"
        message="Bu bilgiyi silmek istiyor musunuz?"
      />
    </div>
  );
}
