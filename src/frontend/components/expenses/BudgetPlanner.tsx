import React, { useEffect, useMemo, useState } from 'react';
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
  FaCoins
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

  // Veritabanından Veri Çekme
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'futurePlans', user.uid));
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

  // Veritabanına Kaydetme Fonksiyonu
  const saveToFirebase = async (overrides?: Partial<PlannerData>) => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'futurePlans', user.uid), {
        walletBalance,
        incomes,
        wishes,
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
  const totalWishesCost = useMemo(() => wishes.reduce((sum, item) => sum + item.price, 0), [wishes]);

  // Toplam Para = Cebimdeki Para + Gelecek Paralar
  const totalMoney = walletBalance + totalExpectedIncome;
  // Kalan Sonuç = Toplam Para - Alınacaklar Toplamı
  const finalResult = totalMoney - totalWishesCost;

  // --- EKLEME VE SİLME İŞLEMLERİ ---
  const addIncome = async () => {
    const amount = Number(incomeAmt);
    if (!incomeTitle || !amount || !incomeDate) return;

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
    if (!wishTitle || !price || !wishDate) return;

    const newItem: WishItem = {
      id: Math.random().toString(36).slice(2),
      title: wishTitle,
      price,
      targetDate: wishDate, // Hedef tarih eklendi
    };

    const updated = [...wishes, newItem];
    setWishes(updated);
    setWishTitle('');
    setWishPrice('');
    setWishDate('');
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
              setTimeout(() => saveToFirebase({ walletBalance: val }), 800);
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
                <input
                  type="date"
                  value={incomeDate} onChange={e => setIncomeDate(e.target.value)}
                  className="w-1/2 bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none text-slate-500 dark:text-slate-400"
                />
                <button
                  onClick={addIncome}
                  className="w-8 h-8 shrink-0 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition text-xs"
                >
                  <FaPlus />
                </button>
              </div>
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
              </div>
            </div>

            {/* Giriş Formu */}
            <div className="flex flex-col gap-2.5 mb-6 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900">
              <input
                type="text"
                placeholder="Ne alacaksın? (Örn: Yeni Telefon)"
                value={wishTitle} onChange={e => setWishTitle(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none dark:text-white font-medium"
              />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Fiyatı (₺)"
                  value={wishPrice} onChange={e => setWishPrice(e.target.value)}
                  className="w-1/2 bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none dark:text-white font-bold"
                />
                <input
                  type="date"
                  value={wishDate} onChange={e => setWishDate(e.target.value)}
                  className="w-1/2 bg-transparent border-b border-slate-200 dark:border-zinc-700 py-1.5 text-xs focus:outline-none text-slate-500 dark:text-slate-400"
                />
                <button
                  onClick={addWish}
                  className="w-8 h-8 shrink-0 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition text-xs"
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {wishes.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 italic">Alışveriş listeniz boş, yeni hedefler ekleyin!</p>
              ) : (
                wishes.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/60 border border-transparent hover:border-slate-100 dark:hover:border-zinc-800 transition group">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{item.title}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-1 font-medium">
                        <FaCalendarAlt className="text-[9px]" /> {new Date(item.targetDate).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-rose-500">- ₺{item.price.toLocaleString()}</span>
                      <button onClick={() => removeWish(item.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BudgetPlanner;