import { differenceInCalendarDays } from 'date-fns';

export type ShiftType = 'Sabah' | 'Akşam' | 'Tatil';

export interface ShiftInfo {
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  dayIndex?: number; // 1-4 for morning/evening, 1-2 for off
}

// 10 day cycle: 4 Morning -> 4 Evening -> 2 Off
const CYCLE_LENGTH = 10;
// Reference: "Yarın (14 Nisan 2026) vardiyadaki son akşam günü" (Index 7)
const REF_DATE = new Date(2026, 3, 14); // April 14, 2026
const REF_INDEX = 7; 

export function getShiftInfo(date: Date): ShiftInfo {
  const diff = differenceInCalendarDays(date, REF_DATE);
  
  let index = (diff % CYCLE_LENGTH) + REF_INDEX;
  index = index % CYCLE_LENGTH;
  if (index < 0) {
    index += CYCLE_LENGTH;
  }

  if (index >= 0 && index <= 3) {
    return { 
      type: 'Sabah', 
      startTime: '06:30', 
      endTime: '16:30',
      dayIndex: index + 1
    };
  } else if (index >= 4 && index <= 7) {
    return { 
      type: 'Akşam', 
      startTime: '16:00', 
      endTime: '02:00',
      dayIndex: index - 3
    };
  } else {
    return { 
      type: 'Tatil',
      dayIndex: index - 7
    };
  }
}
