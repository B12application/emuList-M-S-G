import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  FaChartBar, FaFileImport, FaFileAlt, FaFilePdf, FaCloudUploadAlt,
  FaSpinner, FaCheckCircle, FaTimesCircle, FaChartPie, FaArrowUp,
  FaArrowDown, FaWallet, FaCalendarCheck, FaFire, FaChartLine
} from 'react-icons/fa';
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { parsePdfFiles, type ParsedTransaction, type PdfParseProgress } from '../../utils/pdfParserService';

interface ReportsTabProps {
  t: (key: string) => string;
  isDark: boolean;
  monthlyChartData: any[];
  monthlySummary: any[];
  onPdfImport: (transactions: ParsedTransaction[]) => void;
  // Yeni props'lar - ana sayfadan gelecek
  expenses?: any[];
  categories?: string[];
}

const PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
const AREA_COLORS = { gradient1: '#f97316', gradient2: '#3b82f6' };

const ReportsTab: React.FC<ReportsTabProps> = ({
  t,
  isDark,
  monthlyChartData,
  monthlySummary,
  onPdfImport,
  expenses = [],
  categories = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<PdfParseProgress | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── YENİ: Kategori dağılımı hesaplama ──
  const categoryBreakdown = useMemo(() => {
    if (!expenses.length) return [];
    const data: Record<string, number> = {};
    expenses
      .filter((e: any) => e.direction !== 'gelen')
      .forEach((e: any) => {
        const cat = e.category || 'Diğer';
        data[cat] = (data[cat] || 0) + e.amount;
      });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [expenses]);

  // ── YENİ: Günlük harcama trendi (son 30 gün) ──
  const dailyTrend = useMemo(() => {
    if (!expenses.length) return [];
    const today = new Date();
    const data: Record<string, number> = {};

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      data[key] = 0;
    }

    expenses
      .filter((e: any) => e.direction !== 'gelen')
      .forEach((e: any) => {
        if (data[e.date] !== undefined) {
          data[e.date] += e.amount;
        }
      });

    return Object.entries(data).map(([date, amount]) => ({
      date: date.slice(5),
      amount
    }));
  }, [expenses]);

  // ── YENİ: Özet istatistikler ──
  const summaryStats = useMemo(() => {
    if (!expenses.length) return null;
    const total = expenses
      .filter((e: any) => e.direction !== 'gelen')
      .reduce((s: number, e: any) => s + e.amount, 0);
    const count = expenses.filter((e: any) => e.direction !== 'gelen').length;
    const avg = count > 0 ? total / count : 0;
    const thisMonth = expenses
      .filter((e: any) => {
        const now = new Date();
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.direction !== 'gelen';
      })
      .reduce((s: number, e: any) => s + e.amount, 0);

    const lastMonth = expenses
      .filter((e: any) => {
        const now = new Date();
        const d = new Date(e.date);
        const lastM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return d.getMonth() === lastM && d.getFullYear() === lastY && e.direction !== 'gelen';
      })
      .reduce((s: number, e: any) => s + e.amount, 0);

    const trend = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return { total, count, avg, thisMonth, lastMonth, trend };
  }, [expenses]);

  // ── YENİ: En çok harcanan kategoriler ──
  const topCategories = useMemo(() => {
    return categoryBreakdown.slice(0, 5);
  }, [categoryBreakdown]);

  const handleJsonSubmit = useCallback(() => {
    try {
      if (!jsonInput.trim()) return;
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error('JSON bir dizi (array) olmalıdır.');
      const valid = parsed.every(t => t.title && t.amount !== undefined && t.date && t.direction);
      if (!valid) throw new Error('Geçersiz format. title, amount, date ve direction alanları zorunludur.');
      onPdfImport(parsed as ParsedTransaction[]);
      setJsonInput('');
      setJsonError('');
    } catch (err: any) {
      setJsonError(err.message || 'Geçersiz JSON formatı');
    }
  }, [jsonInput, onPdfImport]);

  const exampleJson = `[
  {
    "title": "N11 Online Alışveriş",
    "amount": 250.20,
    "date": "2026-05-05",
    "direction": "giden",
    "type": "Encard Harcaması",
    "category": "Alışveriş",
    "source": "Vadesiz Hesap",
    "description": "Encard Harcaması, 102400000114827-n11"
  }
]`;

  const handleFiles = useCallback(async (files: File[]) => {
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) return;
    setSelectedFiles(pdfFiles);
    setIsProcessing(true);
    try {
      const transactions = await parsePdfFiles(pdfFiles, (p) => setProgress(p));
      if (transactions.length > 0) onPdfImport(transactions);
    } catch (error) {
      console.error('PDF parse error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(null);
      setSelectedFiles([]);
    }
  }, [onPdfImport]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  }, [handleFiles]);

  const progressPercent = progress
    ? Math.round(((progress.currentIndex + (progress.status === 'parsing' ? 0.5 : 0)) / progress.totalFiles) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* ── YENİ: Özet İstatistik Kartları ── */}
      {summaryStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                <FaWallet className="text-rose-500 text-xs" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Toplam</span>
            </div>
            <p className="text-xl font-black text-stone-900 dark:text-white">₺{summaryStats.total.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 mt-1">{summaryStats.count} işlem</p>
          </div>

          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <FaChartLine className="text-amber-500 text-xs" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Ortalama</span>
            </div>
            <p className="text-xl font-black text-stone-900 dark:text-white">₺{Math.round(summaryStats.avg).toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 mt-1">işlem başına</p>
          </div>

          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                <FaCalendarCheck className="text-sky-500 text-xs" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Bu Ay</span>
            </div>
            <p className="text-xl font-black text-stone-900 dark:text-white">₺{summaryStats.thisMonth.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 mt-1">
              {summaryStats.trend > 0 ? '↑' : '↓'} %{Math.abs(summaryStats.trend).toFixed(1)}
            </p>
          </div>

          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <FaFire className="text-emerald-500 text-xs" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">En Çok</span>
            </div>
            <p className="text-sm font-black text-stone-900 dark:text-white truncate">
              {topCategories[0]?.name || '—'}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              {topCategories[0] ? `₺${topCategories[0].value.toLocaleString()}` : 'Veri yok'}
            </p>
          </div>
        </div>
      )}

      {/* ── Mevcut: Monthly Chart ── */}
      <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 sm:p-8 border border-stone-100 dark:border-zinc-800 h-[350px]">
        <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-widest">
          <FaChartBar className="text-stone-400 dark:text-zinc-500" /> {t('expenses.monthlyChartTitle')}
        </h3>
        <ResponsiveContainer width="100%" height="80%" minHeight={200}>
          <BarChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f0f0f0'} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }} />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
              contentStyle={{
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderRadius: '12px',
                border: isDark ? '1px solid #27272a' : '1px solid #e7e5e4',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '11px',
                fontWeight: '900',
                color: isDark ? '#ffffff' : '#1c1917'
              }}
              formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, t('expenses.amount')]}
            />
            <Bar dataKey="amount" fill={isDark ? '#ffffff' : '#1c1917'} radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── YENİ: Günlük Trend Alan Grafiği ── */}
      {dailyTrend.length > 0 && (
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 sm:p-8 border border-stone-100 dark:border-zinc-800 h-[300px]">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
            <FaChartLine className="text-stone-400 dark:text-zinc-500" /> GÜNLÜK HARCAMA TRENDİ (SON 30 GÜN)
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? '#f97316' : '#f97316'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isDark ? '#f97316' : '#f97316'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f0f0f0'} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#a8a29e' }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderRadius: '12px',
                  border: isDark ? '1px solid #27272a' : '1px solid #e7e5e4',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '11px',
                  fontWeight: '900',
                  color: isDark ? '#ffffff' : '#1c1917'
                }}
                formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, 'Harcama']}
              />
              <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Mevcut: Monthly Summary Table ── */}
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 flex flex-col">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <FaFileAlt className="text-stone-400 dark:text-zinc-500" /> {t('expenses.monthlySummary')}
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {monthlySummary.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <p className="text-[10px] font-black text-stone-400 uppercase">{t('expenses.noExpenses')}</p>
              </div>
            ) : (
              monthlySummary.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-stone-50/50 dark:bg-zinc-800/20 rounded-xl border border-stone-100 dark:border-zinc-800/50 group hover:bg-stone-100 dark:hover:bg-zinc-800/40 transition-colors">
                  <span className="text-xs font-black text-stone-600 dark:text-zinc-400 uppercase tracking-tight">{item.month}</span>
                  <span className="text-xs font-black text-stone-900 dark:text-white">₺{item.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── YENİ: Kategori Pasta Grafiği ── */}
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 h-[350px]">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-2 flex items-center gap-2 uppercase tracking-widest">
            <FaChartPie className="text-stone-400 dark:text-zinc-500" /> KATEGORİ DAĞILIMI
          </h3>
          {categoryBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] opacity-50">
              <p className="text-[10px] font-black text-stone-400 uppercase">Veri yok</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '12px',
                    border: isDark ? '1px solid #27272a' : '1px solid #e7e5e4',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: isDark ? '#ffffff' : '#1c1917'
                  }}
                  formatter={(val: any, name?: string) => [`₺${Number(val || 0).toLocaleString()}`, name || '']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 justify-center">
            {categoryBreakdown.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-[9px] font-bold text-stone-500 dark:text-zinc-400">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mevcut: PDF Import Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 sm:p-8 border border-stone-100 dark:border-zinc-800 flex flex-col">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <FaFilePdf className="text-stone-400 dark:text-zinc-500" /> PDF EKSTRE YÜKLEME
          </h3>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`
              relative flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer min-h-[180px]
              ${isProcessing
                ? 'border-stone-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900/50 cursor-wait'
                : isDragging
                  ? 'border-stone-900 dark:bg-white bg-stone-100/80 dark:bg-zinc-800/60 scale-[1.02]'
                  : 'border-stone-200 dark:border-zinc-800 bg-stone-50/30 dark:bg-zinc-900/20 hover:border-stone-400 dark:hover:border-zinc-600 hover:bg-stone-100/50 dark:hover:bg-zinc-800/30'
              }
            `}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileSelect} className="hidden" />
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4 px-6">
                <FaSpinner className="text-3xl text-stone-400 dark:text-zinc-500 animate-spin" />
                <div className="text-center space-y-2 w-full">
                  <p className="text-[10px] font-black text-stone-600 dark:text-zinc-400 uppercase tracking-widest">
                    {progress?.status === 'extracting' ? 'PDF Okunuyor...' : 'İşleniyor...'}
                  </p>
                  <div className="w-full max-w-[200px] mx-auto h-1.5 bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-900 dark:bg-white rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase">{progress?.currentIndex || 0} / {progress?.totalFiles || 0}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-6">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center shadow-inner group-hover:shadow-md transition-shadow">
                  <FaCloudUploadAlt className="text-2xl text-stone-400 dark:text-zinc-500" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-xs font-black text-stone-700 dark:text-zinc-300 uppercase tracking-wider">PDF Dosyalarını Sürükle & Bırak</p>
                  <p className="text-[10px] text-stone-400 dark:text-zinc-500 font-bold">Enpara kredi kartı veya vadesiz hesap ekstreleri</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── YENİ: En Çok Harcanan Kategoriler (Bar) ── */}
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 h-[300px]">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
            <FaFire className="text-stone-400 dark:text-zinc-500" /> EN ÇOK HARCANAN KATEGORİLER
          </h3>
          {topCategories.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] opacity-50">
              <p className="text-[10px] font-black text-stone-400 uppercase">Veri yok</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={topCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#27272a' : '#f0f0f0'} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '12px',
                    border: isDark ? '1px solid #27272a' : '1px solid #e7e5e4',
                    fontSize: '11px',
                    fontWeight: '900',
                    color: isDark ? '#ffffff' : '#1c1917'
                  }}
                  formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, 'Toplam']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {topCategories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Mevcut: JSON Import Section ── */}
      <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 sm:p-8 border border-stone-100 dark:border-zinc-800">
        <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
          <FaFileImport className="text-stone-400 dark:text-zinc-500" /> MANUEL JSON İLE EKLEME
        </h3>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mb-4">
          PDF ayrıştırıcının desteklemediği raporları JSON formatında manuel olarak ekleyebilirsiniz.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <pre className="text-[10px] bg-stone-100 dark:bg-zinc-900 p-4 rounded-xl text-stone-600 dark:text-zinc-400 overflow-x-auto border border-stone-200 dark:border-zinc-800">
              <code>{exampleJson}</code>
            </pre>
          </div>
          <div className="flex flex-col gap-3">
            <textarea
              value={jsonInput}
              onChange={(e) => { setJsonInput(e.target.value); setJsonError(''); }}
              placeholder="JSON verisini buraya yapıştırın..."
              className="flex-1 w-full p-4 text-xs rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-500 min-h-[150px] resize-y"
            />
            {jsonError && <p className="text-xs text-red-500 font-bold">{jsonError}</p>}
            <button
              onClick={handleJsonSubmit}
              disabled={!jsonInput.trim()}
              className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-black rounded-xl hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              JSON VERİLERİNİ AKTAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;