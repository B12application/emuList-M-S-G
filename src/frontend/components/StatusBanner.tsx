import { useState, useEffect } from 'react';
import { getShiftInfo } from '../utils/shiftLogic';
import { FaGift, FaTasks, FaSun, FaMoon, FaClock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getUserMeetings } from '../../backend/services/plannerService';
import { motion, AnimatePresence } from 'framer-motion';

interface ShiftDisplay {
  icon: React.ReactNode;
  label: string;       // Kısa: "Sabah" / "Akşam" / "Tatil"
  hours: string;       // "06:30–16:30" ya da "2. Gün"
  pillColor: string;   // Tailwind classes
  dotColor: string;    // Canlı nokta rengi
}

export default function StatusBanner() {
  const { user } = useAuth();
  const [shiftDisplay, setShiftDisplay] = useState<ShiftDisplay | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isActive, setIsActive] = useState(false); // Vardiya aktif mi?
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // Görevleri çek
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        const meetings = await getUserMeetings(user.uid);
        const now = new Date();
        const upcoming = meetings
          .filter(m => {
            if (m.isCompleted) return false;
            const targetDateStr = m.dueDate || m.date;
            if (!targetDateStr) return false;
            const startTime = m.startTime || '00:00';
            const endTime = m.endTime || startTime;
            const startDT = new Date(`${targetDateStr}T${startTime}`);
            const endDT = new Date(`${targetDateStr}T${endTime}`);
            if (!m.endTime && m.startTime) endDT.setHours(endDT.getHours() + 1);
            if (endDT.getTime() < now.getTime()) return false;
            const diffHour = (startDT.getTime() - now.getTime()) / (1000 * 60 * 60);
            return diffHour <= 72;
          })
          .sort((a, b) => {
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
    const id = setInterval(fetchTasks, 60000);
    return () => clearInterval(id);
  }, [user]);

  // Vardiya hesapla & kalan süre
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const shift = getShiftInfo(now);

      if (shift.type === 'Tatil') {
        setShiftDisplay({
          icon: <FaGift className="text-emerald-500" />,
          label: 'Tatil',
          hours: `${shift.dayIndex}. Gün`,
          pillColor: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-700 dark:text-emerald-300',
          dotColor: 'bg-emerald-400',
        });
        setTimeRemaining('İyi dinlenmeler 🎉');
        setIsActive(false);
        return;
      }

      const isMorning = shift.type === 'Sabah';
      const [startH, startM] = shift.startTime!.split(':').map(Number);
      const [endH, endM] = shift.endTime!.split(':').map(Number);

      const shiftStart = new Date(shift.shiftDate);
      shiftStart.setHours(startH, startM, 0, 0);
      const shiftEnd = new Date(shift.shiftDate);
      shiftEnd.setHours(endH, endM, 0, 0);
      if (endH < startH || (endH === startH && endM < startM)) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
      }

      const diffStartMs = shiftStart.getTime() - now.getTime();
      const diffEndMs = shiftEnd.getTime() - now.getTime();

      setShiftDisplay({
        icon: isMorning
          ? <FaSun className="text-amber-500" />
          : <FaMoon className="text-indigo-400" />,
        label: isMorning ? 'Sabah' : 'Akşam',
        hours: `${shift.startTime}–${shift.endTime}`,
        pillColor: isMorning
          ? 'bg-amber-500/15 border-amber-400/40 text-amber-700 dark:text-amber-300'
          : 'bg-indigo-500/15 border-indigo-400/40 text-indigo-700 dark:text-indigo-300',
        dotColor: isMorning ? 'bg-amber-400' : 'bg-indigo-400',
      });

      if (diffStartMs > 0) {
        const h = Math.floor(diffStartMs / (1000 * 60 * 60));
        const m = Math.floor((diffStartMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${h}s ${m}dk sonra başlar`);
        setIsActive(false);
      } else if (diffEndMs > 0) {
        const h = Math.floor(diffEndMs / (1000 * 60 * 60));
        const m = Math.floor((diffEndMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${h}s ${m}dk kaldı`);
        setIsActive(true);
      } else {
        setTimeRemaining('Bitti ✅');
        setIsActive(false);
      }
    };

    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  if (!shiftDisplay) return null;

  return (
    <div
      className={`relative flex items-center gap-1.5 border rounded-full font-bold tracking-wide shadow-sm cursor-pointer select-none transition-all duration-200
        px-2 py-1 h-8 text-[10px]
        lg:px-3 lg:py-1.5 lg:h-9 lg:text-[11px]
        ${shiftDisplay.pillColor}
        hover:brightness-95 dark:hover:brightness-110`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* İkon */}
      {shiftDisplay.icon}

      {/* Canlı nokta — sadece aktif vardiyadayken */}
      {isActive && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${shiftDisplay.dotColor}`} />
      )}

      {/* MOBİL: kısa metin */}
      <span className="lg:hidden flex items-center gap-1">
        <span className="font-black">{shiftDisplay.label}</span>
        <span className="opacity-60">·</span>
        <span>{shiftDisplay.hours}</span>
      </span>

      {/* DESKTOP: tam metin + kalan */}
      <span className="hidden lg:flex items-center gap-1.5">
        <span className="font-black">{shiftDisplay.label} V.</span>
        <span className="opacity-50">|</span>
        <span>{shiftDisplay.hours}</span>
        <span className="opacity-50">|</span>
        <FaClock className="text-[9px] opacity-70" />
        <span className="opacity-80">{timeRemaining}</span>
      </span>

      {/* Görev sayısı badge */}
      {upcomingTasks.length > 0 && (
        <span className="flex items-center justify-center bg-rose-500 text-white w-4 h-4 rounded-full text-[9px] -ml-0.5 shrink-0">
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
            transition={{ duration: 0.18 }}
            className="absolute top-full right-0 mt-2 w-72 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl z-[999] text-stone-800 dark:text-zinc-200"
          >
            {/* Vardiya özeti */}
            <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 border ${shiftDisplay.pillColor}`}>
              {shiftDisplay.icon}
              <div>
                <div className="text-xs font-black">{shiftDisplay.label} Vardiyası</div>
                <div className="text-[11px] opacity-75">{shiftDisplay.hours} · {timeRemaining}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-2 font-bold text-xs text-stone-500 dark:text-zinc-400 pb-2 border-b border-stone-100 dark:border-zinc-800 uppercase tracking-wide">
                <FaTasks /> Yaklaşan Görevler
              </h4>
              {upcomingTasks.length > 0 ? (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {upcomingTasks.map((t, idx) => {
                    const targetStr = t.dueDate || t.date;
                    const st = t.startTime || '00:00';
                    const startDT = new Date(`${targetStr}T${st}`);
                    const diffMs = startDT.getTime() - Date.now();
                    let label = '';
                    let cls = '';
                    if (diffMs < 0) {
                      label = 'Devam Ediyor'; cls = 'text-emerald-500 font-bold';
                    } else {
                      const diffMins = Math.floor(diffMs / 60000);
                      const h = Math.floor(diffMins / 60);
                      const m = diffMins % 60;
                      if (h === 0) { label = `${m} dk kaldı`; cls = 'text-rose-500 font-extrabold'; }
                      else if (h < 24) { label = `${h}s ${m}d kaldı`; cls = h <= 3 ? 'text-amber-500 font-bold' : 'text-stone-500 dark:text-zinc-400'; }
                      else { const d = Math.floor(h / 24); label = `${d} gün ${h % 24}s kaldı`; cls = 'text-stone-500 dark:text-zinc-500'; }
                    }
                    return (
                      <div key={t.id || idx} className="flex flex-col py-2 px-2.5 bg-stone-50 dark:bg-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-700/50 rounded-xl transition">
                        <span className="text-xs font-bold line-clamp-2 leading-tight">{t.title}</span>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-200/50 dark:border-zinc-700/50">
                          <span className="text-[9px] font-black tracking-wider uppercase text-stone-400 dark:text-zinc-500">
                            {t.itemType || 'GÖREV'}
                          </span>
                          <span className={`text-[10px] ${cls}`}>{label}</span>
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
