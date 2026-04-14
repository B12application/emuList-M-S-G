import { useMemo, useState, cloneElement } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaPlus, FaCheckCircle, FaClock, FaTools, FaVial, FaClipboardList } from 'react-icons/fa';
import { SiJira } from 'react-icons/si';
import type { PlannerMeeting } from '../../../backend/types/planner';
import TodoCard from './TodoCard';

interface JiraViewProps {
  meetings: PlannerMeeting[];
  onToggle: (id: string, currentStatus: boolean) => void;
  onStatusChange: (id: string, newStatus: PlannerMeeting['status']) => void;
  onDelete: (item: PlannerMeeting) => void;
  onEdit: (item: PlannerMeeting) => void;
  onAdd: () => void;
}

export default function JiraView({ meetings, onToggle, onStatusChange, onDelete, onEdit, onAdd }: JiraViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('all');

  const jiraTasks = useMemo(() => {
    return meetings.filter(m => m.itemType === 'jira');
  }, [meetings]);

  const filteredTasks = useMemo(() => {
    return jiraTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true :
                           statusFilter === 'done' ? task.status === 'done' : 
                           task.status !== 'done';
      return matchesSearch && matchesStatus;
    });
  }, [jiraTasks, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = jiraTasks.length;
    const done = jiraTasks.filter(t => t.status === 'done').length;
    return {
      total,
      done,
      pending: total - done,
      percent: total > 0 ? Math.round((done / total) * 100) : 0
    };
  }, [jiraTasks]);

  const statusGroups = [
    { id: 'todo', label: 'Bekleyen', icon: <FaClipboardList className="text-stone-400" />, color: 'bg-stone-500' },
    { id: 'planned', label: 'Planlandı', icon: <FaClock className="text-indigo-400" />, color: 'bg-indigo-500' },
    { id: 'dev', label: 'Geliştirme', icon: <FaTools className="text-sky-400" />, color: 'bg-sky-500' },
    { id: 'test', label: 'Test', icon: <FaVial className="text-amber-400" />, color: 'bg-amber-500' },
    { id: 'done', label: 'Tamamlandı', icon: <FaCheckCircle className="text-emerald-400" />, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input 
            type="text"
            placeholder="Jira tasklarında ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'pending' : statusFilter === 'pending' ? 'done' : 'all')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors text-sm font-bold text-stone-600 dark:text-zinc-400"
          >
            <FaFilter />
            <span>{statusFilter === 'all' ? 'Tümü' : statusFilter === 'pending' ? 'Aktifler' : 'Bitenler'}</span>
          </button>
          <button 
            onClick={onAdd}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 font-bold"
          >
            <FaPlus />
            <span className="hidden sm:inline">Yeni Task</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Task', value: stats.total, color: 'text-stone-600 dark:text-stone-400' },
          { label: 'Aktif İşim', value: stats.pending, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Tamamlanan', value: stats.done, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Tamamlanma Oranı', value: `%${stats.percent}`, color: 'text-indigo-600 dark:text-indigo-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
            <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400 dark:text-zinc-500 mb-1">{stat.label}</div>
            <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Simple Vertical List of Status Groups */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-10">
          {statusGroups.map((group) => {
            const groupTasks = filteredTasks.filter(t => (t.status || 'todo') === group.id);
            if (groupTasks.length === 0) return null;
            
            return (
              <div 
                key={group.id} 
                className="space-y-4"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 px-1 border-l-4 border-stone-200 dark:border-zinc-800 pl-4 py-1">
                  <div className={`p-2 rounded-xl ${group.color} text-white shadow-sm`}>
                    {cloneElement(group.icon as React.ReactElement, { size: 14 } as any)}
                  </div>
                  <div>
                    <h3 className="font-black text-stone-800 dark:text-zinc-100 text-lg tracking-tight">{group.label}</h3>
                    <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">
                      {groupTasks.length} ADET GÖREV
                    </p>
                  </div>
                </div>

                {/* Task Cards Stack */}
                <div className="space-y-3">
                  {groupTasks.map((task, idx) => (
                    <motion.div
                      key={task.id || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <TodoCard 
                        todo={task}
                        onToggle={onToggle}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                        onEdit={onEdit}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        <div className="text-center py-20 bg-stone-50 dark:bg-zinc-900/50 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-[2.5rem]">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <SiJira className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-zinc-200 mb-1">Jira Taskı Bulunamadı</h3>
          <p className="text-stone-500 dark:text-zinc-500 text-sm max-w-xs mx-auto">
            {searchTerm ? `"${searchTerm}" aramasına uygun task bulunamadı.` : 'Henüz herhangi bir Jira taskı eklememişsin.'}
          </p>
          {!searchTerm && (
            <button 
              onClick={onAdd}
              className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
            >
              İlk Taskını Ekle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
