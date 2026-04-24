import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FaCalendarPlus, FaSyncAlt, FaHistory, FaMapMarkerAlt } from 'react-icons/fa';
import PlannerHeader from '../components/planner/PlannerHeader';
import HorizontalTimeline from '../components/planner/HorizontalTimeline';
import ShiftLegend from '../components/planner/ShiftLegend';
import MeetingCard from '../components/planner/MeetingCard';
import TodoCard from '../components/planner/TodoCard';
import QuickAddModal from '../components/planner/QuickAddModal';
import MonthlyView from '../components/planner/MonthlyView';
import WeeklyView from '../components/planner/WeeklyView';
import JiraView from '../components/planner/JiraView';
import RecurringManagerModal from '../components/planner/RecurringManagerModal';
import DeleteChoiceModal from '../components/planner/DeleteChoiceModal';
import CalendarAlertModal from '../components/planner/CalendarAlertModal';
import { useAuth } from '../context/AuthContext';
import { getUserMeetings, deleteMeeting, toggleTodoStatus, syncRecurringItems, deleteRecurringSeries, updateMeeting, getUserCalendarAlerts } from '../../backend/services/plannerService';
import { getUpcomingGSMatches } from '../services/galatasarayService';
import type { PlannerMeeting } from '../../backend/types/planner';
import type { CalendarAlert } from '../../backend/types/planner';
import { showMarqueeToast } from '../components/MarqueeToast';

export default function PlannerPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<PlannerMeeting[]>(() => {
    try {
      const cached = localStorage.getItem(`planner_meetings_${user?.uid}`);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PlannerMeeting | null>(null);
  const [modalInitialData, setModalInitialData] = useState<PlannerMeeting | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [calendarAlerts, setCalendarAlerts] = useState<CalendarAlert[]>([]);
  // Mobilde daily, desktop'ta monthly başlat
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'jira'>(() =>
    window.innerWidth < 768 ? 'daily' : 'monthly'
  );

  const loadData = async (isManualRefresh = false) => {
    if (!user) return;

    // Yükleme animasyonunu sadece veri yoksa veya manuel yenilemede göster
    if (meetings.length === 0 || isManualRefresh) {
      setIsLoading(true);
    }

    try {
      // 1. Verileri PARALEL çek (Hız kazandırır)
      const [dbMeetings, gsMatches, alerts] = await Promise.all([
        getUserMeetings(user.uid),
        getUpcomingGSMatches(),
        getUserCalendarAlerts(user.uid)
      ]);

      const allMeetings = [...dbMeetings, ...gsMatches];
      setMeetings(allMeetings);
      setCalendarAlerts(alerts);

      // Cache'e yaz (Anında yükleme için)
      localStorage.setItem(`planner_meetings_${user.uid}`, JSON.stringify(allMeetings));
      setIsLoading(false);

      // 2. Senkronizasyon ve dünden kalanları taşıma (ARKA PLANDA çalıştır)
      // Bu işlemler UI'ı dondurmadan arka planda sessizce gerçekleşir.
      backgroundSync(user.uid, dbMeetings);

    } catch (err) {
      console.error("Planner load error:", err);
      setIsLoading(false);
    }
  };

  const backgroundSync = async (uid: string, currentDbMeetings: PlannerMeeting[]) => {
    try {
      // Başka cihazda eklenmiş tekrarlayanları oluştur
      await syncRecurringItems(uid);

      // Eski görevleri bugüne taşı
      const hasUpdates = await autoPostponeOldTasks(currentDbMeetings);

      if (hasUpdates) {
        // Eğer veritabanında bir değişiklik olduysa (ertelemeler vs) sadece DB kısmını güncelle
        const updatedDbMeetings = await getUserMeetings(uid);
        const gsMatches = meetings.filter(m => m.itemType === 'match');
        const finalMeetings = [...updatedDbMeetings, ...gsMatches];
        setMeetings(finalMeetings);
        localStorage.setItem(`planner_meetings_${uid}`, JSON.stringify(finalMeetings));
      }
    } catch (err) {
      console.warn("Background sync error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      // Bileşen ilk yüklendiğinde cache'tekileri gösteriyoruz zaten useState'te.
      // Şimdi gerçek veriyi çekelim.
      loadData();
    }
  }, [user]);

  const autoPostponeOldTasks = async (tasks: PlannerMeeting[]) => {
    if (!user) return false;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Geçmişteki tamamlanmamış ve bugün olmayan görevleri bul
    const overdueTasks = tasks.filter(m =>
      (m.itemType === 'todo' || m.itemType === 'jira') &&
      !m.isCompleted &&
      m.date < todayStr
    );

    if (overdueTasks.length > 0) {
      const promises = overdueTasks.map(task => {
        const prevDate = task.date;
        return updateMeeting(task.id!, {
          date: todayStr,
          notes: task.notes
            ? `${task.notes}\n[Sistem: ${prevDate} tarihinden ertelendi]`
            : `[Sistem: ${prevDate} tarihinden ertelendi]`
        });
      });
      await Promise.all(promises);
      showMarqueeToast({ message: `${overdueTasks.length} görev bugüne taşındı`, type: 'watched' });
      return true;
    }
    return false;
  };

  const handleDelete = async (item: PlannerMeeting) => {
    if (!item.id) return;

    // Eğer tekrarlayan bir öğeyse modal aç
    if (item.isRecurring && item.recurringGroupId) {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
      return;
    }

    // NORMAL TEKLİ SİLME
    await executeSingleDelete(item);
  };

  const executeSingleDelete = async (item: PlannerMeeting) => {
    try {
      await deleteMeeting(item.id!);
      setMeetings(prev => prev.filter(m => m.id !== item.id));
      showMarqueeToast({ message: 'Öğe silindi', type: 'deleted' });
    } catch (err) {
      console.error(err);
    }
  };

  const executeSeriesDelete = async (item: PlannerMeeting) => {
    try {
      await deleteRecurringSeries(user!.uid, item.recurringGroupId!);
      setMeetings(prev => prev.filter(m => m.recurringGroupId !== item.recurringGroupId));
      showMarqueeToast({ message: 'Tüm seri silindi', type: 'deleted' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (item: PlannerMeeting) => {
    setModalInitialData(item);
    setIsModalOpen(true);
  };

  const handleToggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      await toggleTodoStatus(id, !currentStatus);
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, isCompleted: !currentStatus } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: PlannerMeeting['status']) => {
    try {
      await updateMeeting(id, {
        status: newStatus,
        // Eğer durum "done" ise isCompleted'ı da true yapalım, aksi halde false
        isCompleted: newStatus === 'done'
      });
      setMeetings(prev => prev.map(m => m.id === id ? {
        ...m,
        status: newStatus,
        isCompleted: newStatus === 'done'
      } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Filter lists
  const currentDayAll = meetings.filter(m => m.date === selectedDateStr);
  const currentDayMeetings = currentDayAll
    .filter(m => m.itemType === 'meeting' || m.itemType === 'match')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentDayTodos = currentDayAll.filter(m => {
    if (m.itemType === 'jira') {
      return m.dueDate === selectedDateStr;
    }
    return m.itemType === 'todo';
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 pt-4 max-w-5xl mx-auto px-4"
    >
      <div className="flex items-center justify-between mb-6 px-1">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-stone-800 to-stone-500 dark:from-zinc-100 dark:to-zinc-400 text-transparent bg-clip-text">
          Planlayıcı
        </h1>

        {/* Sub-nav */}
        <div className="flex items-center bg-stone-200 dark:bg-zinc-800 p-1 rounded-xl shadow-inner">
          {(['daily', 'weekly', 'monthly', 'jira'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === tab
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400'
                : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
              {tab === 'daily' ? 'Günlük' : tab === 'weekly' ? 'Haftalık' : tab === 'monthly' ? 'Aylık' : 'Jira'}
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
          <div className="space-y-8">
            {/* MEETINGS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-stone-800 dark:text-zinc-200 text-lg">Program</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadData(true)}
                    className="p-2 text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    title="Yenile"
                  >
                    <FaSyncAlt className={isLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => setIsRecurringModalOpen(true)}
                    className="p-2 text-stone-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                    title="Tekrarlayan Seriler"
                  >
                    <FaHistory />
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
                    <MeetingCard
                      key={meeting.id || idx}
                      meeting={meeting}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-stone-50 dark:bg-zinc-900 border border-dashed border-stone-200 dark:border-zinc-800 rounded-3xl">
                  <p className="text-stone-500 dark:text-zinc-500 text-sm font-medium">Bu gün için herhangi bir plan bulunmuyor.</p>
                </div>
              )}
            </div>

            {/* TODOS SECTION */}
            {!isLoading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1 border-l-4 border-rose-500 pl-3">
                  <h3 className="font-bold text-stone-800 dark:text-zinc-200 text-lg">Bugün Yapılacaklar</h3>
                </div>
                {currentDayTodos.length > 0 ? (
                  <div className="space-y-2">
                    {currentDayTodos.map((todo, idx) => (
                      <TodoCard
                        key={todo.id || idx}
                        todo={todo}
                        onToggle={handleToggleTodo}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl">
                    <p className="text-stone-400 dark:text-zinc-600 text-sm">Görev veya hatırlatıcı yok.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="mt-4 space-y-3">
            {/* Özel Takvim Uyarısı Butonu */}
            <div className="flex justify-end px-1">
              <button
                onClick={() => setIsAlertModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 
                           rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-900/40"
              >
                <FaMapMarkerAlt size={11} />
                <span>Özel Takvim Uyarısı{calendarAlerts.length > 0 ? ` (${calendarAlerts.length})` : ''}</span>
              </button>
            </div>
            <MonthlyView
              currentMonth={selectedDate}
              onMonthChange={setSelectedDate}
              meetings={meetings}
              calendarAlerts={calendarAlerts}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setActiveTab('daily');
              }}
            />
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="mt-4">
            <WeeklyView
              currentDate={selectedDate}
              meetings={meetings}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setActiveTab('daily');
              }}
            />
          </div>
        )}

        {activeTab === 'jira' && (
          <div className="mt-4">
            <JiraView
              meetings={meetings}
              onToggle={handleToggleTodo}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onAdd={() => setIsModalOpen(true)}
            />
          </div>
        )}

        <ShiftLegend />
      </div>

      <QuickAddModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialData(null);
        }}
        selectedDate={selectedDate}
        onAdded={loadData}
        initialData={modalInitialData}
      />

      <RecurringManagerModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onRefresh={loadData}
      />

      {itemToDelete && (
        <DeleteChoiceModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirmSingle={() => executeSingleDelete(itemToDelete)}
          onConfirmSeries={() => executeSeriesDelete(itemToDelete)}
          title={itemToDelete.title}
        />
      )}

      <CalendarAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onAdded={loadData}
        existingAlerts={calendarAlerts}
      />
    </motion.div>
  );
}
