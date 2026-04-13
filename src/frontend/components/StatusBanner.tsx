import { useState, useEffect } from 'react';
import { getShiftInfo } from '../utils/shiftLogic';
import { FaCalendarDay, FaGift, FaTasks, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getUserMeetings } from '../../backend/services/plannerService';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function StatusBanner() {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [shiftMsg, setShiftMsg] = useState<string>('');
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        const meetings = await getUserMeetings(user.uid);
        const now = new Date();
        
        const upcoming = meetings.filter(m => {
          if (m.isCompleted) return false;
          
          const targetDateStr = m.dueDate || m.date;
          if (!targetDateStr) return false;

          let startTime = m.startTime || '00:00';
          let endTime = m.endTime || startTime;
          
          const startDateTime = new Date(`${targetDateStr}T${startTime}`);
          const endDateTime = new Date(`${targetDateStr}T${endTime}`);
          // If no end time was provided, assume meeting is 1 hour long for filtering
          if (!m.endTime && m.startTime) {
             endDateTime.setHours(endDateTime.getHours() + 1);
          }

          // If meeting already finished, don't show it
          if (endDateTime.getTime() < now.getTime()) return false;
          
          // Show upcoming within next ~72 hours (3 days)
          const diffHour = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          return diffHour <= 72; // Show only upcoming in 72 hours
        }).sort((a, b) => {
          const d1 = new Date(`${a.dueDate || a.date}T${a.startTime || '00:00'}`).getTime();
          const d2 = new Date(`${b.dueDate || b.date}T${b.startTime || '00:00'}`).getTime();
          return d1 - d2;
        });
        
        setUpcomingTasks(upcoming);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();
    const taskInterval = setInterval(fetchTasks, 60000); // 1 dakikada bir yenile
    return () => clearInterval(taskInterval);
  }, [user]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const shift = getShiftInfo(now);
      
      if (shift.type === 'Tatil') {
        setShiftMsg(`Tatil (${shift.dayIndex}. Gün)`);
        setTimeRemaining('İyi dinlenmeler');
      } else {
        const [hours, mins] = shift.startTime!.split(':').map(Number);
        const shiftStart = new Date();
        shiftStart.setHours(hours, mins, 0, 0);
        
        const diffMs = shiftStart.getTime() - now.getTime();
        
        if (diffMs > 0) {
          const h = Math.floor(diffMs / (1000 * 60 * 60));
          const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setShiftMsg(`${shift.type} V. (${shift.startTime})`);
          setTimeRemaining(`${h}s ${m}d kaldı`);
        } else {
          let endHours = parseInt(shift.endTime!.split(':')[0]);
          let endMins = parseInt(shift.endTime!.split(':')[1]);
          const shiftEnd = new Date();
          if (endHours < hours || (endHours === hours && endMins < mins)) {
             shiftEnd.setDate(shiftEnd.getDate() + 1);
          }
          shiftEnd.setHours(endHours, endMins, 0, 0);
          const diffEndMs = shiftEnd.getTime() - now.getTime();

          if (diffEndMs > 0) {
            const h = Math.floor(diffEndMs / (1000 * 60 * 60));
            const m = Math.floor((diffEndMs % (1000 * 60 * 60)) / (1000 * 60));
            setShiftMsg(`Mesai (${shift.type})`);
            setTimeRemaining(`Bitime ${h}s ${m}d`);
          } else {
            setShiftMsg(`${shift.type} V.`);
            setTimeRemaining('Bitti ✅');
          }
        }
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="hidden relative lg:flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 text-amber-700 dark:text-amber-400 py-1.5 px-3 rounded-full text-[11px] font-bold tracking-wide shadow-sm h-9 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {shiftMsg.includes('Tatil') ? <FaGift className="text-rose-500" /> : <FaCalendarDay className="text-amber-600 dark:text-amber-500" />}
      <span>{shiftMsg} <span className="opacity-60 mx-1">|</span> {timeRemaining}</span>
      
      {upcomingTasks.length > 0 && (
        <span className="flex items-center justify-center bg-rose-500 text-white !w-4 !h-4 rounded-full text-[9px] -ml-1">
          {upcomingTasks.length}
        </span>
      )}

      {/* Hover Dropdown */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-64 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 text-stone-800 dark:text-zinc-200"
          >
            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-2 font-bold text-xs text-stone-500 dark:text-zinc-400 pb-2 border-b border-stone-100 dark:border-zinc-800 uppercase tracking-wide">
                <FaTasks /> Yaklaşan Görevler
              </h4>
              {upcomingTasks.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {upcomingTasks.map((t, idx) => {
                    const targetStr = t.dueDate || t.date;
                    const st = t.startTime || '00:00';
                    const startDateTime = new Date(`${targetStr}T${st}`);
                    const now = new Date();
                    
                    const diffMs = startDateTime.getTime() - now.getTime();
                    
                    let timeRemainingLabel = "";
                    let highlightClass = "";
                    
                    if (diffMs < 0) {
                      timeRemainingLabel = "Devam Ediyor";
                      highlightClass = "text-emerald-500 font-bold";
                    } else {
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMins / 60);
                      const remainsMins = diffMins % 60;
                      
                      if (diffHours === 0) {
                        timeRemainingLabel = `${remainsMins} dk kaldı`;
                        highlightClass = "text-rose-500 font-extrabold";
                      } else if (diffHours < 24) {
                        timeRemainingLabel = `${diffHours}s ${remainsMins}d kaldı`;
                        highlightClass = diffHours <= 3 ? "text-amber-500 font-bold" : "text-stone-500 dark:text-zinc-400";
                      } else {
                        const days = Math.floor(diffHours / 24);
                        const hours = diffHours % 24;
                        timeRemainingLabel = `${days} gün ${hours}s kaldı`;
                        highlightClass = "text-stone-500 dark:text-zinc-500";
                      }
                    }

                    return (
                      <div key={t.id || idx} className="flex flex-col py-2 px-2.5 bg-stone-50 dark:bg-zinc-800/60 transition hover:bg-stone-100 dark:hover:bg-zinc-700/50 rounded-xl">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-bold w-full line-clamp-2 leading-tight">{t.title}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-200/50 dark:border-zinc-700/50">
                          <span className="text-[9px] font-black tracking-wider uppercase text-stone-400 dark:text-zinc-500">
                            {t.itemType || 'GÖREV'}
                          </span>
                          <span className={`text-[10px] ${highlightClass}`}>
                            {timeRemainingLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-center py-4 opacity-50 font-medium">Yaklaşan günlerde göreviniz yok.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
