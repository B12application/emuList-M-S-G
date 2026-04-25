import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTasks, FaPlus, FaCheckCircle, FaTrash, FaUndo, FaTag } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { addMeeting, toggleTodoStatus, deleteMeeting, updateMeeting } from '../../../backend/services/plannerService';
import type { PlannerMeeting } from '../../../backend/types/planner';
import { showMarqueeToast } from '../MarqueeToast';
import { useAppSound } from '../../context/SoundContext';

interface TodoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetings: PlannerMeeting[];
  onRefresh: () => void;
}

export default function TodoManagerModal({ isOpen, onClose, meetings, onRefresh }: TodoManagerModalProps) {
  const { user } = useAuth();
  const { playSuccess } = useAppSound();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const todos = useMemo(() => {
    return meetings.filter(m => m.itemType === 'todo' && !m.date);
  }, [meetings]);

  const pendingTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted);

  if (!isOpen) return null;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addMeeting({
        userId: user.uid,
        title: newTaskTitle,
        date: '', // Date-agnostic
        startTime: '',
        endTime: '',
        notes: '',
        dueDate: '',
        itemType: 'todo',
        isCompleted: false,
        status: 'todo',
        isRecurring: false,
      });

      playSuccess();
      showMarqueeToast({ message: 'Görev eklendi', type: 'success' });
      setNewTaskTitle('');
      onRefresh();
    } catch (err) {
      console.error(err);
      showMarqueeToast({ message: 'Görev eklenemedi', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleTodoStatus(id, !currentStatus);
      // For status consistency
      await updateMeeting(id, { status: !currentStatus ? 'done' : 'todo' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMeeting(id);
      showMarqueeToast({ message: 'Görev silindi', type: 'deleted' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800 flex flex-col max-h-[85vh]"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-900/10">
            <h3 className="text-xl font-bold flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <FaTasks size={18} />
              </div>
              Görevlerim
            </h3>
            <button onClick={onClose} className="p-2 text-stone-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-zinc-800 rounded-full shadow-sm">
              <FaTimes />
            </button>
          </div>

          {/* ADD TASK FORM */}
          <div className="p-4 bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800">
            <form onSubmit={handleAddTask} className="relative">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ne yapmak istersin? (Zamanı önemsiz)"
                className="w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm shadow-sm"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newTaskTitle.trim()}
                className="absolute right-2 top-2 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <FaPlus size={14} />
              </button>
            </form>
          </div>

          {/* TABS */}
          <div className="flex px-4 pt-4 border-b border-stone-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-700'}`}
            >
              Yapılacaklar ({pendingTodos.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'completed' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-700'}`}
            >
              Tamamlananlar ({completedTodos.length})
            </button>
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-stone-50/50 dark:bg-zinc-950/50">
            {activeTab === 'pending' ? (
              pendingTodos.length > 0 ? (
                pendingTodos.map(todo => (
                  <div key={todo.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-stone-100 dark:border-zinc-700 shadow-sm group hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => todo.id && handleToggle(todo.id, !!todo.isCompleted)}
                        className="w-5 h-5 rounded-md border-2 border-stone-300 dark:border-zinc-600 flex items-center justify-center hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors"
                      >
                      </button>
                      <span className="text-sm font-medium text-stone-800 dark:text-zinc-200">{todo.title}</span>
                    </div>
                    <button
                      onClick={() => todo.id && handleDelete(todo.id)}
                      className="text-stone-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-stone-500 dark:text-zinc-500">
                  <p className="text-sm">Bekleyen görevin yok. Harika!</p>
                </div>
              )
            ) : (
              completedTodos.length > 0 ? (
                completedTodos.map(todo => (
                  <div key={todo.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-stone-100 dark:border-zinc-700 shadow-sm group opacity-75 hover:opacity-100 transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => todo.id && handleToggle(todo.id, !!todo.isCompleted)}
                        className="text-emerald-500 dark:text-emerald-400"
                        title="Geri Al"
                      >
                        <FaCheckCircle size={20} />
                      </button>
                      <span className="text-sm font-medium text-stone-500 dark:text-zinc-400 line-through">{todo.title}</span>
                    </div>
                    <button
                      onClick={() => todo.id && handleDelete(todo.id)}
                      className="text-stone-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-stone-500 dark:text-zinc-500">
                  <p className="text-sm">Henüz tamamlanan görev yok.</p>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
