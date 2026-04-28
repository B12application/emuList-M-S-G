import { differenceInCalendarDays } from 'date-fns';

export type ShiftType = 'Sabah' | 'Akşam' | 'Tatil';

export interface ShiftInfo {
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  dayIndex?: number; // 1-4 for morning/evening, 1-2 for off
  shiftDate: Date;   // The "logical" date of the shift
}

// 12 günlük döngü: 4 Sabah → 2 Tatil → 4 Akşam → 2 Tatil
// Google Sheet verisiyle doğrulanmış desen
const CYCLE_LENGTH = 12;
// Referans: 4 Nisan 2026 = Sabah 1. gün (index 0)
const REF_DATE = new Date(2026, 3, 4); // April 4, 2026

export function getShiftInfo(date: Date, exactTime: boolean = false): ShiftInfo {
  const dateToCalculate = new Date(date);

  // Eğer saat 00:00 ile 02:00 arasındaysa ve anlık zaman kontrolü (exactTime) yapılıyorsa, 
  // hala bir önceki günün vardiyası içindeyiz demektir (Özellikle Akşam vardiyası 02:00'de bittiği için)
  if (exactTime) {
    const hour = date.getHours();
    if (hour >= 0 && hour < 2) {
      dateToCalculate.setDate(dateToCalculate.getDate() - 1);
    }
  }

  const diff = differenceInCalendarDays(dateToCalculate, REF_DATE);

  let index = diff % CYCLE_LENGTH;
  if (index < 0) index += CYCLE_LENGTH;

  // Döngü haritası:
  // 0-3:   Sabah   (06:30 – 16:30)
  // 4-5:   Tatil 1
  // 6-9:   Akşam   (16:00 – 02:00)
  // 10-11: Tatil 2

  if (index >= 0 && index <= 3) {
    return {
      type: 'Sabah',
      startTime: '06:30',
      endTime: '16:30',
      dayIndex: index + 1,
      shiftDate: dateToCalculate
    };
  } else if (index >= 4 && index <= 5) {
    return {
      type: 'Tatil',
      dayIndex: index - 3,
      shiftDate: dateToCalculate
    };
  } else if (index >= 6 && index <= 9) {
    return {
      type: 'Akşam',
      startTime: '16:00',
      endTime: '02:00',
      dayIndex: index - 5,
      shiftDate: dateToCalculate
    };
  } else {
    return {
      type: 'Tatil',
      dayIndex: index - 9,
      shiftDate: dateToCalculate
    };
  }
}
