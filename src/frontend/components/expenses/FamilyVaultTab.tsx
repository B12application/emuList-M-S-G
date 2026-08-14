import React, { useEffect, useMemo, useState } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  FaUserShield, 
  FaKey, 
  FaPlus, 
  FaSearch, 
  FaEye, 
  FaEyeSlash, 
  FaCopy, 
  FaCheck, 
  FaEdit, 
  FaTrash, 
  FaStar, 
  FaRegStar, 
  FaIdCard, 
  FaEnvelope, 
  FaLandmark, 
  FaWifi, 
  FaLock, 
  FaUsers, 
  FaShieldAlt,
  FaMagic,
  FaTimes,
  FaFileInvoiceDollar,
  FaExternalLinkAlt,
  FaInfoCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../../backend/config/firebaseConfig';
import { useAppSound } from '../../context/SoundContext';
import ConfirmDialog from '../ui/ConfirmDialog';

export type VaultCategory = 'e-devlet' | 'kimlik' | 'eposta' | 'banka' | 'fatura' | 'diger';

export interface FamilyVaultItem {
  id: string;
  userId: string;
  member: string; // 'Babam', 'Annem', 'Kardeşim', 'Ben', 'Eşim', 'Çocuk' or custom
  category: VaultCategory;
  title: string;
  identityNumber?: string; // T.C. Kimlik No
  username?: string; // E-posta veya Kullanıcı Adı
  password?: string; // Şifre veya PIN
  secondaryInfo?: string; // Seri No, Abone No, Müşteri No vb.
  notes?: string; // Özel notlar, kurtarma bilgisi vb.
  isFavorite?: boolean;
  color?: string;
  createdAt?: any;
  updatedAt?: any;
}

const VAULT_COLLECTION = 'familyVault';

const MEMBER_PRESETS = [
  { label: 'Babam', icon: '👨', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { label: 'Annem', icon: '👩', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { label: 'Ben', icon: '👤', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
  { label: 'Eşim', icon: '💍', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800' },
  { label: 'Kardeşim', icon: '🧑', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { label: 'Çocuk', icon: '🧒', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { label: 'Aile Ortak', icon: '🏠', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800' }
];

const CATEGORY_CONFIG: Record<VaultCategory, { label: string; icon: any; color: string; badge: string }> = {
  'e-devlet': {
    label: 'e-Devlet & Resmi',
    icon: FaLandmark,
    color: 'from-blue-600 to-indigo-600',
    badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
  },
  'kimlik': {
    label: 'T.C. & Kimlik',
    icon: FaIdCard,
    color: 'from-purple-600 to-violet-600',
    badge: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40'
  },
  'eposta': {
    label: 'E-Posta / Mail',
    icon: FaEnvelope,
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
  },
  'banka': {
    label: 'Banka & Finans',
    icon: FaLock,
    color: 'from-emerald-600 to-teal-600',
    badge: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
  },
  'fatura': {
    label: 'Fatura & Abonelik',
    icon: FaFileInvoiceDollar,
    color: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
  },
  'diger': {
    label: 'Diğer Şifreler',
    icon: FaKey,
    color: 'from-slate-600 to-zinc-700',
    badge: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
  }
};

const TEMPLATES = [
  {
    name: '🏛️ e-Devlet Girişi',
    category: 'e-devlet' as VaultCategory,
    titleSuffix: 'e-Devlet Kapısı',
    usernameLabel: 'T.C. Kimlik No',
    secondaryLabel: 'Seri No / Güvenlik'
  },
  {
    name: '📧 E-Posta (Gmail vb.)',
    category: 'eposta' as VaultCategory,
    titleSuffix: 'Gmail Hesabı',
    usernameLabel: 'E-posta Adresi',
    secondaryLabel: 'Kurtarma E-postası / Tel'
  },
  {
    name: '🆔 T.C. Kimlik Kartı',
    category: 'kimlik' as VaultCategory,
    titleSuffix: 'Kimlik Bilgisi',
    usernameLabel: 'T.C. Kimlik No',
    secondaryLabel: 'Seri / Cilt No'
  },
  {
    name: '📱 Fatura / İnternet',
    category: 'fatura' as VaultCategory,
    titleSuffix: 'Ev İnterneti / Fatura',
    usernameLabel: 'Abone / Hizmet No',
    secondaryLabel: 'Müşteri Hizmetleri / Hat'
  },
  {
    name: '💳 Banka Mobil Giriş',
    category: 'banka' as VaultCategory,
    titleSuffix: 'Banka Girişi',
    usernameLabel: 'Müşteri No / T.C.',
    secondaryLabel: 'Kart Son 4 Hane / Şube'
  }
];

const defaultForm = () => ({
  member: 'Babam',
  customMember: '',
  category: 'e-devlet' as VaultCategory,
  title: '',
  identityNumber: '',
  username: '',
  password: '',
  secondaryInfo: '',
  notes: '',
  isFavorite: false
});

export default function FamilyVaultTab() {
  const { user } = useAuth();
  const { playPop, playSuccess, playClick } = useAppSound();

  const [items, setItems] = useState<FamilyVaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Visibility toggles
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [revealedIdentities, setRevealedIdentities] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [globalReveal, setGlobalReveal] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FamilyVaultItem | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load records from Firestore
  const fetchRecords = async () => {
    if (!user?.uid) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const q = query(collection(db, VAULT_COLLECTION), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FamilyVaultItem[];

      // Sort favorites first, then by member and title
      data.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.title.localeCompare(b.title);
      });

      setItems(data);
    } catch (err) {
      console.error('Failed to load family vault items:', err);
      toast.error('Aile şifreleri yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user?.uid]);

  // Distinct member list for filter bar
  const distinctMembers = useMemo(() => {
    const members = new Set<string>();
    MEMBER_PRESETS.forEach(m => members.add(m.label));
    items.forEach(item => {
      if (item.member) members.add(item.member);
    });
    return Array.from(members);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.identityNumber && item.identityNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.secondaryInfo && item.secondaryInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMember = selectedMember === 'all' || item.member === selectedMember;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || item.isFavorite;

      return matchesSearch && matchesMember && matchesCategory && matchesFavorites;
    });
  }, [items, searchTerm, selectedMember, selectedCategory, showFavoritesOnly]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const membersCount = new Set(items.map(i => i.member)).size;
    const officialCount = items.filter(i => i.category === 'e-devlet' || i.category === 'kimlik').length;
    const credsCount = items.filter(i => i.category === 'eposta' || i.category === 'banka' || i.category === 'diger').length;

    return { total, membersCount, officialCount, credsCount };
  }, [items]);

  // Copy helper
  const copyToClipboard = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    playPop();
    setCopiedKey(key);
    toast.success(`${label} kopyalandı!`, {
      icon: '📋',
      duration: 2000
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    playClick();
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle identity visibility
  const toggleIdentityVisibility = (id: string) => {
    playClick();
    setRevealedIdentities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle all visibility
  const toggleGlobalReveal = () => {
    playClick();
    const nextState = !globalReveal;
    setGlobalReveal(nextState);
    const newRevealed: Record<string, boolean> = {};
    items.forEach(item => {
      newRevealed[item.id] = nextState;
    });
    setRevealedPasswords(newRevealed);
    setRevealedIdentities(newRevealed);
  };

  // Open modal for add
  const handleOpenAdd = () => {
    playClick();
    setEditingItem(null);
    setForm(defaultForm());
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: FamilyVaultItem) => {
    playClick();
    setEditingItem(item);
    const isPreset = MEMBER_PRESETS.some(m => m.label === item.member);
    setForm({
      member: isPreset ? item.member : 'Diger',
      customMember: isPreset ? '' : item.member,
      category: item.category,
      title: item.title,
      identityNumber: item.identityNumber || '',
      username: item.username || '',
      password: item.password || '',
      secondaryInfo: item.secondaryInfo || '',
      notes: item.notes || '',
      isFavorite: item.isFavorite || false
    });
    setIsModalOpen(true);
  };

  // Apply template
  const applyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    playClick();
    const effectiveMember = form.member === 'Diger' ? (form.customMember || 'Babam') : form.member;
    setForm(prev => ({
      ...prev,
      category: tmpl.category,
      title: `${effectiveMember} - ${tmpl.titleSuffix}`
    }));
    toast.success(`${tmpl.name} şablonu uygulandı`, { icon: '✨' });
  };

  // Generate strong random password
  const generatePassword = () => {
    playPop();
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password: result }));
    toast.success('Güçlü şifre üretildi!', { icon: '🔐' });
  };

  // Save item (Create / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const effectiveMember = form.member === 'Diger' ? form.customMember.trim() : form.member;
    if (!effectiveMember) {
      toast.error('Lütfen bir aile üyesi seçin veya girin');
      return;
    }

    if (!form.title.trim()) {
      toast.error('Lütfen bir başlık girin');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        userId: user.uid,
        member: effectiveMember,
        category: form.category,
        title: form.title.trim(),
        identityNumber: form.identityNumber.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        secondaryInfo: form.secondaryInfo.trim(),
        notes: form.notes.trim(),
        isFavorite: form.isFavorite,
        updatedAt: new Date().toISOString()
      };

      if (editingItem) {
        const docRef = doc(db, VAULT_COLLECTION, editingItem.id);
        await updateDoc(docRef, payload);
        playSuccess();
        toast.success('Bilgi başarıyla güncellendi!');
      } else {
        await addDoc(collection(db, VAULT_COLLECTION), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        playSuccess();
        toast.success('Yeni bilgi kasaya kaydedildi!');
      }

      setIsModalOpen(false);
      fetchRecords();
    } catch (err) {
      console.error('Error saving vault item:', err);
      toast.error('Kayıt kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (item: FamilyVaultItem, e: React.MouseEvent) => {
    e.stopPropagation();
    playPop();
    const newStatus = !item.isFavorite;
    try {
      const docRef = doc(db, VAULT_COLLECTION, item.id);
      await updateDoc(docRef, { isFavorite: newStatus });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isFavorite: newStatus } : i));
      toast.success(newStatus ? 'Yıldızlandı' : 'Yıldız kaldırıldı');
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, VAULT_COLLECTION, deleteConfirmId));
      playPop();
      toast.success('Kayıt silindi');
      setItems(prev => prev.filter(i => i.id !== deleteConfirmId));
    } catch (err) {
      console.error('Failed to delete item', err);
      toast.error('Silme işlemi başarısız oldu');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getMemberPreset = (memberName: string) => {
    return MEMBER_PRESETS.find(m => m.label.toLowerCase() === memberName.toLowerCase()) || {
      label: memberName,
      icon: '👤',
      color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
    };
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* TOP HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-56 h-56 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <FaShieldAlt className="text-sm text-indigo-400" />
              <span>Güvenli Aile Kasası</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Aile & Şifre Bilgileri</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Babamın maili, e-Devlet şifreleri, T.C. kimlik numaraları, fatura abone kodları ve unutulmaması gereken tüm aile hesaplarını güvenle saklayın.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleGlobalReveal}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border shadow-lg backdrop-blur-md ${
                globalReveal
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
              }`}
              title={globalReveal ? 'Tümünü Gizle' : 'Tümünü Göster'}
            >
              {globalReveal ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              <span>{globalReveal ? 'Şifreleri Gizle' : 'Şifreleri Göster'}</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-400 hover:opacity-95 transition-all shadow-xl shadow-indigo-500/25 active:scale-95"
            >
              <FaPlus className="text-sm" />
              <span>Yeni Bilgi Ekle</span>
            </button>
          </div>
        </div>

        {/* SUMMARY STATS TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Toplam Kayıt</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aile Üyesi</span>
            <div className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5">{stats.membersCount}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">e-Devlet & Kimlik</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-0.5">{stats.officialCount}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">E-Posta & Diğer</span>
            <div className="text-xl sm:text-2xl font-black text-teal-400 mt-0.5">{stats.credsCount}</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        
        {/* Search & Favorites Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 text-sm" />
            <input
              type="text"
              placeholder="Başlık, aile üyesi, mail, T.C. veya notlarda ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border shrink-0 ${
              showFavoritesOnly
                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                : 'bg-slate-50 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
            }`}
          >
            <FaStar className={showFavoritesOnly ? 'text-amber-500' : 'text-slate-400'} />
            <span>Yıldızlılar</span>
          </button>
        </div>

        {/* Member Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
            Aile Üyesi Filtresi
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => { playClick(); setSelectedMember('all'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedMember === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              Tümü ({items.length})
            </button>
            {distinctMembers.map(member => {
              const preset = getMemberPreset(member);
              const count = items.filter(i => i.member === member).length;
              return (
                <button
                  key={member}
                  onClick={() => { playClick(); setSelectedMember(member); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    selectedMember === member
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{member}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedMember === member ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Pills */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
            Kategori
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => { playClick(); setSelectedCategory('all'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              Tüm Kategoriler
            </button>
            {(Object.keys(CATEGORY_CONFIG) as VaultCategory[]).map(cat => {
              const conf = CATEGORY_CONFIG[cat];
              const Icon = conf.icon;
              return (
                <button
                  key={cat}
                  onClick={() => { playClick(); setSelectedCategory(cat); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm'
                      : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="text-xs opacity-75" />
                  <span>{conf.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ITEMS LIST / GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Aile kasası şifreleri yükleniyor...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-zinc-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl">
            <FaUserShield />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {items.length === 0 ? 'Kayıtlı Aile Bilgisi Bulunamadı' : 'Filtreye Uygun Kayıt Yok'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
              {items.length === 0 
                ? 'Babanızın mailini, e-Devlet şifrelerini, T.C. kimlik numaralarını veya diğer önemli hesapları eklemek için "Yeni Bilgi Ekle" butonuna tıklayın.'
                : 'Arama kriterlerinizi veya filtreleri temizleyerek diğer kayıtları görüntüleyebilirsiniz.'}
            </p>
          </div>
          {items.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
            >
              <FaPlus /> İlk Kaydı Ekle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map(item => {
              const catConf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG['diger'];
              const memberPreset = getMemberPreset(item.member);
              const CatIcon = catConf.icon;
              const isPwRevealed = revealedPasswords[item.id] || false;
              const isIdRevealed = revealedIdentities[item.id] || false;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative bg-white dark:bg-zinc-900 rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:border-indigo-400/40 dark:hover:border-indigo-500/40 ${
                    item.isFavorite
                      ? 'border-amber-300/80 dark:border-amber-600/40 shadow-sm'
                      : 'border-slate-200 dark:border-zinc-800/80 shadow-sm'
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      
                      {/* Member & Category Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black border ${memberPreset.color}`}>
                          <span>{memberPreset.icon}</span>
                          <span>{item.member}</span>
                        </span>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${catConf.badge}`}>
                          <CatIcon className="text-[11px]" />
                          <span>{catConf.label}</span>
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => handleToggleFavorite(item, e)}
                        className={`p-2 rounded-xl transition-all ${
                          item.isFavorite
                            ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-900/30'
                            : 'text-slate-300 hover:text-amber-400 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                        title={item.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      >
                        {item.isFavorite ? <FaStar size={14} /> : <FaRegStar size={14} />}
                      </button>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-base font-black text-slate-800 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    {/* DETAILS / CREDENTIALS BOX */}
                    <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 space-y-2.5 border border-slate-100 dark:border-zinc-800">
                      
                      {/* T.C. Kimlik No (If exists) */}
                      {item.identityNumber && (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 w-16 shrink-0">
                              T.C. No:
                            </span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-zinc-200 truncate">
                              {isIdRevealed ? item.identityNumber : `${item.identityNumber.slice(0, 3)}•••••${item.identityNumber.slice(-2)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleIdentityVisibility(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition-all"
                              title={isIdRevealed ? 'Gizle' : 'Göster'}
                            >
                              {isIdRevealed ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.identityNumber || '', `id-${item.id}`, 'T.C. Kimlik No')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-700 transition-all"
                              title="T.C. No Kopyala"
                            >
                              {copiedKey === `id-${item.id}` ? <FaCheck size={11} className="text-emerald-500" /> : <FaCopy size={11} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Username / Mail (If exists) */}
                      {item.username && (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 w-16 shrink-0">
                              E-Posta:
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-zinc-200 truncate select-all">
                              {item.username}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(item.username || '', `usr-${item.id}`, 'E-Posta / Kullanıcı Adı')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-700 transition-all shrink-0"
                            title="Kullanıcı Adı / Mail Kopyala"
                          >
                            {copiedKey === `usr-${item.id}` ? <FaCheck size={11} className="text-emerald-500" /> : <FaCopy size={11} />}
                          </button>
                        </div>
                      )}

                      {/* Password / PIN (If exists) */}
                      {item.password && (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 w-16 shrink-0">
                              Şifre:
                            </span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider truncate">
                              {isPwRevealed ? item.password : '••••••••••••'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition-all"
                              title={isPwRevealed ? 'Gizle' : 'Göster'}
                            >
                              {isPwRevealed ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.password || '', `pw-${item.id}`, 'Şifre')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-700 transition-all"
                              title="Şifreyi Kopyala"
                            >
                              {copiedKey === `pw-${item.id}` ? <FaCheck size={11} className="text-emerald-500" /> : <FaCopy size={11} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Secondary Info (Seri No, Abone No vb.) */}
                      {item.secondaryInfo && (
                        <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-zinc-700/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 w-16 shrink-0">
                              Ek Bilgi:
                            </span>
                            <span className="text-slate-600 dark:text-zinc-300 font-medium truncate">
                              {item.secondaryInfo}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(item.secondaryInfo || '', `sec-${item.id}`, 'Ek Bilgi')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-700 transition-all shrink-0"
                            title="Kopyala"
                          >
                            {copiedKey === `sec-${item.id}` ? <FaCheck size={11} className="text-emerald-500" /> : <FaCopy size={11} />}
                          </button>
                        </div>
                      )}

                    </div>

                    {/* Notes Snippet */}
                    {item.notes && (
                      <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <FaInfoCircle className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="line-clamp-2 leading-relaxed">{item.notes}</p>
                      </div>
                    )}

                  </div>

                  {/* CARD FOOTER ACTIONS */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('tr-TR') : 'Kayıtlı'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                      >
                        <FaEdit size={12} /> Düzenle
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Sil"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                    <FaUserShield />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                      {editingItem ? 'Aile Şifre & Bilgisini Düzenle' : 'Yeni Aile Bilgisi / Şifresi Ekle'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      T.C. kimlik, e-Devlet, e-posta veya kritik giriş bilgilerini kaydedin.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
                
                {/* QUICK TEMPLATES (Only on New) */}
                {!editingItem && (
                  <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <FaMagic /> Hızlı Şablonlar
                      </span>
                      <span className="text-[10px] text-slate-400">Tek tıkla formu doldurur</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {TEMPLATES.map(tmpl => (
                        <button
                          key={tmpl.name}
                          type="button"
                          onClick={() => applyTemplate(tmpl)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 text-slate-700 dark:text-zinc-300 transition-all border border-slate-200 dark:border-zinc-700"
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MEMBER SELECTOR */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                    Aile Üyesi / Kişi <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MEMBER_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          playClick();
                          setForm(p => ({ ...p, member: preset.label }));
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                          form.member === preset.label
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                            : 'bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setForm(p => ({ ...p, member: 'Diger' }));
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        form.member === 'Diger'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      ✏️ Farklı Kişi...
                    </button>
                  </div>

                  {form.member === 'Diger' && (
                    <input
                      type="text"
                      placeholder="Örn: Halil Dayım, Anneannem..."
                      value={form.customMember}
                      onChange={e => setForm(p => ({ ...p, customMember: e.target.value }))}
                      className="w-full mt-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  )}
                </div>

                {/* CATEGORY & TITLE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value as VaultCategory }))}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {(Object.keys(CATEGORY_CONFIG) as VaultCategory[]).map(cat => (
                        <option key={cat} value={cat}>
                          {CATEGORY_CONFIG[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      Başlık / Hizmet Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Babamın e-Devleti, Gmail Hesabı"
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* T.C. KIMLIK NO & EMAIL / USERNAME */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                      <span>T.C. Kimlik No</span>
                      <span className="text-[10px] text-slate-400 font-normal">11 Hane</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="12345678901"
                      value={form.identityNumber}
                      onChange={e => setForm(p => ({ ...p, identityNumber: e.target.value.replace(/\D/g, '') }))}
                      className="w-full font-mono px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      E-Posta / Kullanıcı Adı / Abone No
                    </label>
                    <input
                      type="text"
                      placeholder="ahmet@gmail.com veya kullanıcı adı"
                      value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* PASSWORD / PIN & GENERATOR */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      Şifre / PIN / Giriş Kodu
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <FaMagic size={10} /> Rastgele Güçlü Şifre Üret
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Şifre veya PIN kodunu girin"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full font-mono px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* SECONDARY INFO & NOTES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      Ekstra Bilgi (Seri No, Abone No vb.)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Cilt No, Müşteri No, Hat Tel"
                      value={form.secondaryInfo}
                      onChange={e => setForm(p => ({ ...p, secondaryInfo: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      Özel Notlar / Kurtarma Detayları
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Güvenlik sorusu, kurtarma maili, son parola değişim notu..."
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* FAVORITE CHECKBOX */}
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFavorite}
                    onChange={e => setForm(p => ({ ...p, isFavorite: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <FaStar className="text-amber-500 text-sm" />
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                      Bu kaydı Yıldızlılara (Sık Kullanılanlar) ekle
                    </span>
                  </div>
                </label>

                {/* MODAL FOOTER */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        <span>{editingItem ? 'Güncelle' : 'Kasaya Kaydet'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Kayıt Silinecek"
        message="Bu aile bilgisi ve şifre kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />

    </div>
  );
}
