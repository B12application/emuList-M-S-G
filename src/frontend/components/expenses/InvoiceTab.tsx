import React, { useEffect, useMemo, useState } from 'react';
import { format, addYears, differenceInCalendarDays, parseISO, isValid, startOfDay, subDays } from 'date-fns';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../../backend/config/firebaseConfig';
import { addCalendarAlert } from '../../../backend/services/plannerService';
import { FaBell, FaCalendarAlt, FaCheckCircle, FaClock, FaFileInvoiceDollar, FaHistory, FaShieldAlt, FaPlus, FaTimes } from 'react-icons/fa';

const BILL_COLLECTION = 'invoiceSubscriptions';
const BILL_CATEGORIES = ['Fatura', 'İnternet', 'Telefon', 'Elektrik', 'Su', 'Doğalgaz', 'Diğer'];

const defaultForm = () => ({
  title: '',
  amount: '' as unknown as number,
  category: 'Fatura',
  description: '',
  contractStart: '',
  contractYears: '' as unknown as number,
  notifyBeforeDays: '' as unknown as number
});

type BillSubscription = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  contractStart: string;
  contractYears: number;
  notifyBeforeDays: number;
  contractEndDate: string;
  reminderDate: string;
  billingCycle: 'yearly';
  createdAt?: unknown;
};

const safeParseDate = (dateString?: string) => {
  if (!dateString) return null;
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : null;
};

const calculateContractDates = (contractStart: string, contractYears: number, notifyBeforeDays: number) => {
  const startDate = safeParseDate(contractStart);
  if (!startDate || !contractYears || contractYears <= 0) return null;

  const contractEndDateObj = addYears(startDate, contractYears);
  const reminderDateObj = subDays(contractEndDateObj, notifyBeforeDays || 0);
  const daysRemaining = differenceInCalendarDays(contractEndDateObj, startOfDay(new Date()));

  return {
    contractEndDate: format(contractEndDateObj, 'yyyy-MM-dd'),
    reminderDate: format(reminderDateObj, 'yyyy-MM-dd'),
    daysRemaining,
    isExpired: daysRemaining < 0,
    isUrgent: daysRemaining >= 0 && daysRemaining <= (notifyBeforeDays || 0)
  };
};

export default function InvoiceTab() {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<BillSubscription[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const billCategories = BILL_CATEGORIES;

  useEffect(() => {
    const loadRecords = async () => {
      if (!user?.uid) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const q = query(collection(db, BILL_COLLECTION), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BillSubscription));
        setRecords(loaded);
      } catch (error) {
        console.error('Failed to load invoice subscriptions', error);
        toast.error('Fatura kayıtları yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, [user?.uid]);

  const activeBills = useMemo(() => {
    const today = startOfDay(new Date());
    return records
      .map(record => {
        const computed = calculateContractDates(record.contractStart, Number(record.contractYears || 0), Number(record.notifyBeforeDays || 0));
        const contractEndDate = record.contractEndDate || computed?.contractEndDate || '';
        const reminderDate = record.reminderDate || computed?.reminderDate || '';
        const daysRemaining = computed?.daysRemaining ?? null;

        return {
          ...record,
          contractEndDate,
          reminderDate,
          daysRemaining
        };
      })
      .filter(record => {
        const endDate = safeParseDate(record.contractEndDate);
        if (!endDate) return true;
        return differenceInCalendarDays(endDate, today) >= 0;
      })
      .sort((a, b) => (a.contractEndDate || '').localeCompare(b.contractEndDate || ''));
  }, [records]);

  const contractPreview = useMemo(() => {
    return calculateContractDates(form.contractStart, Number(form.contractYears || 0), Number(form.notifyBeforeDays || 0));
  }, [form.contractStart, form.contractYears, form.notifyBeforeDays]);

  const savedSummary = useMemo(() => {
    const items = activeBills;
    const activeContracts = items.filter(item => typeof item.daysRemaining === 'number' && item.daysRemaining >= 0).length;
    const nearestEnd = items
      .filter(item => typeof item.daysRemaining === 'number' && item.daysRemaining >= 0)
      .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0))[0];

    return {
      totalBills: items.length,
      activeContracts,
      nearestEnd
    };
  }, [activeBills]);

  const reset = () => setForm(defaultForm());

  const handleSave = async () => {
    if (!form.title || !form.amount) return toast.error('Lütfen başlık ve tutar girin');
    if (!form.contractStart) return toast.error('Lütfen sözleşme başlangıç tarihini girin');
    if (!form.contractYears || Number(form.contractYears) <= 0) return toast.error('Lütfen geçerli bir sözleşme süresi seçin');
    if (!user?.uid) return toast.error('Kayıt için önce giriş yapmalısın');
    setIsSaving(true);
    try {
      const contractMeta = calculateContractDates(form.contractStart, Number(form.contractYears), Number(form.notifyBeforeDays || 0));
      if (!contractMeta) throw new Error('Geçersiz sözleşme başlangıç tarihi');

      await addDoc(collection(db, BILL_COLLECTION), {
        userId: user.uid,
        title: form.title,
        amount: Number(form.amount),
        date: form.contractStart,
        category: form.category || 'Fatura',
        description: form.description || '',
        contractStart: form.contractStart,
        contractYears: Number(form.contractYears),
        notifyBeforeDays: Number(form.notifyBeforeDays || 0),
        contractEndDate: contractMeta.contractEndDate,
        reminderDate: contractMeta.reminderDate,
        billingCycle: 'yearly'
      });

      if (user) {
        await addCalendarAlert({
          userId: user.uid,
          label: `${form.title} - Sözleşme Bitişi`,
          startDate: contractMeta.contractEndDate,
          endDate: contractMeta.contractEndDate,
          color: '#0ea5e9'
        });

        if (form.notifyBeforeDays && Number(form.notifyBeforeDays) > 0) {
          await addCalendarAlert({
            userId: user.uid,
            label: `${form.title} - Sözleşme Bitiyor Yaklaşıyor`,
            startDate: contractMeta.reminderDate,
            endDate: contractMeta.reminderDate,
            color: '#f97316'
          });
        }
      }

      toast.success('Fatura kaydedildi ve bildirimler ayarlandı');
      reset();
      setIsModalOpen(false); // Kayıt başarılı olunca modalı kapat
      
      setRecords(prev => [
        {
          id: crypto.randomUUID(),
          userId: user?.uid || '',
          title: form.title,
          amount: Number(form.amount),
          date: form.contractStart,
          category: form.category || 'Fatura',
          description: form.description || '',
          contractStart: form.contractStart,
          contractYears: Number(form.contractYears),
          notifyBeforeDays: Number(form.notifyBeforeDays || 0),
          contractEndDate: contractMeta.contractEndDate,
          reminderDate: contractMeta.reminderDate,
          billingCycle: 'yearly'
        },
        ...prev
      ]);
    } catch (err: any) {
      console.error('Invoice save failed', err);
      toast.error(err?.message || 'Kaydetme başarısız');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* İSTATİSTİKLER (HER ZAMAN GÖRÜNÜR) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-5 border border-stone-100 dark:border-zinc-800">
          <div className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center gap-2"><FaFileInvoiceDollar /> Kayıt</div>
          <div className="mt-3 text-3xl font-black text-stone-900 dark:text-white">{savedSummary.totalBills}</div>
          <div className="mt-2 text-xs font-bold text-stone-500 dark:text-zinc-400">Fatura / abonelik kaydı</div>
        </div>

        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-5 border border-stone-100 dark:border-zinc-800">
          <div className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center gap-2"><FaShieldAlt /> Aktif sözleşme</div>
          <div className="mt-3 text-3xl font-black text-stone-900 dark:text-white">{savedSummary.activeContracts}</div>
          <div className="mt-2 text-xs font-bold text-stone-500 dark:text-zinc-400">Geri sayımı süren abonelikler</div>
        </div>

        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-5 border border-stone-100 dark:border-zinc-800">
          <div className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center gap-2"><FaClock /> En yakın bitiş</div>
          <div className="mt-3 text-3xl font-black text-stone-900 dark:text-white">{savedSummary.nearestEnd?.daysRemaining ?? '—'}</div>
          <div className="mt-2 text-xs font-bold text-stone-500 dark:text-zinc-400">{savedSummary.nearestEnd ? `${savedSummary.nearestEnd.title} • ${savedSummary.nearestEnd.contractEndDate}` : 'Henüz sözleşme yok'}</div>
        </div>

        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-5 border border-stone-100 dark:border-zinc-800">
          <div className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500 flex items-center gap-2"><FaBell /> Hatırlatma</div>
          <div className="mt-3 text-3xl font-black text-stone-900 dark:text-white">{form.notifyBeforeDays || 0}</div>
          <div className="mt-2 text-xs font-bold text-stone-500 dark:text-zinc-400">Gün önce uyarı oluşturulur</div>
        </div>
      </div>

      {/* LİSTE BAŞLIĞI VE YENİ EKLE BUTONU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-2">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 flex items-center gap-2"><FaBell /> Kayıtlı Faturalar</h4>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-black uppercase tracking-[0.12em] text-[11px] hover:opacity-80 transition-opacity shadow-sm"
        >
          <FaPlus /> Yeni Ekle
        </button>
      </div>

      {/* KAYITLI FATURALAR LİSTESİ */}
      <div className="bg-white/50 dark:bg-zinc-900/40 rounded-[2rem] p-6 sm:p-8 border border-stone-100 dark:border-zinc-800">
        {isLoading ? (
          <p className="text-sm font-medium text-stone-500 dark:text-zinc-400">Faturalar yükleniyor...</p>
        ) : activeBills.length === 0 ? (
          <p className="text-sm font-medium text-stone-500 dark:text-zinc-400">Henüz kayıtlı fatura veya aboneliğin bulunmuyor. Yeni bir tane ekleyerek başlayabilirsin.</p>
        ) : (
          <div className="space-y-4">
            {activeBills.map(bill => {
              const daysRemaining = typeof bill.daysRemaining === 'number' ? bill.daysRemaining : null;
              const statusLabel = daysRemaining === null
                ? 'Bildirim yok'
                : daysRemaining < 0
                  ? 'Süresi doldu'
                  : daysRemaining <= Number(bill.notifyBeforeDays || 7)
                    ? 'Yaklaşıyor'
                    : 'Aktif';

              return (
                <div key={bill.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 bg-stone-50/70 dark:bg-zinc-800/40 rounded-2xl border border-stone-100 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1.5">
                      <div className="text-base font-black text-stone-900 dark:text-white truncate">{bill.title}</div>
                      <span className="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.16em] bg-stone-900 text-white dark:bg-white dark:text-stone-900">{statusLabel}</span>
                    </div>
                    <div className="text-xs font-bold text-stone-500 dark:text-zinc-400">
                      {bill.category}
                      {bill.contractStart ? ` • Başlangıç: ${bill.contractStart}` : ''}
                      {bill.contractEndDate ? ` • Bitiş: ${bill.contractEndDate}` : ''}
                    </div>
                    {bill.description ? <div className="mt-2 text-sm text-stone-600 dark:text-zinc-300 font-medium">{bill.description}</div> : null}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xl font-black text-stone-900 dark:text-white">{Number(bill.amount).toLocaleString('tr-TR')} ₺</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-400 dark:text-zinc-500 mt-1">
                        {bill.daysRemaining === null ? 'Geri sayım yok' : `${Math.max(Number(bill.daysRemaining), 0)} gün kaldı`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL / AÇILIR PENCERE (YENİ EKLE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm">
          {/* Modal Container */}
          <div className="bg-stone-50 dark:bg-zinc-900 rounded-[2rem] border border-stone-200 dark:border-zinc-800 w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl relative flex flex-col">
            
            {/* Modal Header & Close Button */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-stone-50/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800 rounded-t-[2rem]">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-white flex items-center gap-2">
                <FaHistory className="text-stone-400" /> Fatura & Abonelik Ekle
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-stone-200 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-300 dark:hover:bg-zinc-700 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body: Form and Preview Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
              
              {/* Sol Taraf: Form */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2 ml-1">Kayıt Başlığı</label>
                    <input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="Örn: Vodafone Ev İnterneti"
                      className="w-full p-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2 ml-1">Aylık Fatura Tutarı (₺)</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value === '' ? '' as unknown as number : Number(e.target.value) })}
                      placeholder="Örn: 249"
                      className="w-full p-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2 ml-1">Kategori</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full p-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10"
                    >
                      {billCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2 ml-1">Sözleşme Başlangıcı</label>
                    <input
                      type="date"
                      value={form.contractStart}
                      onChange={e => setForm({ ...form, contractStart: e.target.value })}
                      className="w-full p-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2 ml-1">Taahhüt Süresi</label>
                    <select
                      value={form.contractYears}
                      onChange={e => setForm({ ...form, contractYears: e.target.value === '' ? '' as unknown as number : Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10"
                    >
                      <option value="" disabled hidden>Süre seçin</option>
                      <option value="1">1 Yıl</option>
                      <option value="2">2 Yıl</option>
                      <option value="3">3 Yıl</option>
                      <option value="4">4 Yıl</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2 ml-1">Hatırlatma (Gün Önce)</label>
                    <input
                      type="number"
                      min={1}
                      value={form.notifyBeforeDays}
                      onChange={e => setForm({ ...form, notifyBeforeDays: e.target.value === '' ? '' as unknown as number : Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10"
                      placeholder="Örn: 7"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2 ml-1">Ek Açıklama (Opsiyonel)</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full p-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 min-h-[100px]"
                      placeholder="Fatura numarası veya ekstra detaylar..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3.5 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-[0.12em] text-[11px] hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet & Bildirim Oluştur'}
                  </button>
                  <button
                    onClick={reset}
                    className="px-6 py-3.5 rounded-2xl bg-stone-200 dark:bg-zinc-700 text-stone-900 dark:text-white font-black uppercase tracking-[0.12em] text-[11px] w-full sm:w-auto"
                  >
                    Temizle
                  </button>
                </div>
              </div>

              {/* Sağ Taraf: Canlı Gösterim */}
              <div className="bg-white/50 dark:bg-zinc-800/50 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-700 h-fit">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-500 dark:text-zinc-400 flex items-center gap-2 mb-6"><FaCalendarAlt /> Canlı Taahhüt Özeti</h4>
                {contractPreview ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-white/70 dark:bg-zinc-900/40 border border-stone-100 dark:border-zinc-800 p-5">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400 dark:text-zinc-500">Bitiş Tarihi</div>
                        <div className="mt-1 text-xl font-black text-stone-900 dark:text-white">{contractPreview.contractEndDate}</div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.16em] ${contractPreview.isExpired ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : contractPreview.isUrgent ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>
                        {contractPreview.isExpired ? 'Süresi doldu' : contractPreview.isUrgent ? 'Yaklaşıyor' : 'Aktif'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/40 border border-stone-100 dark:border-zinc-800 p-5">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400 dark:text-zinc-500">Kalan Gün</div>
                        <div className="mt-1 text-3xl font-black text-stone-900 dark:text-white">{contractPreview.daysRemaining}</div>
                      </div>
                      <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/40 border border-stone-100 dark:border-zinc-800 p-5">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400 dark:text-zinc-500">İlk Hatırlatma</div>
                        <div className="mt-1 text-xl font-black text-stone-900 dark:text-white">{contractPreview.reminderDate}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-stone-900 text-white p-5 mt-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60 mb-2">Bildirim Planı</div>
                      <div className="text-sm font-bold leading-relaxed text-stone-200">Taahhüt bitmeden {form.notifyBeforeDays || 0} gün önce ilk uyarı, bitiş gününde de son uyarı otomatik oluşturulur.</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/40 border border-stone-100 dark:border-zinc-800 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                    <FaCalendarAlt className="text-4xl text-stone-200 dark:text-zinc-700 mb-4" />
                    <p className="text-sm font-medium text-stone-500 dark:text-zinc-400 leading-relaxed">
                      Sözleşme başlangıcı ve yıl bilgisini girerek canlı kalan gün hesabını görebilirsin.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}