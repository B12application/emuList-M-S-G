import React from 'react';
import { FaChartBar, FaFileImport, FaFileAlt } from 'react-icons/fa';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface ReportsTabProps {
  t: (key: string) => string;
  isDark: boolean;
  monthlyChartData: any[];
  monthlySummary: any[];
  onImportClick: () => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({
  t,
  isDark,
  monthlyChartData,
  monthlySummary,
  onImportClick
}) => {
  return (
    <div className="space-y-6 pb-20">
      {/* Monthly Chart */}
      <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 sm:p-8 border border-stone-100 dark:border-zinc-800 h-[350px]">
        <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-widest">
          <FaChartBar className="text-stone-400 dark:text-zinc-500" /> {t('expenses.monthlyChartTitle')}
        </h3>
        <ResponsiveContainer width="100%" height="80%">
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

        {/* Import Module Card */}
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-8 border border-stone-100 dark:border-zinc-800 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-stone-50 dark:bg-zinc-800 flex items-center justify-center shadow-inner">
            <FaFileImport className="text-2xl text-stone-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">{t('expenses.uploadPdf')}</h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 leading-relaxed max-w-[220px] font-bold">
              {t('expenses.selectPdfFile')}
            </p>
          </div>
          <button
            onClick={onImportClick}
            className="px-8 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-stone-900/10 dark:shadow-white/10 flex items-center gap-2"
          >
            <FaFileImport /> {t('expenses.uploadPdf')}
          </button>
          <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {t('expenses.analyzeWithAi')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
