import React, { useEffect, useMemo, useState } from 'react';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { FaPlus, FaTrash, FaWallet, FaCalendarCheck, FaClock, FaShoppingCart, FaPiggyBank, FaArrowUp, FaArrowDown, FaCheck, FaSpinner } from 'react-icons/fa';
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

  // Firebase'den yükle
  useEffect(() => {
    if (!user) return;
    const loadBudget = async () => {
      try {
        const docRef = doc(db, 'budgetPlans', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as BudgetData;
          setSalary(data.salary || 0);
          setCurrentBalance(data.currentBalance || 0);
          setPlanned(data.planned || []);
        }
      } catch (err) {
        console.error('Bütçe yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBudget();
  }, [user]);

  // Firebase'e kaydet
  const saveToFirebase = async (data: Partial<BudgetData>) => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'budgetPlans', user.uid);
      await setDoc(docRef, {
        salary,
        currentBalance,
        planned,
        ...data,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (err) {
      console.error('Bütçe kaydedilemedi:', err);
    } finally {
      setSaving(false);
    }
  };

  // Değişiklikleri otomatik kaydet (debounce istersen ekleyebilirsin)
  useEffect(() => {
    if (loading || !user) return;
    const timeout = setTimeout(() => {
      saveToFirebase({ salary, currentBalance, planned });
    }, 800); // 800ms debounce
    return () => clearTimeout(timeout);
  }, [salary, currentBalance, planned]);

  // ... hesaplamalar aynı ...

  const thisMonthPayments = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'all') return 0;
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    return expenses
      .filter(e => e.direction !== 'gelen')
      .filter(e => isWithinInterval(parseISO(e.date), { start, end }))
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses, selectedMonth]);

  const futurePayments = useMemo(() => {
    const now = new Date();
    const end = endOfMonth(now);
    return expenses
      .filter(e => e.direction !== 'gelen')
      .filter(e => parseISO(e.date) > end)
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const plannedTotal = useMemo(() => planned.reduce((s, p) => s + p.price, 0), [planned]);
  const needed = useMemo(() => thisMonthPayments + plannedTotal - currentBalance, [thisMonthPayments, plannedTotal, currentBalance]);
  const afterSalary = useMemo(() => salary - (thisMonthPayments + plannedTotal), [salary, thisMonthPayments, plannedTotal]);

  const addPlanned = () => {
    const price = Number(newPrice || 0);
    if (!newTitle || !price) return;
    setPlanned(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      title: newTitle,
      price,
      paid: false,
    }]);
    setNewTitle('');
    setNewPrice('');
  };

  const removePlanned = (id: string) => setPlanned(prev => prev.filter(p => p.id !== id));

  const togglePaid = (id: string) => {
    setPlanned(prev => prev.map(p =>
      p.id === id
        ? { ...p, paid: !p.paid, paidAt: !p.paid ? new Date().toISOString() : undefined }
        : p
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FaSpinner className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <FaWallet className="text-sm" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Bütçe Planlayıcı</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Gelir, gider ve planlamalar</p>
          </div>
        </div>
        {saving && (
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <FaSpinner className="animate-spin text-[10px]" />
            Kaydediliyor...
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* ── Gelir & Bakiye Inputs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <FaArrowUp className="inline mr-1 text-emerald-500 text-[10px]" />
              Maaş
            </label>
            <div className="relative">
              <input
                value={salary || ''}
                onChange={e => setSalary(Number(e.target.value || 0))}
                type="number"
                placeholder="0"
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-300 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-600 dark:focus:border-emerald-700 dark:focus:ring-emerald-950"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₺</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <FaPiggyBank className="inline mr-1 text-amber-500 text-[10px]" />
              Mevcut Bakiye
            </label>
            <div className="relative">
              <input
                value={currentBalance || ''}
                onChange={e => setCurrentBalance(Number(e.target.value || 0))}
                type="number"
                placeholder="0"
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-300 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-600 dark:focus:border-amber-700 dark:focus:ring-amber-950"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₺</span>
            </div>
          </div>
        </div>

        {/* ── Özet Kartları ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <FaCalendarCheck className="text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Bu Ayki Ödemeler</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums truncate">{thisMonthPayments.toLocaleString()} ₺</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <FaClock className="text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Gelecek Ödemeler</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums truncate">{futurePayments.toLocaleString()} ₺</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <FaShoppingCart className="text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Planlanan</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums truncate">{plannedTotal.toLocaleString()} ₺</p>
            </div>
          </div>
        </div>

        {/* ── Planlanan Alımlar ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
            Planlanan Alımlar
            <span className="ml-2 text-[10px] font-normal normal-case">
              ({planned.filter(p => p.paid).length}/{planned.length} ödendi)
            </span>
          </p>

          {/* Add new */}
          <div className="flex gap-2 mb-3">
            <input
              placeholder="Ürün veya not..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-900"
            />
            <input
              placeholder="Fiyat"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              type="number"
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-900"
            />
            <button
              onClick={addPlanned}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <FaPlus className="text-xs" />
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {planned.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400 dark:border-zinc-800 dark:text-zinc-500">
                Henüz planlanmış bir harcama yok
              </div>
            ) : (
              planned.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    p.paid
                      ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Tik butonu */}
                  <button
                    onClick={() => togglePaid(p.id)}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                      p.paid
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 text-transparent hover:border-emerald-400 hover:text-emerald-400 dark:border-zinc-700 dark:hover:border-emerald-600'
                    }`}
                  >
                    <FaCheck className="text-[10px]" />
                  </button>

                  {/* İçerik */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${p.paid ? 'text-slate-400 line-through dark:text-zinc-500' : 'text-slate-900 dark:text-white'}`}>
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs ${p.paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {p.price.toLocaleString()} ₺
                      </p>
                      {p.paid && p.paidAt && (
                        <span className="text-[10px] text-emerald-500 dark:text-emerald-400">
                          ✓ {new Date(p.paidAt).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sil butonu */}
                  <button
                    onClick={() => removePlanned(p.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Bakiye Özeti ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              <FaArrowDown className="inline mr-1 text-red-500 text-[10px]" />
              Gerekli Tutar (Mevcut eksi)
            </span>
            <span className={`text-base font-bold tabular-nums ${needed > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {needed.toLocaleString()} ₺
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-zinc-800">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              <FaArrowUp className="inline mr-1 text-emerald-500 text-[10px]" />
              Maaş Sonrası Bakiye
            </span>
            <span className={`text-base font-bold tabular-nums ${afterSalary < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {afterSalary.toLocaleString()} ₺
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;