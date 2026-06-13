import React, { useEffect, useMemo, useState, useRef } from 'react';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  FaPlus, FaTrash, FaArrowRight, FaArrowLeft,
  FaCheck, FaSpinner, FaUndo, FaCircle
} from 'react-icons/fa';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../backend/config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import type { Expense } from '../../hooks/useExpenses';

type Props = {
  t: any;
  isDark: boolean;
  expenses: Expense[];
  selectedMonth: string;
};

type PlannedItem = {
  id: string;
  title: string;
  price: number;
  paid: boolean;
  paidAt?: string;
};

type BudgetData = {
  salary: number;
  currentBalance: number;
  planned: PlannedItem[];
  updatedAt: string;
};

const BudgetPlanner: React.FC<Props> = ({ t, isDark, expenses, selectedMonth }) => {
  const { user } = useAuth();
  const [salary, setSalary] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [planned, setPlanned] = useState<PlannedItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'budgetPlans', user.uid));
        if (snap.exists()) {
          const d = snap.data() as BudgetData;
          setSalary(d.salary || 0);
          setCurrentBalance(d.currentBalance || 0);
          setPlanned(d.planned || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const saveToFirebase = async (overrides?: Partial<BudgetData>) => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'budgetPlans', user.uid), {
        salary,
        currentBalance,
        planned,
        ...overrides,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // HESAPLAMALAR
  const thisMonthPayments = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'all') return 0;
    const [y, m] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(y, m - 1));
    const end = endOfMonth(new Date(y, m - 1));
    return expenses
      .filter(e => e.direction !== 'gelen')
      .filter(e => isWithinInterval(parseISO(e.date), { start, end }))
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses, selectedMonth]);

  const unpaidTotal = useMemo(() => planned.filter(p => !p.paid).reduce((s, p) => s + p.price, 0), [planned]);
  const paidTotal = useMemo(() => planned.filter(p => p.paid).reduce((s, p) => s + p.price, 0), [planned]);
  const plannedTotal = useMemo(() => planned.reduce((s, p) => s + p.price, 0), [planned]);

  const remainingBudget = currentBalance + salary - thisMonthPayments - unpaidTotal;
  const deficit = thisMonthPayments + unpaidTotal - currentBalance;

  const addPlanned = async () => {
    const price = Number(newPrice || 0);
    if (!newTitle || !price) return;
    const updated = [...planned, { id: Math.random().toString(36).slice(2), title: newTitle, price, paid: false }];
    setPlanned(updated);
    setNewTitle('');
    setNewPrice('');
    await saveToFirebase({ planned: updated });
  };

  const togglePaid = async (id: string) => {
    const updated = planned.map(p =>
      p.id === id
        ? {
          ...p,
          paid: !p.paid,
          paidAt: !p.paid ? new Date().toISOString() : undefined,
        }
        : p
    );
    setPlanned(updated);

    // ✅ Ödendiğinde mevcut bakiyeyi düş
    const item = planned.find(p => p.id === id);
    if (item && !item.paid) {
      const newBalance = currentBalance - item.price;
      setCurrentBalance(newBalance);
      await saveToFirebase({ planned: updated, currentBalance: newBalance });
    } else {
      // Geri alındığında bakiyeyi geri ekle
      if (item && item.paid) {
        const newBalance = currentBalance + item.price;
        setCurrentBalance(newBalance);
        await saveToFirebase({ planned: updated, currentBalance: newBalance });
      } else {
        await saveToFirebase({ planned: updated });
      }
    }
  };

  const removePlanned = async (id: string) => {
    const updated = planned.filter(p => p.id !== id);
    setPlanned(updated);
    await saveToFirebase({ planned: updated });
  };

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <FaSpinner className="h-8 w-8 animate-spin text-slate-300 dark:text-zinc-600" />
      </div>
    );
  }

  const paidCount = planned.filter(p => p.paid).length;

  return (
    <div className="space-y-16 py-8">
      {/* ═══════════════════════════════════════════
          HERO SAYILAR — Büyük tipografi, yatay scroll
          ═══════════════════════════════════════════ */}
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Bütçe</span>
            <span className="w-8 h-[1px] bg-slate-300 dark:bg-zinc-700" />
            <span className="text-[10px] text-slate-400">
              {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          {saving && (
            <span className="text-[10px] text-slate-400 animate-pulse">Kaydediliyor…</span>
          )}
        </div>

        {/* Yatay scroll alanı */}
        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <FaArrowLeft className="text-xs" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <FaArrowRight className="text-xs" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-8 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          >
            {/* Kart 1: Bakiye */}
            <div className="snap-start shrink-0 w-[300px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">
                Mevcut Bakiye
              </p>
              <p className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                ₺{currentBalance.toLocaleString()}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">Nakit</span>
              </div>
            </div>

            {/* Kart 2: Maaş */}
            <div className="snap-start shrink-0 w-[300px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">
                Aylık Gelir
              </p>
              <div className="relative inline-block">
                <input
                  value={salary || ''}
                  onChange={e => {
                    const v = Number(e.target.value || 0);
                    setSalary(v);
                    setTimeout(() => saveToFirebase({ salary: v }), 500);
                  }}
                  type="number"
                  placeholder="0"
                  className="w-[250px] text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums bg-transparent border-b-4 border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white focus:outline-none pb-2 transition"
                />
                <span className="absolute -top-2 -right-8 text-sm text-slate-400">₺</span>
              </div>
            </div>

            {/* Kart 3: Bu Ay Harcanan */}
            <div className="snap-start shrink-0 w-[300px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">
                Bu Ay Harcanan
              </p>
              <p className="text-6xl font-black text-rose-500 dark:text-rose-400 tracking-tighter tabular-nums">
                ₺{thisMonthPayments.toLocaleString()}
              </p>
              <div className="mt-4 w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-700"
                  style={{ width: `${salary > 0 ? Math.min((thisMonthPayments / salary) * 100, 100) : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {salary > 0 ? Math.round((thisMonthPayments / salary) * 100) : 0}% gelirin
              </p>
            </div>

            {/* Kart 4: Kalan */}
            <div className="snap-start shrink-0 w-[300px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">
                Kullanılabilir
              </p>
              <p className={`text-6xl font-black tracking-tighter tabular-nums ${remainingBudget >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                {remainingBudget < 0 ? '−' : ''}₺{Math.abs(remainingBudget).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-3">
                {remainingBudget >= 0 ? 'Harcanabilir bütçe' : 'Bütçe aşımı'}
              </p>
            </div>

            {/* Kart 5: Açık */}
            <div className="snap-start shrink-0 w-[300px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">
                Karşılanması Gereken
              </p>
              <p className={`text-6xl font-black tracking-tighter tabular-nums ${deficit > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                ₺{Math.max(0, deficit).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-3">
                {deficit > 0 ? 'Mevcut bakiyeyi aşan tutar' : 'Bakiye yeterli ✓'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          PLANLANAN ALIMLAR — Swiss poster list
          ═══════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
              Planlanan
            </span>
            <span className="text-[10px] text-slate-300">{planned.length} kalem</span>
            <span className="text-[10px] text-emerald-500">{paidCount} ödendi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Bekleyen:</span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
              ₺{unpaidTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Ekleme — inline, minimal */}
        <div className="flex gap-1 mb-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
          <input
            placeholder="Ne alacaksın?"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPlanned()}
            className="flex-1 text-sm font-medium bg-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-zinc-600 focus:outline-none"
          />
          <input
            placeholder="Fiyat"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPlanned()}
            type="number"
            className="w-24 text-sm font-medium bg-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-zinc-600 focus:outline-none text-right"
          />
          <span className="text-sm text-slate-400 mr-2">₺</span>
          <button
            onClick={addPlanned}
            className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center transition hover:scale-110 active:scale-95"
          >
            <FaPlus className="text-[10px]" />
          </button>
        </div>

        {/* Liste — editorial, her satır bir nefes */}
        <div className="space-y-1">
          {planned.length === 0 ? (
            <p className="text-sm text-slate-300 dark:text-zinc-600 italic py-12">
              Henüz planlanmış harcama yok.
            </p>
          ) : (
            planned.map(p => (
              <div
                key={p.id}
                className={`group flex items-center gap-4 py-3.5 px-1 transition-colors ${p.paid
                    ? 'opacity-50'
                    : 'hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
              >
                {/* Tik — büyük, brutaldan esinli */}
                <button
                  onClick={() => togglePaid(p.id)}
                  className={`w-6 h-6 shrink-0 rounded-sm flex items-center justify-center transition-all ${p.paid
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-slate-300 dark:border-zinc-700 text-transparent hover:border-slate-900 dark:hover:border-white'
                    }`}
                >
                  {p.paid && <FaCheck className="text-[10px]" />}
                </button>

                {/* İçerik */}
                <div className="flex-1 min-w-0 flex items-baseline justify-between gap-4">
                  <span className={`text-sm ${p.paid ? 'line-through text-slate-400' : 'font-medium text-slate-900 dark:text-white'}`}>
                    {p.title}
                  </span>
                  <span className={`text-sm tabular-nums shrink-0 ${p.paid ? 'text-slate-400' : 'font-bold text-slate-700 dark:text-zinc-300'}`}>
                    ₺{p.price.toLocaleString()}
                  </span>
                </div>

                {/* Aksiyon — hover'da görünür */}
                <button
                  onClick={() => p.paid ? togglePaid(p.id) : removePlanned(p.id)}
                  className="shrink-0 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500"
                  title={p.paid ? 'Geri al' : 'Sil'}
                >
                  {p.paid ? <FaUndo className="text-[10px]" /> : <FaTrash className="text-[10px]" />}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Özet bar — altta sabit gibi */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
          <span>Ödenen: ₺{paidTotal.toLocaleString()}</span>
          <span>Kalan: ₺{unpaidTotal.toLocaleString()}</span>
          <span>Toplam: ₺{plannedTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ALT BİLGİ — Minimal
          ═══════════════════════════════════════════ */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-zinc-800 pt-6">
        <span>Bakiye + Maaş = ₺{(currentBalance + salary).toLocaleString()}</span>
        <span className="flex items-center gap-1.5">
          <FaCircle className={`text-[6px] ${saving ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
          {saving ? 'Senkronize ediliyor' : 'Güncel'}
        </span>
      </div>
    </div>
  );
};

export default BudgetPlanner;