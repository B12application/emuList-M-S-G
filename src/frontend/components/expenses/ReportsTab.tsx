import React, { useState, useCallback, useRef } from 'react';
import { FaChartBar, FaFileImport, FaFileAlt, FaFilePdf, FaCloudUploadAlt, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { parsePdfFiles, type ParsedTransaction, type PdfParseProgress } from '../../utils/pdfParserService';

interface ReportsTabProps {
  t: (key: string) => string;
  isDark: boolean;
  monthlyChartData: any[];
  monthlySummary: any[];
  onPdfImport: (transactions: ParsedTransaction[]) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({
  t,
  isDark,
  monthlyChartData,
  monthlySummary,
  onPdfImport
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<PdfParseProgress | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) return;

    setSelectedFiles(pdfFiles);
    setIsProcessing(true);

    try {
      const transactions = await parsePdfFiles(pdfFiles, (p) => {
        setProgress(p);
      });

      console.log('[ReportsTab] PDF parsed, transaction count:', transactions.length);
      if (transactions.length > 0) {
        console.log('[ReportsTab] First transaction:', transactions[0]);
        onPdfImport(transactions);
      } else {
        console.warn('[ReportsTab] No transactions found in PDF files');
      }
    } catch (error) {
      console.error('PDF parse error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(null);
      setSelectedFiles([]);
    }
  }, [onPdfImport]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, [handleFiles]);

  const progressPercent = progress
    ? Math.round(((progress.currentIndex + (progress.status === 'parsing' ? 0.5 : 0)) / progress.totalFiles) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Monthly Chart */}
      <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 sm:p-8 border border-stone-100 dark:border-zinc-800 h-[350px]">
        <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-widest">
          <FaChartBar className="text-stone-400 dark:text-zinc-500" /> {t('expenses.monthlyChartTitle')}
        </h3>
        <ResponsiveContainer width="100%" height="80%" minHeight={200}>
          <BarChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f0f0f0'} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#a8a29e', fontWeight: 700 }}
            />
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
              itemStyle={{ color: isDark ? '#ffffff' : '#1c1917' }}
              formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, t('expenses.amount')]}
            />
            <Bar
              dataKey="amount"
              fill={isDark ? '#ffffff' : '#1c1917'}
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Summary Table */}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-stone-900 dark:text-white">₺{item.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PDF Import Card */}
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 sm:p-8 border border-stone-100 dark:border-zinc-800 flex flex-col">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <FaFilePdf className="text-stone-400 dark:text-zinc-500" /> PDF EKSTRE YÜKLEME
          </h3>

          {/* Drop Zone */}
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
                  ? 'border-stone-900 dark:border-white bg-stone-100/80 dark:bg-zinc-800/60 scale-[1.02]'
                  : 'border-stone-200 dark:border-zinc-800 bg-stone-50/30 dark:bg-zinc-900/20 hover:border-stone-400 dark:hover:border-zinc-600 hover:bg-stone-100/50 dark:hover:bg-zinc-800/30'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {isProcessing ? (
              /* Processing State */
              <div className="flex flex-col items-center gap-4 px-6">
                <div className="relative">
                  <FaSpinner className="text-3xl text-stone-400 dark:text-zinc-500 animate-spin" />
                </div>
                <div className="text-center space-y-2 w-full">
                  <p className="text-[10px] font-black text-stone-600 dark:text-zinc-400 uppercase tracking-widest">
                    {progress?.status === 'extracting' ? 'PDF Okunuyor...' : progress?.status === 'parsing' ? 'İşleniyor...' : 'Tamamlandı'}
                  </p>
                  <p className="text-[9px] font-bold text-stone-400 dark:text-zinc-500 truncate max-w-[200px]">
                    {progress?.currentFile}
                  </p>
                  {/* Progress Bar */}
                  <div className="w-full max-w-[200px] mx-auto h-1.5 bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-900 dark:bg-white rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase">
                    {progress?.currentIndex || 0} / {progress?.totalFiles || 0}
                  </p>
                </div>
              </div>
            ) : (
              /* Default Upload State */
              <div className="flex flex-col items-center gap-3 px-6">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center shadow-inner group-hover:shadow-md transition-shadow">
                  <FaCloudUploadAlt className="text-2xl text-stone-400 dark:text-zinc-500" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-xs font-black text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    PDF Dosyalarını Sürükle & Bırak
                  </p>
                  <p className="text-[10px] text-stone-400 dark:text-zinc-500 font-bold leading-relaxed">
                    Enpara kredi kartı veya vadesiz hesap ekstrelerini yükleyin
                  </p>
                  <p className="text-[9px] text-stone-300 dark:text-zinc-600 font-bold">
                    Birden fazla dosya seçilebilir • Otomatik tür algılama
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
