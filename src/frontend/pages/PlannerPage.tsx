import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FaCalendarPlus, FaSyncAlt } from 'react-icons/fa';
import PlannerHeader from '../components/planner/PlannerHeader';
import HorizontalTimeline from '../components/planner/HorizontalTimeline';
import ShiftLegend from '../components/planner/ShiftLegend';
import MeetingCard from '../components/planner/MeetingCard';
import QuickAddModal from '../components/planner/QuickAddModal';
import MonthlyView from '../components/planner/MonthlyView';
import { useAuth } from '../context/AuthContext';
import { getUserMeetings, deleteMeeting } from '../../backend/services/plannerService';
import type { PlannerMeeting } from '../../backend/types/planner';
import { showMarqueeToast } from '../components/MarqueeToast';

export default function PlannerPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<PlannerMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily'|'weekly'|'monthly'>('monthly');

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const localMeetings = await getUserMeetings(user.uid);
      setMeetings(localMeetings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto sync every 5 days could be handled here or simply rely on loadData when component mounts
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMeeting(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      showMarqueeToast({ message: 'Toplantı silindi', type: 'deleted', mediaType: 'movie' });
    } catch (err) {
      console.error(err);
    }
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Sort by start time basically.
  const currentDayMeetings = meetings
    .filter(m => m.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="pb-24 pt-4 max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6 px-1">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-stone-800 to-stone-500 dark:from-zinc-100 dark:to-zinc-400 text-transparent bg-clip-text">
          Planlayıcı
        </h1>
        
        {/* Sub-nav */}
        <div className="flex items-center bg-stone-200 dark:bg-zinc-800 p-1 rounded-xl shadow-inner">
          {(['daily', 'weekly', 'monthly'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400' 
                  : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {tab === 'daily' ? 'Günlük' : tab === 'weekly' ? 'Haftalık' : 'Aylık'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <PlannerHeader 
          selectedDate={selectedDate} 
          meetingCount={currentDayMeetings.length} 
        />

        <HorizontalTimeline 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
        />

        {activeTab === 'daily' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-stone-800 dark:text-zinc-200 text-lg">Program</h3>
              <div className="flex gap-2">
                <button 
                  onClick={loadData}
                  className="p-2 text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  title="Google Sheets'ten Yenile"
                >
                  <FaSyncAlt className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-100/50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 
                             rounded-lg text-sm font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors border border-rose-200 dark:border-rose-900/50"
                >
                  <FaCalendarPlus />
                  <span>Ekle</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10 opacity-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
              </div>
            ) : currentDayMeetings.length > 0 ? (
              <div className="space-y-3">
                {currentDayMeetings.map((meeting, idx) => (
                  <MeetingCard key={meeting.id || idx} meeting={meeting} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-stone-50 dark:bg-zinc-900 border border-dashed border-stone-200 dark:border-zinc-800 rounded-3xl">
                <p className="text-stone-500 dark:text-zinc-500 font-medium">Bu gün için herhangi bir plan bulunmuyor.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 text-sm font-bold text-rose-500 hover:underline"
                >
                  Hemen bir toplantı ekle
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'monthly' && (
          <div className="mt-4">
            <MonthlyView 
              currentMonth={selectedDate} 
              onMonthChange={setSelectedDate} 
              meetings={meetings} 
              onSelectDate={(date) => {
                setSelectedDate(date);
                setActiveTab('daily');
              }} 
            />
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="text-center py-12 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-stone-500 dark:text-zinc-500">Haftalık görünüm yakında eklenecek.</p>
          </div>
        )}

        <ShiftLegend />
      </div>

      <QuickAddModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedDate={selectedDate}
        onAdded={loadData}
      />
    </motion.div>
  );
}
