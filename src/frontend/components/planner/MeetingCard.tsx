import { FaClock, FaTrash, FaGoogle } from 'react-icons/fa';
import type { PlannerMeeting } from '../../../backend/types/planner';

interface MeetingCardProps {
  meeting: PlannerMeeting;
  onDelete?: (id: string) => void;
}

export default function MeetingCard({ meeting, onDelete }: MeetingCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md group">
      
      {/* Time block */}
      <div className="flex flex-col items-center justify-center min-w-[3.5rem] py-2 bg-stone-50 dark:bg-zinc-950 rounded-xl border border-stone-100 dark:border-zinc-800">
        <span className="text-sm font-bold text-rose-600 dark:text-rose-500">{meeting.startTime}</span>
        {meeting.endTime && (
          <span className="text-[10px] text-stone-500 mt-0.5">{meeting.endTime}</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-stone-800 dark:text-zinc-200 truncate pr-2">
            {meeting.title}
          </h4>
          
          <div className="flex gap-2 items-center flex-shrink-0">
            {meeting.isGoogleSheet ? (
              <span className="flex items-center justify-center w-6 h-6 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full" title="Google Sheets üzerinden geldi">
                <FaGoogle size={10} />
              </span>
            ) : null}
            
            {!meeting.isGoogleSheet && onDelete && (
              <button 
                onClick={() => meeting.id && onDelete(meeting.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                title="Sil"
              >
                <FaTrash size={12} />
              </button>
            )}
          </div>
        </div>
        
        {meeting.description ? (
          <p className="text-sm text-stone-500 dark:text-zinc-500 mt-1 line-clamp-2">
            {meeting.description}
          </p>
        ) : (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-400 dark:text-zinc-600 font-medium">
             <FaClock size={10} />
             <span>Planlandı</span>
          </div>
        )}
      </div>
    </div>
  );
}
