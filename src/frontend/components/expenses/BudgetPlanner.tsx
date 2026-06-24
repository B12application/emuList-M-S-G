import React, { useEffect, useMemo, useState, useRef } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../backend/config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import type { Expense } from '../../hooks/useExpenses';
import {
  FaPlus,
  FaTrash,
  FaWallet,
  FaArrowDown,
  FaArrowUp,
  FaSpinner,
  FaCalendarAlt,
  FaCoins,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaRegCircle,
  FaTrashAlt
} from 'react-icons/fa';

type Props = {
  t: any;
  isDark: boolean;
  expenses: Expense[];
  selectedMonth: string;
};

// Yenilenmiş Veri Tipleri
type IncomeItem = {
  id: string;
  title: string;
  amount: number;
  expectedDate: string;
};

type WishItem = {
  id: string;
  title: string;
  price: number;
  targetDate: string; // <-- Alınacaklar için hedef tarih alanı eklendi
  group?: string; // <-- Gruplama için eklendi
  subGroup?: string; // <-- Alt gruplama (Kredi Kartı -> Telefon taksitleri gibi) için
  excludeFromTotal?: boolean; // <-- Hesaplamadan çıkarmak için eklendi
  isPaid?: boolean; // <-- Ödenmiş olarak işaretlemek için
};

type PlannerData = {
  walletBalance: number;
  incomes: IncomeItem[];
  wishes: WishItem[];
  updatedAt: string;
};

const BudgetPlanner: React.FC<Props> = ({ t, isDark }) => {
  const { user } = useAuth();

  // Temel Durumlar (State)
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Yeni Gelir Formu State'leri
  const [incomeTitle, setIncomeTitle] = useState('');
  const [incomeAmt, setIncomeAmt] = useState('');
  const [incomeDate, setIncomeDate] = useState('');

  // Yeni Alınacak Formu State'leri
  const [wishTitle, setWishTitle] = useState('');
  const [wishPrice, setWishPrice] = useState('');
  const [wishDate, setWishDate] = useState(''); // <-- Form için state eklendi
  const [wishGroup, setWishGroup] = useState(''); // <-- Grup adı state'i
  const [expenseType, setExpenseType] = useState<'cash' | 'credit_card'>('cash');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Hata Mesajları State'leri
  const [incomeError, setIncomeError] = useState('');
  const [wishError, setWishError] = useState('');

  // Veritabanından Veri Çekme
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'budgetPlans', user.uid));
        if (snap.exists()) {
          const d = snap.data() as PlannerData;
          setWalletBalance(d.walletBalance || 0);
          setIncomes(d.incomes || []);
          setWishes(d.wishes || []);
        }
      } catch (err) {
        console.error("Veri çekme hatası:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Timeout ref for debouncing wallet balance
  const walletTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Veritabanına Kaydetme Fonksiyonu
  const saveToFirebase = async (overrides: Partial<PlannerData>) => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'budgetPlans', user.uid), {
        ...overrides,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (err) {
      console.error("Kaydetme hatası:", err);
    } finally {
      setSaving(false);
    }
  };

  // --- HESAPLAMALAR ---
  const totalExpectedIncome = useMemo(() => incomes.reduce((sum, item) => sum + item.amount, 0), [incomes]);
  const totalWishesCost = useMemo(() => wishes.reduce((sum, item) => item.excludeFromTotal ? sum : sum + item.price, 0), [wishes]);
  const totalPaidWishesCost = useMemo(() => wishes.reduce((sum, item) => item.isPaid ? sum + item.price : sum, 0), [wishes]);

  // Toplam Para = Cebimdeki Para + Gelecek Paralar
  const totalMoney = walletBalance + totalExpectedIncome;
  // Kalan Sonuç = Toplam Para - Alınacaklar Toplamı
  const finalResult = totalMoney - totalWishesCost;

  // --- GRUPLAMA HESAPLAMALARI ---
  const ungroupedWishes = useMemo(() => wishes.filter(w => !w.group && !w.isPaid), [wishes]);
  const paidWishes = useMemo(() => wishes.filter(w => w.isPaid), [wishes]);
  
  // Array şeklinde dönüyoruz ki listeleme sırası wishes array'indeki sıraya göre otomatik oluşsun
  const groupedWishesArray = useMemo(() => {
    const groups: { name: string; items: WishItem[]; subGroups: { name: string; items: WishItem[] }[] }[] = [];
    wishes.forEach(w => {
      if (w.isPaid) return; // Ödenmişler ayrı listede gösterilecek
      if (w.group) {
        let group = groups.find(g => g.name === w.group);
        if (!group) {
          group = { name: w.group, items: [], subGroups: [] };
          groups.push(group);
        }
        
        if (w.subGroup) {
          let subGroup = group.subGroups.find(sg => sg.name === w.subGroup);
          if (!subGroup) {
            subGroup = { name: w.subGroup, items: [] };
            group.subGroups.push(subGroup);
          }
          subGroup.items.push(w);
        } else {
          group.items.push(w);
        }
      }
    });
    return groups;
  }, [wishes]);

  const toggleCollapseGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // --- DRAG & DROP İŞLEMLERİ ---
  const handleDrop = async (e: React.DragEvent, targetGroup?: string, targetId?: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('wishId');
    if (!draggedId || draggedId === targetId) return;

    const draggedIdx = wishes.findIndex(w => w.id === draggedId);
    if (draggedIdx === -1) return;

    const updated = [...wishes];
    const [draggedItem] = updated.splice(draggedIdx, 1);

    // Eğer bir öğenin üzerine bırakıldıysa (sıralama değiştirme)
    if (targetId) {
      const targetIdx = updated.findIndex(w => w.id === targetId);
      if (targetIdx !== -1) {
        draggedItem.group = updated[targetIdx].group; // Aynı gruba al
        updated.splice(targetIdx, 0, draggedItem);
      } else {
        updated.push(draggedItem);
      }
    }
    // Eğer sadece grubun alanına bırakıldıysa
    else {
      const targetGroupVal = targetGroup?.trim() || undefined;
      draggedItem.group = targetGroupVal;
      // İsterseniz burada dizinin sonuna ekleyebilir veya aynı sırayı koruyabilirsiniz.
      updated.push(draggedItem);
    }

    setWishes(updated);
    await saveToFirebase({ wishes: updated });
  };

  // --- ÖDEME VE HESAPLAMADAN ÇIKARMA (EXCLUDE) İŞLEMLERİ ---
  const toggleExclude = async (id: string) => {
    const itemIndex = wishes.findIndex(w => w.id === id);
    if (itemIndex === -1) return;

    const updated = [...wishes];
    updated[itemIndex] = { ...updated[itemIndex], excludeFromTotal: !updated[itemIndex].excludeFromTotal };
    setWishes(updated);
    await saveToFirebase({ wishes: updated });
  };

  const togglePaid = async (id: string) => {
    const itemIndex = wishes.findIndex(w => w.id === id);
    if (itemIndex === -1) return;

    const updated = [...wishes];
    const newPaidStatus = !updated[itemIndex].isPaid;
    updated[itemIndex] = { 
      ...updated[itemIndex], 
      isPaid: newPaidStatus,
      excludeFromTotal: newPaidStatus ? true : updated[itemIndex].excludeFromTotal // Ödenince otomatik hesaptan düş
    };
    setWishes(updated);
    await saveToFirebase({ wishes: updated });
  };

  const toggleGroupExclude = async (groupName: string, exclude: boolean) => {
    const updated = wishes.map(w => w.group === groupName ? { ...w, excludeFromTotal: exclude } : w);
    setWishes(updated);
    await saveToFirebase({ wishes: updated });
  };

  const payAllInGroup = async (groupName: string, subGroupName?: string) => {
    const updated = wishes.map(w => {
      if (w.group === groupName && (subGroupName === undefined || w.subGroup === subGroupName) && !w.isPaid) {
        return { ...w, isPaid: true, excludeFromTotal: true };
      }
      return w;
    });
    setWishes(updated);
    await saveToFirebase({ wishes: updated });
  };

  // --- EKLEME VE SİLME İŞLEMLERİ ---
  const addIncome = async () => {
    const amount = Number(incomeAmt);
    if (!incomeTitle) { setIncomeError('Lütfen gelir kaynağını (başlık) girin.'); return; }
    if (!amount || amount <= 0) { setIncomeError('Lütfen geçerli bir tutar girin.'); return; }
    if (!incomeDate) { setIncomeError('Lütfen bir tarih seçin.'); return; }

    setIncomeError('');

    const newItem: IncomeItem = {
      id: Math.random().toString(36).slice(2),
      title: incomeTitle,
      amount,
      expectedDate: incomeDate,
    };

    const updated = [...incomes, newItem];
    setIncomes(updated);
    setIncomeTitle('');
    setIncomeAmt('');
    setIncomeDate('');
    await saveToFirebase({ incomes: updated });
  };

  const removeIncome = async (id: string) => {
    const updated = incomes.filter(i => i.id !== id);
    setIncomes(updated);
    await saveToFirebase({ incomes: updated });
  };

  const addWish = async () => {
    const price = Number(wishPrice);
    if (!wishTitle) { setWishError('Lütfen ne alacağınızı (hedef) yazın.'); return; }
    if (!price || price <= 0) { setWishError('Lütfen geçerli bir tutar girin.'); return; }
    if (expenseType === 'cash' && !wishDate) { setWishError('Lütfen tarih seçin.'); return; }

    setWishError('');

    let newItems: WishItem[] = [];

    if (expenseType === 'credit_card') {
      const count = Number(installmentCount);
      if (!count || count <= 0) { setWishError('Lütfen geçerli taksit sayısı girin.'); return; }

      const monthlyPrice = Number((price / count).toFixed(2));
      const baseGroup = "Kredi Kartı Ödemeleri"; // Taksitler ana gruba alınır
      const baseSubGroup = count > 1 ? `${wishTitle} (${count} Taksit)` : undefined; // Eğer taksitse alt grup oluştur

      // Kredi Kartı Hesap Kesim Tarihi Otomatik: Her ayın 3'ü
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      let firstPaymentMonth = currentMonth;
      let firstPaymentYear = currentYear;

      // Eğer bugün ayın 3'ünden sonraysa, ilk ödeme bir sonraki aya sarkar
      if (today.getDate() > 3) {
        firstPaymentMonth += 1;
        if (firstPaymentMonth > 11) {
          firstPaymentMonth = 0;
          firstPaymentYear += 1;
        }
      }

      for (let i = 0; i < count; i++) {
        // Her ay için ayın 3'ünü belirle
        const targetDateObj = new Date(firstPaymentYear, firstPaymentMonth + i, 3);

        // Yıl-Ay-Gün formatına çevirme (Saat dilimi hatalarını önlemek için)
        const yyyy = targetDateObj.getFullYear();
        const mm = String(targetDateObj.getMonth() + 1).padStart(2, '0');
        const dd = "03";
        const dateString = `${yyyy}-${mm}-${dd}`;

        newItems.push({
          id: Math.random().toString(36).slice(2) + `-${i}`,
          title: count > 1 ? `${wishTitle} (${i + 1}/${count})` : wishTitle,
          price: monthlyPrice,
          targetDate: dateString,
          group: baseGroup,
          subGroup: baseSubGroup,
          excludeFromTotal: i !== 0, // İlk taksit (0) fiyata dahil, diğerleri hariç
        });
      }
    } else {
      newItems.push({
        id: Math.random().toString(36).slice(2),
        title: wishTitle,
        price,
        targetDate: wishDate, // Hedef tarih eklendi
        group: wishGroup.trim() || undefined,
      });
    }

    const updated = [...wishes, ...newItems];
    setWishes(updated);
    setWishTitle('');
    setWishPrice('');
    setWishDate('');
    setWishGroup('');
    setInstallmentCount('1');
    setExpenseType('cash');
    await saveToFirebase({ wishes: updated });
  };

  const removeWish = async (id: string) => {
    const updated = wishes.filter(w => w.id !== id);
    setWishes(updated);
    await saveToFirebase({ wishes: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <FaSpinner className="h-8 w-8 animate-spin text-slate-300 dark:text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">

      {/* ── 1. BÜYÜK ÖZET PANELİ (DASHBOARD) ── */}
      <div className="rounded-[2.5rem] bg-slate-900 text-white p-6 md:p-8 shadow-2xl overflow-hidden relative dark:bg-black dark:border dark:border-zinc-800">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-rose-500/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Cebimdeki Mevcut Para (Gösterge) */}
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1">Cebimdeki Nakit</span>
            <span className="text-3xl md:text-4xl font-black text-white tabular-nums">₺{walletBalance.toLocaleString()}</span>
          </div>

          {/* Formüller */}
          <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-400">
            <div className="px-3 py-2 bg-white/5 rounded-xl text-center">
              <span className="block text-[10px] uppercase text-slate-400">Gelecekler (+)</span>
              <span className="text-emerald-400">₺{totalExpectedIncome.toLocaleString()}</span>
            </div>
            <span className="text-slate-600 font-black">-</span>
            <div className="px-3 py-2 bg-white/5 rounded-xl text-center">
              <span className="block text-[10px] uppercase text-slate-400">Alınacaklar (-)</span>
              <span className="text-rose-400">₺{totalWishesCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Final Simülasyon Sonucu */}
          <div className="text-left md:text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              {finalResult >= 0 ? "Plan Sonrası Cebinde Kalacak Para" : "Hedef İçin Eksik Olan Para"}
            </p>
            <p className={`text-4xl md:text-5xl font-black tracking-tighter tabular-nums ${finalResult >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {finalResult < 0 ? "-" : ""}₺{Math.abs(finalResult).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {saving && <p className="text-xs text-center text-slate-400 animate-pulse">Senkronize ediliyor...</p>}

      {/* ── 2. NAKİT GİRİŞ HAP KART (Mevcut Bakiye Yönetimi) ── */}
      <div className="bg-slate-50 border border-slate-200/60 dark:bg-zinc-900/40 dark:border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center">
            <FaWallet className="text-sm" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mevcut Bakiyeni Güncelle</h4>
            <p className="text-xs text-slate-500">Şu an cebinde/bankanda net ne kadar para var?</p>
          </div>
        </div>
        <div className="relative inline-block w-full sm:w-auto">
          <input
            type="number"
            value={walletBalance || ''}
            onChange={e => {
              const val = Number(e.target.value || 0);
              setWalletBalance(val);
              if (walletTimeoutRef.current) {
                clearTimeout(walletTimeoutRef.current);
              }
              walletTimeoutRef.current = setTimeout(() => saveToFirebase({ walletBalance: val }), 800);
            }}
            placeholder="0"
            className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 w-full sm:w-[160px] pr-8"
          />
          <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">₺</span>
        </div>
      </div>

      {/* ── 3. İKİLİ SÜTUN (GELECEK PARALAR & HEDEFLER) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SOL SÜTUN: GELECEK PARALAR (TARİHLİ) */}
        <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <FaArrowDown className="text-md" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white">Gelecek Paralar (+ Tutar)</h3>
                <p className="text-xs text-slate-500">Geleceği kesin olan paralar ve tarihleri</p>
              </div>
            </div>

            {/* Giriş Formu */}
            <div className="flex flex-col gap-2.5 mb-6 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900">
              <input
                type="text"
                placeholder="Para nereden gelecek? (Örn: Maaş)"
                value={incomeTitle} onChange={e => setIncomeTitle(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none dark:text-white font-medium"
              />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Tutar (₺)"
                  value={incomeAmt} onChange={e => setIncomeAmt(e.target.value)}
                  className="w-1/2 bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none dark:text-white font-bold"
                />
                <div className="w-1/2 flex items-center border-b border-slate-200 dark:border-zinc-700">
                  <span className="text-[10px] text-slate-400 mr-1 whitespace-nowrap">Tarih:</span>
                  <input
                    type="date"
                    value={incomeDate} onChange={e => setIncomeDate(e.target.value)}
                    className="w-full bg-transparent py-1.5 text-[11px] focus:outline-none text-slate-600 dark:text-slate-300"
                  />
                </div>
                <button
                  onClick={addIncome}
                  className="w-8 h-8 shrink-0 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition text-xs"
                >
                  <FaPlus />
                </button>
              </div>
              {incomeError && <p className="text-[10px] text-rose-500 mt-1 font-medium">{incomeError}</p>}
            </div>

            {/* Liste */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {incomes.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 italic">Gelecek bir ödeme takvimi eklemediniz.</p>
              ) : (
                incomes.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/60 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800 transition group">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{item.title}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                        <FaCalendarAlt className="text-[9px]" /> {new Date(item.expectedDate).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-emerald-500">+ ₺{item.amount.toLocaleString()}</span>
                      <button onClick={() => removeIncome(item.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SAĞ SÜTUN: ALINACAKLAR & HEDEFLER (TARİHLİ) */}
        <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <FaArrowUp className="text-md" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white">Alınacaklar & Hedefler (- Tutar)</h3>
                <p className="text-xs text-slate-500">Almayı düşündüğün hayaller ve hedef tarihleri</p>
                {totalPaidWishesCost > 0 && (
                  <p className="text-[11px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
                    <FaCheckCircle className="text-[10px]" /> Toplam Ödenen: ₺{totalPaidWishesCost.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Giriş Formu */}
            <div className="flex flex-col gap-2.5 mb-6 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900">
              {/* Type Selection */}
              <div className="flex items-center gap-2 mb-2 p-1 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-800">
                <button
                  onClick={() => setExpenseType('cash')}
                  className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${expenseType === 'cash' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Nakit
                </button>
                <button
                  onClick={() => setExpenseType('credit_card')}
                  className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${expenseType === 'credit_card' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Kredi Kartı
                </button>
              </div>

              <input
                type="text"
                placeholder={expenseType === 'credit_card' ? "Harcama Adı (Örn: Telefon)" : "Ne alacaksın veya Ödeme? (Örn: Borç, Telefon)"}
                value={wishTitle} onChange={e => setWishTitle(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none dark:text-white font-medium"
              />
              {expenseType === 'cash' && (
                <input
                  type="text"
                  list="existing-groups"
                  placeholder="Grup Adı (İsteğe Bağlı, Örn: Evlilik, Tatil)"
                  value={wishGroup} onChange={e => setWishGroup(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-[11px] focus:outline-none text-slate-500 dark:text-slate-400"
                />
              )}
              {expenseType === 'cash' && (
                <datalist id="existing-groups">
                  {Object.keys(ungroupedWishes).map(g => <option key={g} value={g} />)}
                </datalist>
              )}

              {expenseType === 'credit_card' && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    placeholder="Taksit Sayısı (Tek çekim için 1)"
                    value={installmentCount} onChange={e => setInstallmentCount(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none dark:text-white font-bold"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  placeholder={expenseType === 'credit_card' ? "Toplam Tutar (₺)" : "Fiyatı (₺)"}
                  value={wishPrice} onChange={e => setWishPrice(e.target.value)}
                  className="w-1/2 bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none dark:text-white font-bold"
                />

                {expenseType === 'cash' ? (
                  <div className="w-1/2 flex items-center border-b border-slate-200 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 mr-1 whitespace-nowrap">Hedef:</span>
                    <input
                      type="date"
                      value={wishDate} onChange={e => setWishDate(e.target.value)}
                      className="w-full bg-transparent py-1.5 text-[11px] focus:outline-none text-slate-600 dark:text-slate-300"
                    />
                  </div>
                ) : (
                  <div className="w-1/2 flex items-center border-b border-slate-200 dark:border-zinc-700 px-2 bg-rose-50/50 dark:bg-rose-500/5 rounded-lg">
                    <span className="text-[10px] font-bold text-rose-500 mr-1">Tarih:</span>
                    <span className="text-[10px] text-rose-400 italic">Her ayın 3'ü</span>
                  </div>
                )}

                <button
                  onClick={addWish}
                  className="w-8 h-8 shrink-0 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition text-xs"
                >
                  <FaPlus />
                </button>
              </div>
              {wishError && <p className="text-[10px] text-rose-500 mt-1 font-medium">{wishError}</p>}
            </div>

            {/* Liste */}
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {wishes.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 italic">Listeniz boş, hedefler veya borçlar ekleyin!</p>
              ) : (
                <>
                  {/* Gruplanmamış Öğeler (Örn: Tekil Borçlar) */}
                  <div
                    className={`space-y-2 rounded-xl p-2 border-2 border-dashed transition-colors ${ungroupedWishes.length === 0 ? 'min-h-[60px] flex items-center justify-center border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700' : 'border-transparent'}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, undefined)}
                  >
                    {ungroupedWishes.length === 0 ? (
                      <p className="text-[10px] text-slate-400 font-medium italic opacity-60">Öğeleri gruptan çıkarmak için buraya sürükleyebilirsiniz</p>
                    ) : (
                      ungroupedWishes.map(item => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={e => e.dataTransfer.setData('wishId', item.id)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.stopPropagation(); handleDrop(e, undefined, item.id); }}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/60 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800 transition group cursor-grab active:cursor-grabbing bg-white dark:bg-zinc-950/50"
                        >
                          <div>
                            <p className={`text-xs font-bold ${item.excludeFromTotal || item.isPaid ? 'text-slate-400 dark:text-zinc-600 line-through' : 'text-slate-800 dark:text-zinc-200'}`}>
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                              <FaCalendarAlt className="text-[9px]" /> {new Date(item.targetDate).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-black ${item.excludeFromTotal || item.isPaid ? 'text-slate-400 dark:text-zinc-600' : 'text-rose-500'}`}>- ₺{item.price.toLocaleString()}</span>
                            <button 
                              onClick={() => togglePaid(item.id)}
                              className={`text-[9px] px-2 py-1 rounded-md font-bold transition-colors shadow-sm bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-emerald-500 hover:text-white`}
                              title="Ödendi İşaretle"
                            >
                              ÖDE
                            </button>
                            <button 
                              onClick={() => toggleExclude(item.id)}
                              className="text-base transition-colors focus:outline-none"
                              title="Hesaba Kat / Çıkar"
                            >
                              {item.excludeFromTotal ? <FaRegCircle className="text-slate-300 dark:text-zinc-600 hover:text-slate-500" /> : <FaCheckCircle className="text-slate-400 hover:text-emerald-600" />}
                            </button>
                            <button onClick={() => removeWish(item.id)} className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100">
                              <FaTrashAlt className="text-sm" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Gruplanmış Öğeler */}
                  {groupedWishesArray.map((group) => {
                    const groupName = group.name;
                    const allItemsInGroup = [...group.items, ...group.subGroups.flatMap(sg => sg.items)];
                    if (allItemsInGroup.length === 0) return null;
                    
                    const groupTotal = allItemsInGroup.reduce((sum, i) => i.excludeFromTotal ? sum : sum + i.price, 0);
                    const isGroupFullyExcluded = allItemsInGroup.every(i => i.excludeFromTotal);
                    const isCollapsed = collapsedGroups[groupName];

                    return (
                      <div
                        key={groupName}
                        className={`bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl p-3 border-2 border-dashed transition-colors ${isGroupFullyExcluded ? 'opacity-60 border-slate-100 dark:border-zinc-800/30' : 'border-transparent hover:border-slate-200 dark:hover:border-zinc-800/80'}`}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => handleDrop(e, groupName)}
                      >
                        <div className={`flex items-center justify-between mb-2 pb-2 cursor-pointer ${!isCollapsed ? 'border-b border-slate-200/50 dark:border-zinc-800/50' : ''}`} onClick={() => toggleCollapseGroup(groupName)}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleGroupExclude(groupName, !isGroupFullyExcluded); }}
                              className="text-xl transition-colors focus:outline-none"
                              title="Tüm grubu hesaba kat/çıkar"
                            >
                              {isGroupFullyExcluded ? <FaRegCircle className="text-slate-300 dark:text-zinc-600 hover:text-slate-500" /> : <FaCheckCircle className="text-emerald-500 hover:text-emerald-600" />}
                            </button>
                            <h4 className={`text-xs font-bold tracking-wide uppercase flex items-center gap-2 ${isGroupFullyExcluded ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-slate-700 dark:text-zinc-300'}`}>
                              {groupName} <span className="bg-slate-200 dark:bg-zinc-800 text-[9px] px-1.5 rounded-md">{allItemsInGroup.length}</span>
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); payAllInGroup(groupName); }}
                              className="text-[9px] px-2 py-1 rounded-md font-bold transition-colors shadow-sm bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-emerald-500 hover:text-white"
                              title="Tümünü Öde"
                            >
                              TÜMÜNÜ ÖDE
                            </button>
                            <span className={`text-xs font-black ${isGroupFullyExcluded ? 'text-slate-400 dark:text-zinc-600' : 'text-rose-500'}`}>- ₺{groupTotal.toLocaleString()}</span>
                            <span className="text-slate-400 dark:text-zinc-500 ml-1">
                              {isCollapsed ? <FaChevronDown className="text-[10px]" /> : <FaChevronUp className="text-[10px]" />}
                            </span>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="space-y-2 mt-2">
                            {/* Alt Gruplar */}
                            {group.subGroups.map(subGroup => {
                              const isSubCollapsed = collapsedGroups[`${groupName}_${subGroup.name}`];
                              const subTotal = subGroup.items.reduce((s, i) => i.excludeFromTotal ? s : s + i.price, 0);
                              return (
                                <div key={subGroup.name} className="bg-slate-100/50 dark:bg-zinc-800/30 rounded-lg p-2 border border-slate-200 dark:border-zinc-700/50">
                                  <div className="flex items-center justify-between cursor-pointer pb-1 border-b border-slate-200/50 dark:border-zinc-700/50" onClick={() => toggleCollapseGroup(`${groupName}_${subGroup.name}`)}>
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">{subGroup.name}</h5>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); payAllInGroup(groupName, subGroup.name); }}
                                        className="text-[8px] px-1.5 py-0.5 rounded-md font-bold transition-colors shadow-sm bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-emerald-500 hover:text-white"
                                        title="Tüm Taksitleri Öde"
                                      >
                                        HEPSİNİ ÖDE
                                      </button>
                                      <span className="text-[10px] font-bold text-rose-400">- ₺{subTotal.toLocaleString()}</span>
                                      <span className="text-slate-400 dark:text-zinc-500">
                                        {isSubCollapsed ? <FaChevronDown className="text-[9px]" /> : <FaChevronUp className="text-[9px]" />}
                                      </span>
                                    </div>
                                  </div>
                                  {!isSubCollapsed && (
                                    <div className="space-y-1 mt-1">
                                      {subGroup.items.map(item => (
                                        <div
                                          key={item.id}
                                          draggable
                                          onDragStart={e => e.dataTransfer.setData('wishId', item.id)}
                                          onDragOver={e => e.preventDefault()}
                                          onDrop={e => { e.stopPropagation(); handleDrop(e, groupName, item.id); }}
                                          className={`flex items-center justify-between p-2 rounded-lg border border-transparent transition group/item cursor-grab active:cursor-grabbing ${item.excludeFromTotal ? 'bg-transparent hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 opacity-70' : 'hover:bg-white dark:hover:bg-zinc-900 hover:border-slate-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/30'}`}
                                        >
                                          <div>
                                            <p className={`text-[11px] font-bold ${item.excludeFromTotal ? 'text-slate-400 dark:text-zinc-600 line-through' : 'text-slate-700 dark:text-zinc-400'}`}>
                                              {item.title}
                                            </p>
                                            <p className="text-[9px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5 font-medium">
                                              <FaCalendarAlt className="text-[8px]" /> {new Date(item.targetDate).toLocaleDateString('tr-TR')}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black ${item.excludeFromTotal ? 'text-slate-400 dark:text-zinc-600' : 'text-rose-400'}`}>- ₺{item.price.toLocaleString()}</span>
                                            <button 
                                              onClick={() => togglePaid(item.id)}
                                              className="text-[9px] px-2 py-1 rounded-md font-bold transition-colors shadow-sm bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-emerald-500 hover:text-white"
                                            >
                                              ÖDE
                                            </button>
                                            <button 
                                              onClick={() => toggleExclude(item.id)}
                                              className="text-sm transition-colors focus:outline-none"
                                              title="Hesaba Kat / Çıkar"
                                            >
                                              {item.excludeFromTotal ? <FaRegCircle className="text-slate-300 dark:text-zinc-600 hover:text-slate-400" /> : <FaCheckCircle className="text-slate-400 hover:text-emerald-600" />}
                                            </button>
                                            <button onClick={() => removeWish(item.id)} className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover/item:opacity-100">
                                              <FaTrashAlt className="text-[10px]" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Normal Grup Öğeleri (Alt gruba dahil olmayanlar) */}
                            {group.items.map(item => (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={e => e.dataTransfer.setData('wishId', item.id)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => { e.stopPropagation(); handleDrop(e, groupName, item.id); }}
                                className={`flex items-center justify-between p-2 rounded-lg border border-transparent transition group/item cursor-grab active:cursor-grabbing ${item.excludeFromTotal ? 'bg-transparent hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 opacity-70' : 'hover:bg-white dark:hover:bg-zinc-900 hover:border-slate-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/30'}`}
                              >
                                <div>
                                  <p className={`text-[11px] font-bold ${item.excludeFromTotal ? 'text-slate-400 dark:text-zinc-600 line-through' : 'text-slate-700 dark:text-zinc-400'}`}>
                                    {item.title}
                                  </p>
                                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5 font-medium">
                                    <FaCalendarAlt className="text-[8px]" /> {new Date(item.targetDate).toLocaleDateString('tr-TR')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black ${item.excludeFromTotal ? 'text-slate-400 dark:text-zinc-600' : 'text-rose-400'}`}>- ₺{item.price.toLocaleString()}</span>
                                  <button 
                                    onClick={() => togglePaid(item.id)}
                                    className="text-[9px] px-2 py-1 rounded-md font-bold transition-colors shadow-sm bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-emerald-500 hover:text-white"
                                  >
                                    ÖDE
                                  </button>
                                  <button 
                                    onClick={() => toggleExclude(item.id)}
                                    className="text-sm transition-colors focus:outline-none"
                                    title="Hesaba Kat / Çıkar"
                                  >
                                    {item.excludeFromTotal ? <FaRegCircle className="text-slate-300 dark:text-zinc-600 hover:text-slate-400" /> : <FaCheckCircle className="text-slate-400 hover:text-emerald-600" />}
                                  </button>
                                  <button onClick={() => removeWish(item.id)} className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover/item:opacity-100">
                                    <FaTrashAlt className="text-[10px]" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Geçmiş Ödemeler (Arşiv) */}
                  {paidWishes.length > 0 && (
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-3 border-2 border-dashed border-transparent transition-colors mt-6">
                      <div className={`flex items-center justify-between pb-2 cursor-pointer ${!collapsedGroups['PAID_ARCHIVE'] ? 'border-b border-emerald-200/50 dark:border-emerald-800/50 mb-2' : ''}`} onClick={() => toggleCollapseGroup('PAID_ARCHIVE')}>
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-bold tracking-wide uppercase flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            Geçmiş Ödemeler <span className="bg-emerald-100 dark:bg-emerald-900/50 text-[9px] px-1.5 rounded-md text-emerald-700 dark:text-emerald-300">{paidWishes.length}</span>
                          </h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-emerald-500">₺{totalPaidWishesCost.toLocaleString()}</span>
                          <span className="text-emerald-500 dark:text-emerald-400">
                            {collapsedGroups['PAID_ARCHIVE'] ? <FaChevronDown className="text-[10px]" /> : <FaChevronUp className="text-[10px]" />}
                          </span>
                        </div>
                      </div>
                      
                      {!collapsedGroups['PAID_ARCHIVE'] && (
                        <div className="space-y-1">
                          {paidWishes.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg opacity-70 bg-transparent border border-emerald-100 dark:border-emerald-800/30">
                              <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 line-through">
                                  {item.title}
                                </p>
                                <p className="text-[9px] text-slate-400 dark:text-zinc-600 flex items-center gap-1 mt-0.5 font-medium">
                                  <FaCalendarAlt className="text-[8px]" /> {new Date(item.targetDate).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-400 dark:text-zinc-600 line-through">- ₺{item.price.toLocaleString()}</span>
                                <span className="text-[9px] px-2 py-1 rounded-md font-bold bg-emerald-500 text-white shadow-sm">
                                  ÖDENDİ
                                </span>
                                <button onClick={() => removeWish(item.id)} className="text-slate-300 hover:text-rose-500 transition">
                                  <FaTrashAlt className="text-[10px]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BudgetPlanner;