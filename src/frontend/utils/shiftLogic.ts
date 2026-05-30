import { differenceInCalendarDays, differenceInCalendarWeeks, format, parseISO, startOfWeek } from 'date-fns';
import { auth } from '../../backend/config/firebaseConfig';

export type ShiftType = 'Sabah' | 'Akşam' | 'Tatil' | 'Nöbet';

export interface ShiftSettings {
  planMode: '3-person' | '2-person';
  refDate3: string; // ISO format: YYYY-MM-DD
  refDate2: string; // ISO format: YYYY-MM-DD
  overrides?: Record<string, ShiftType>;
}

export interface ShiftInfo {
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  dayIndex?: number; // For cycles, e.g. 1-4 for work, 1-2 for off
  shiftDate: Date;
  isOverride?: boolean;
}

export const DEFAULT_SHIFT_SETTINGS: ShiftSettings = {
  planMode: '3-person',
  refDate3: '2026-04-04', // Reference start of Morning Day 1
  refDate2: '2026-03-30', // Reference Monday of a Morning Week
  overrides: {},
};

export function getLocalShiftSettings(): ShiftSettings {
  try {
    const user = auth.currentUser;
    const userId = user ? user.uid : 'default';
    const cached = localStorage.getItem(`shift_settings_${userId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_SHIFT_SETTINGS,
        ...parsed,
        overrides: parsed.overrides || {},
      };
    }
  } catch (e) {
    console.error('Error reading local shift settings:', e);
  }
  return DEFAULT_SHIFT_SETTINGS;
}

export function getShiftHours(type: ShiftType, planMode: '3-person' | '2-person'): { start?: string; end?: string } {
  if (type === 'Tatil') return {};
  if (type === 'Nöbet') return { start: '14:00', end: '02:00' };

  if (planMode === '3-person') {
    return type === 'Sabah' 
      ? { start: '06:30', end: '16:30' } 
      : { start: '16:00', end: '02:00' };
  } else {
    return type === 'Sabah' 
      ? { start: '09:00', end: '17:00' } 
      : { start: '17:00', end: '01:00' };
  }
}

export function getShiftInfo(date: Date, exactTime: boolean = false, customSettings?: ShiftSettings): ShiftInfo {
  const settings = customSettings || getLocalShiftSettings();
  const dateToCalculate = new Date(date);

  // If check is exactTime and hour is between 00:00 and 02:00, we are logically in the previous day's shift
  if (exactTime) {
    const hour = date.getHours();
    if (hour >= 0 && hour < 2) {
      dateToCalculate.setDate(dateToCalculate.getDate() - 1);
    }
  }

  const dateStr = format(dateToCalculate, 'yyyy-MM-dd');

  // 1. Check for single day overrides
  if (settings.overrides && settings.overrides[dateStr]) {
    const type = settings.overrides[dateStr];
    const hours = getShiftHours(type, settings.planMode);
    return {
      type,
      startTime: hours.start,
      endTime: hours.end,
      shiftDate: dateToCalculate,
      isOverride: true,
    };
  }

  // 2. Perform calculation based on plan mode
  if (settings.planMode === '3-person') {
    const refDate = parseISO(settings.refDate3);
    const diff = differenceInCalendarDays(dateToCalculate, refDate);
    const cycleLength = 12;
    let index = diff % cycleLength;
    if (index < 0) index += cycleLength;

    // Cycle layout:
    // 0-3:   Sabah   (06:30 – 16:30)
    // 4-5:   Tatil
    // 6-9:   Akşam   (16:00 – 02:00)
    // 10-11: Tatil

    if (index >= 0 && index <= 3) {
      return {
        type: 'Sabah',
        startTime: '06:30',
        endTime: '16:30',
        dayIndex: index + 1,
        shiftDate: dateToCalculate,
      };
    } else if (index >= 4 && index <= 5) {
      return {
        type: 'Tatil',
        dayIndex: index - 3,
        shiftDate: dateToCalculate,
      };
    } else if (index >= 6 && index <= 9) {
      return {
        type: 'Akşam',
        startTime: '16:00',
        endTime: '02:00',
        dayIndex: index - 5,
        shiftDate: dateToCalculate,
      };
    } else {
      return {
        type: 'Tatil',
        dayIndex: index - 9,
        shiftDate: dateToCalculate,
      };
    }
  } else {
    // 2-person plan mode
    const refDate = parseISO(settings.refDate2);
    const refWeekStart = startOfWeek(refDate, { weekStartsOn: 1 });
    const dateWeekStart = startOfWeek(dateToCalculate, { weekStartsOn: 1 });

    const diffWeeks = differenceInCalendarWeeks(dateWeekStart, refWeekStart, { weekStartsOn: 1 });
    let weekIndex = diffWeeks % 2;
    if (weekIndex < 0) weekIndex += 2;

    const dayOfWeek = dateToCalculate.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday

    // Weekdays (Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (weekIndex === 0) {
        // Morning Week
        return {
          type: 'Sabah',
          startTime: '09:00',
          endTime: '17:00',
          shiftDate: dateToCalculate,
        };
      } else {
        // Evening Week
        return {
          type: 'Akşam',
          startTime: '17:00',
          endTime: '01:00',
          shiftDate: dateToCalculate,
        };
      }
    } else {
      // Weekend (Saturday and Sunday)
      if (weekIndex === 0) {
        // Morning Week: Sat is Tatil, Sun is Nöbet
        if (dayOfWeek === 6) {
          return {
            type: 'Tatil',
            shiftDate: dateToCalculate,
          };
        } else {
          return {
            type: 'Nöbet',
            startTime: '14:00',
            endTime: '02:00',
            shiftDate: dateToCalculate,
          };
        }
      } else {
        // Evening Week: Sat is Nöbet, Sun is Tatil
        if (dayOfWeek === 6) {
          return {
            type: 'Nöbet',
            startTime: '14:00',
            endTime: '02:00',
            shiftDate: dateToCalculate,
          };
        } else {
          return {
            type: 'Tatil',
            shiftDate: dateToCalculate,
          };
        }
      }
    }
  }
}
