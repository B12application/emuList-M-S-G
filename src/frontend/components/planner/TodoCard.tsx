import { FaTrash, FaCheck, FaEdit, FaSyncAlt, FaCar, FaHome, FaUser, FaHeartbeat, FaBriefcase, FaExclamationCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import type { PlannerMeeting } from '../../../backend/types/planner';
import { useLanguage } from '../../context/LanguageContext';

interface TodoCardProps {
  todo: PlannerMeeting;
  onToggle: (id: string, currentStatus: boolean) => void;
  onStatusChange?: (id: string, newStatus: PlannerMeeting['status']) => void;
  onDelete?: (item: PlannerMeeting) => void;
  onEdit?: (todo: PlannerMeeting) => void;
}

export default function TodoCard({ todo, onToggle, onStatusChange, onDelete, onEdit }: TodoCardProps) {
  const { t } = useLanguage();
  const isCompleted = !!todo.isCompleted;
  const isPast = new Date(`${todo.date}T${todo.startTime || '23:59'}`) < new Date();

  const isJira = todo.itemType === 'jira';
  const statuses: PlannerMeeting['status'][] = ['todo', 'planned', 'dev', 'test', 'done'];
  const currentStatus = todo.status || 'todo';

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'araba': return FaCar;
      case 'ev': return FaHome;
      case 'kisisel': return FaUser;
      case 'saglik': return FaHeartbeat;
      case 'is': return FaBriefcase;
      default: return null;
    }
  };
  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'araba': return t('planner.catCar');
      case 'ev': return t('planner.catHome');
      case 'kisisel': return t('planner.catPersonal');
      case 'saglik': return t('planner.catHealth');
      case 'is': return t('planner.catWork');
      default: return '';
    }
  };
  const CategoryIcon = getCategoryIcon(todo.category);

  const getStatusInfo = (s: PlannerMeeting['status']) => {
    // If not Jira, always return neutral/simple style
    if (!isJira) {
      return { 
        label: t('planner.statusTodo'), 
        color: 'bg-stone-50 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400 border-stone-100 dark:border-zinc-700', 
        accent: 'bg-stone-300', 
        bg: 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800' 
      };
    }

    switch (s) {
      case 'planned': return {
        label: t('planner.statusPlanned'),
        color: 'bg-indigo-500 text-white border-indigo-600 shadow-indigo-200',
        accent: 'bg-indigo-500',
        bg: 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50'
      };
      case 'dev': return {
        label: t('planner.statusDev'),
        color: 'bg-sky-500 text-white border-sky-600 shadow-sky-200',
        accent: 'bg-sky-500',
        bg: 'bg-sky-50/50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/50'
      };
      case 'test': return {
        label: t('planner.statusTest'),
        color: 'bg-amber-500 text-white border-amber-600 shadow-amber-200',
        accent: 'bg-amber-500',
        bg: 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50'
      };
      case 'done': return {
        label: t('planner.statusDone'),
        color: 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-200',
        accent: 'bg-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/60'
      };
      default: return {
        label: t('planner.statusTodo'),
        color: 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400 border-stone-200 dark:border-zinc-700',
        accent: 'bg-stone-400',
        bg: 'bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800'
      };
    }
  };

  const getPriorityInfo = (p: PlannerMeeting['priority']) => {
    switch (p) {
      case 'urgent': return { label: t('planner.urgent'), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-200 dark:border-rose-800' };
      case 'high': return { label: t('planner.high'), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800' };
      case 'medium': return { label: t('planner.medium'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800' };
      case 'low': return { label: t('planner.low'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' };
      default: return null;
    }
  };

  const statusInfo = getStatusInfo(currentStatus);
  const priorityInfo = getPriorityInfo(todo.priority);

  const changeStatus = (e: React.MouseEvent, nextStatus: PlannerMeeting['status']) => {
    e.stopPropagation();
    if (!onStatusChange || !todo.id || nextStatus === currentStatus) return;

    onStatusChange(todo.id, nextStatus);

    // Auto-sync isCompleted
    if (nextStatus === 'done' && !isCompleted) {
      onToggle(todo.id, false);
    } else if (nextStatus !== 'done' && isCompleted) {
      onToggle(todo.id, true);
    }
  };

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    changeStatus(e, statuses[nextIndex]);
  };

  return (
    <div
      className={`${statusInfo.bg} border ${isCompleted
          ? 'shadow-inner'
          : `hover:shadow-lg ${isPast ? 'opacity-70' : ''}`
        } rounded-2xl flex items-center gap-4 transition-all group cursor-pointer relative overflow-hidden`}
      onClick={() => todo.id && onToggle(todo.id, isCompleted)}
    >
      {/* Background Watermark for Completion - Only for Jira or if explicitly requested, but let's keep it for visual confirmation of 'Done' if simple too? 
          Actually user said 'remove from duties', so let's keep duties EXTREMELY simple. */}
      {isCompleted && isJira && (
        <div className="absolute -right-4 -bottom-4 opacity-10 dark:opacity-5 text-emerald-600 transform rotate-12">
          <FaCheck size={120} />
        </div>
      )}

      {/* Status Accent Bar - Jira gets colored accent, Todo gets neutral or none */}
      {isJira ? (
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${statusInfo.accent} ${isCompleted ? 'opacity-50' : 'opacity-100'}`} />
      ) : (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isCompleted ? 'bg-emerald-500' 
              : todo.categoryColor ? '' 
              : 'bg-stone-200 dark:bg-zinc-700'
          }`}
          style={!isCompleted && todo.categoryColor ? { backgroundColor: todo.categoryColor } : undefined}
        />
      )}

      <div className="pl-3 py-3 flex items-center gap-3 w-full min-h-[64px]">
        {/* Checkbox */}
        <button
          className={`flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
            : 'border-stone-300 dark:border-zinc-700 text-transparent hover:border-emerald-500/50'
            }`}
          onClick={(e) => {
            e.stopPropagation();
            if (todo.id) onToggle(todo.id, isCompleted);
          }}
        >
          <FaCheck size={9} />
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="relative flex items-center gap-2 min-w-0">
                <h4 className={`font-bold transition-all text-sm ${isCompleted
                  ? 'text-stone-400 dark:text-zinc-500'
                  : 'text-stone-800 dark:text-zinc-100'
                  } truncate`}>
                  {todo.title}
                </h4>
                
                {todo.isRecurring && (
                  <FaSyncAlt size={10} className="text-stone-400 dark:text-zinc-600 animate-spin-slow" />
                )}

                {/* Kategori Badge */}
                {CategoryIcon && todo.category && !isCompleted && (
                  <span
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap"
                    style={{
                      color: todo.categoryColor || '#6b7280',
                      borderColor: `${todo.categoryColor || '#6b7280'}40`,
                      backgroundColor: `${todo.categoryColor || '#6b7280'}12`,
                    }}
                  >
                    <CategoryIcon size={9} />
                    {getCategoryLabel(todo.category)}
                  </span>
                )}

                {/* Öncelik Badge */}
                {priorityInfo && !isCompleted && (
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-tighter ${priorityInfo.bg} ${priorityInfo.color} ${priorityInfo.border}`}>
                    <FaExclamationCircle size={8} />
                    {priorityInfo.label}
                  </span>
                )}

                {isCompleted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="absolute left-0 top-1/2 h-[1px] bg-stone-400 dark:bg-zinc-600 -translate-y-1/2"
                  />
                )}
              </div>

              {/* Status Badge - Clickable to Cycle (Sade & Interactive) */}
              {isJira && !isCompleted && (
                <button
                  onClick={cycleStatus}
                  className={`px-2 py-0.5 text-[9px] font-black rounded-lg border shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${statusInfo.color}`}
                  title="Durumu İlerlet"
                >
                  <span className="uppercase tracking-wider">{statusInfo.label}</span>
                  <FaSyncAlt size={8} className="opacity-60" />
                </button>
              )}
              {isJira && isCompleted && (
                 <div className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-600 border border-stone-200 dark:border-zinc-700 uppercase tracking-wider">
                   Bitti
                 </div>
              )}
            </div>

            {/* Actions (Only on Hover or Small screens visible) */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(todo);
                  }}
                  className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <FaEdit size={12} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(todo);
                  }}
                  className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <FaTrash size={12} />
                </button>
              )}
            </div>
          </div>
          
          {todo.notes && (
            <p className="text-[11px] text-stone-400 dark:text-zinc-500 mt-0.5 truncate italic">
              {todo.notes}
            </p>
          )}
        </div>
      </div>


    </div>
  );
}
