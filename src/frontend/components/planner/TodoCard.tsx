import { FaTrash, FaCheck, FaEdit, FaSyncAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import type { PlannerMeeting } from '../../../backend/types/planner';

interface TodoCardProps {
  todo: PlannerMeeting;
  onToggle: (id: string, currentStatus: boolean) => void;
  onDelete?: (item: PlannerMeeting) => void;
  onEdit?: (todo: PlannerMeeting) => void;
}

export default function TodoCard({ todo, onToggle, onDelete, onEdit }: TodoCardProps) {
  const isCompleted = !!todo.isCompleted;

  return (
    <div 
      className={`bg-white dark:bg-zinc-900 border ${
        isCompleted ? 'border-emerald-200 dark:border-emerald-900/50 opacity-60' : 'border-stone-200 dark:border-zinc-800'
      } rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md group cursor-pointer relative`}
      onClick={() => todo.id && onToggle(todo.id, isCompleted)}
    >
      
      {/* Checkbox */}
      <button 
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
          isCompleted 
            ? 'bg-emerald-500 border-emerald-500 text-white' 
            : 'border-stone-300 dark:border-zinc-600 text-transparent hover:border-emerald-400'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (todo.id) onToggle(todo.id, isCompleted);
        }}
      >
        <FaCheck size={12} />
      </button>

      {/* Details */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex items-center gap-2 min-w-0">
            <h4 className={`font-semibold transition-all ${
              isCompleted 
                ? 'text-stone-400 dark:text-zinc-500' 
                : 'text-stone-800 dark:text-zinc-200'
            } truncate`}>
              {todo.title}
            </h4>
            {todo.isRecurring && (
              <FaSyncAlt size={10} className="text-stone-400 dark:text-zinc-600 animate-spin-slow" title="Tekrarlayan Seri" />
            )}
            {/* Strikethrough line animation */}
            {isCompleted && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="absolute left-0 top-1/2 h-[2px] bg-stone-400 dark:bg-zinc-500 -translate-y-1/2"
              />
            )}
          </div>
          
          <div className="flex gap-2 items-center flex-shrink-0">
            {onEdit && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(todo);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
                title="Düzenle"
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
                className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                title="Sil"
              >
                <FaTrash size={12} />
              </button>
            )}
          </div>
        </div>
        
        {todo.notes && (
          <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1 line-clamp-2">
            {todo.notes}
          </p>
        )}
      </div>
    </div>
  );
}
