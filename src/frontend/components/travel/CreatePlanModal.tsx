import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaGripVertical, FaTrash, FaClock, FaStickyNote, FaCalendarAlt, FaRoute } from 'react-icons/fa';
import type { TravelStop, TouristAttraction } from '../../../backend/types/travelPlanner';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: {
    title: string;
    date: string;
    endDate?: string;
    type: 'daily' | 'weekly' | 'monthly';
    stops: TravelStop[];
    notes?: string;
    color: string;
  }) => void;
  cityName: string;
  cityId: string;
  availableAttractions: TouristAttraction[];
  initialStops?: TravelStop[];
}

const PLAN_COLORS = [
  '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f97316'
];

export default function CreatePlanModal({
  isOpen,
  onClose,
  onSave,
  cityName,
  availableAttractions,
  initialStops = [],
}: CreatePlanModalProps) {
  const [title, setTitle] = useState(`${cityName} Gezi Planı`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [stops, setStops] = useState<TravelStop[]>(initialStops);
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState(PLAN_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttractionList, setShowAttractionList] = useState(false);

  const filteredAttractions = availableAttractions.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !stops.some(s => s.attractionXid === a.xid)
  );

  const addStop = (attraction: TouristAttraction) => {
    const newStop: TravelStop = {
      order: stops.length + 1,
      attractionXid: attraction.xid || `stop_${Date.now()}_${Math.random()}`,
      name: attraction.name,
      lat: Number(attraction.lat) || 0,
      lon: Number(attraction.lon) || 0,
      kinds: attraction.kinds || 'other',
      visited: false,
    };
    setStops([...stops, newStop]);
    setShowAttractionList(false);
    setSearchQuery('');
  };

  const removeStop = (order: number) => {
    setStops(stops
      .filter(s => s.order !== order)
      .map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  const moveStop = (from: number, to: number) => {
    if (to < 0 || to >= stops.length) return;
    const newStops = [...stops];
    const [moved] = newStops.splice(from, 1);
    newStops.splice(to, 0, moved);
    setStops(newStops.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStopField = (order: number, field: keyof TravelStop, value: any) => {
    setStops(stops.map(s => s.order === order ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    if (!title.trim() || stops.length === 0) return;
    const safeDate = date || new Date().toISOString().split('T')[0];
    onSave({
      title: title.trim(),
      date: safeDate,
      endDate: endDate || undefined,
      type,
      stops: stops.map(s => ({
        ...s,
        estimatedTime: s.estimatedTime || undefined,
      })),
      notes: notes.trim() || undefined,
      color: selectedColor || '#0ea5e9',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400">
                <FaRoute className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900 dark:text-white">Rota Planla</h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">{cityName} için yeni gezi planı</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <FaTimes className="text-stone-400" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            <div className="space-y-5">
              {/* Plan name */}
              <div>
                <label className="text-xs font-bold text-stone-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5 block">
                  Plan Adı
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                  placeholder="Plan adı girin..."
                />
              </div>

              {/* Date and Type row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FaCalendarAlt className="text-sky-500" /> Tarih
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5 block">
                    Plan Tipi
                  </label>
                  <div className="flex gap-1.5">
                    {(['daily', 'weekly', 'monthly'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                          type === t
                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {t === 'daily' ? 'Günlük' : t === 'weekly' ? 'Haftalık' : 'Aylık'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-bold text-stone-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5 block">
                  Renk
                </label>
                <div className="flex gap-2">
                  {PLAN_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-all ${
                        selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110' : 'hover:scale-105'
                      }`}
                      style={selectedColor === color ? { backgroundColor: color } : {}}
                    />
                  ))}
                </div>
              </div>

              {/* Stops */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                    Duraklar ({stops.length})
                  </label>
                  <button
                    onClick={() => setShowAttractionList(!showAttractionList)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-sky-500 bg-sky-50 dark:bg-sky-900/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                  >
                    <FaPlus /> Durak Ekle
                  </button>
                </div>

                {/* Add attraction search */}
                <AnimatePresence>
                  {showAttractionList && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-3"
                    >
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Yer ara..."
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-sm mb-2 outline-none focus:ring-2 focus:ring-sky-500 text-stone-900 dark:text-white"
                        autoFocus
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1 bg-stone-50 dark:bg-zinc-800 rounded-xl p-2 border border-stone-200 dark:border-zinc-700">
                        {filteredAttractions.slice(0, 20).map(a => (
                          <button
                            key={a.xid}
                            onClick={() => addStop(a)}
                            className="w-full text-left px-3 py-2 text-xs text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <FaPlus className="text-sky-500 text-[10px]" />
                            <span className="truncate">{a.name}</span>
                          </button>
                        ))}
                        {filteredAttractions.length === 0 && (
                          <p className="text-xs text-stone-400 dark:text-zinc-500 text-center py-2">Sonuç bulunamadı</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stop list */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {stops.map((stop, index) => (
                      <motion.div
                        key={stop.order}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-stone-50 dark:bg-zinc-800 rounded-xl p-3 border border-stone-200 dark:border-zinc-700"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveStop(index, index - 1)}
                              disabled={index === 0}
                              className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 disabled:opacity-20 text-[10px]"
                            >
                              ▲
                            </button>
                            <FaGripVertical className="text-stone-300 dark:text-zinc-600 text-xs mx-auto" />
                            <button
                              onClick={() => moveStop(index, index + 1)}
                              disabled={index === stops.length - 1}
                              className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 disabled:opacity-20 text-[10px]"
                            >
                              ▼
                            </button>
                          </div>

                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: selectedColor }}
                          >
                            {stop.order}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-800 dark:text-white truncate">{stop.name}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center gap-1">
                              <FaClock className="text-stone-400 text-[10px]" />
                              <input
                                type="time"
                                value={stop.estimatedTime || ''}
                                onChange={e => updateStopField(stop.order, 'estimatedTime', e.target.value)}
                                className="w-20 px-1.5 py-0.5 text-[10px] bg-white dark:bg-zinc-700 border border-stone-200 dark:border-zinc-600 rounded-lg text-stone-700 dark:text-zinc-200 outline-none"
                              />
                            </div>
                            <button
                              onClick={() => removeStop(stop.order)}
                              className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </div>

                        {/* Connect line to next stop */}
                        {index < stops.length - 1 && (
                          <div className="ml-[42px] mt-1 mb-0">
                            <div className="w-0.5 h-4 border-l-2 border-dashed border-sky-300 dark:border-sky-700 ml-[13px]" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {stops.length === 0 && (
                    <div className="text-center py-8 text-stone-400 dark:text-zinc-500 text-sm">
                      <span className="text-3xl block mb-2">📍</span>
                      Henüz durak eklenmedi
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-stone-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FaStickyNote className="text-amber-500" /> Notlar
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Plan hakkında notlar..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-5 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/50">
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              {stops.length} durak · {type === 'daily' ? 'Günlük' : type === 'weekly' ? 'Haftalık' : 'Aylık'} plan
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || stops.length === 0}
                className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl hover:shadow-lg hover:shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kaydet
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
