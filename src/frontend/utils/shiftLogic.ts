import { differenceInCalendarDays } from 'date-fns';

export type ShiftType = 'Sabah' | 'Akşam' | 'Tatil';

export interface ShiftInfo {
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  dayIndex?: number; // 1-4 for morning/evening, 1-2 for off
  shiftDate: Date;   // The "logical" date of the shift
}

// 10 day cycle: 4 Morning -> 4 Evening -> 2 Off
const CYCLE_LENGTH = 10;
// Referans: 13 Nisan 2026 = Akşam vardiyası son gün (4. akşam, index 7)
// Döngü: 0-3 Sabah, 4-7 Akşam, 8-9 Tatil
const REF_DATE = new Date(2026, 3, 13); // April 13, 2026
const REF_INDEX = 7; 

export function getShiftInfo(date: Date): ShiftInfo {
  let dateToCalculate = new Date(date);
  
  // Eğer saat 00:00 ile 02:00 arasındaysa, hala bir önceki günün vardiyası içindeyiz demektir
  // (Özellikle Akşam vardiyası 02:00'de bittiği için)
  const hour = date.getHours();
  if (hour >= 0 && hour < 2) {
    dateToCalculate.setDate(dateToCalculate.getDate() - 1);
  }

  const diff = differenceInCalendarDays(dateToCalculate, REF_DATE);
  
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
      dayIndex: index + 1,
      shiftDate: dateToCalculate
    };
  } else if (index >= 4 && index <= 7) {
    return { 
      type: 'Akşam', 
      startTime: '16:00', 
      endTime: '02:00',
      dayIndex: index - 3,
      shiftDate: dateToCalculate
    };
  } else {
    return { 
      type: 'Tatil',
      dayIndex: index - 7,
      shiftDate: dateToCalculate
    };
  }
}
