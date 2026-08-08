import { differenceInCalendarDays, differenceInCalendarWeeks, format, parseISO, startOfWeek } from 'date-fns';
import { auth } from '../../backend/config/firebaseConfig';
import type { ShiftType, ShiftCustomHours, ShiftSettings } from '../../backend/services/shiftService';
import { DEFAULT_SHIFT_SETTINGS } from '../../backend/services/shiftService';

export type { ShiftType, ShiftCustomHours, ShiftSettings };
export { DEFAULT_SHIFT_SETTINGS };

export interface ShiftInfo {
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  dayIndex?: number; // For cycles, e.g. 1-4 for work, 1-2 for off
  shiftDate: Date;
  isOverride?: boolean;
}

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

export function getShiftHours(
  type: ShiftType,
  planMode: ShiftSettings['planMode'],
  customHours?: ShiftCustomHours
): { start?: string; end?: string } {
  if (type === 'Tatil') return {};

  // Check for custom hours
  if (customHours && customHours[type as keyof ShiftCustomHours]) {
    const ch = customHours[type as keyof ShiftCustomHours];
    if (ch?.start && ch?.end) {
      return { start: ch.start, end: ch.end };
    }
  }

  if (type === 'Nöbet') return { start: '14:00', end: '02:00' };

  if (planMode === '3-person') {
    return type === 'Sabah'
      ? { start: '06:30', end: '16:30' }
      : { start: '16:00', end: '02:00' };
  } else if (planMode === '2-person') {
    return type === 'Sabah'
      ? { start: '09:00', end: '18:00' }
      : { start: '18:00', end: '01:00' };
  } else {
    return type === 'Sabah'
      ? { start: '08:00', end: '18:00' }
      : { start: '16:00', end: '00:00' };
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
    const hours = getShiftHours(type, settings.planMode, settings.customHours);
    return {
      type,
      startTime: hours.start,
      endTime: hours.end,
      shiftDate: dateToCalculate,
      isOverride: true,
    };
  }

  // 2. Custom Weekly Pattern (Pazartesi-Pazar 7 günlük sabitleme)
  if (settings.planMode === 'custom-weekly') {
    // JS getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    // Index: 0 for Mon, 1 for Tue, ..., 6 for Sun
    const jsDay = dateToCalculate.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
    const pattern = settings.weeklyPattern || DEFAULT_SHIFT_SETTINGS.weeklyPattern!;
    const type = pattern[dayIndex] || 'Tatil';
    const hours = getShiftHours(type, settings.planMode, settings.customHours);

    return {
      type,
      startTime: hours.start,
      endTime: hours.end,
      dayIndex: dayIndex + 1,
      shiftDate: dateToCalculate,
    };
  }

  // 3. Custom Cycle Pattern (N-günlük özel döngü)
  if (settings.planMode === 'custom-cycle') {
    const refDate = parseISO(settings.refDateCustom || '2026-01-01');
    const diff = differenceInCalendarDays(dateToCalculate, refDate);
    const cycle = settings.customCycle && settings.customCycle.length > 0
      ? settings.customCycle
      : DEFAULT_SHIFT_SETTINGS.customCycle!;
    const cycleLength = cycle.length;
    let index = diff % cycleLength;
    if (index < 0) index += cycleLength;

    const type = cycle[index] || 'Tatil';
    const hours = getShiftHours(type, settings.planMode, settings.customHours);

    return {
      type,
      startTime: hours.start,
      endTime: hours.end,
      dayIndex: index + 1,
      shiftDate: dateToCalculate,
    };
  }

  // 4. Perform calculation based on 3-person / 2-person plan modes
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
      let isTatilEarly = false;
      if (exactTime && index === 3) {
        const hour = date.getHours();
        const minute = date.getMinutes();
        if (hour > 16 || (hour === 16 && minute >= 30)) {
          isTatilEarly = true;
        }
      }

      if (isTatilEarly) {
        return {
          type: 'Tatil',
          dayIndex: 1, // Treat as start of Tatil
          shiftDate: dateToCalculate,
        };
      }

      const hours = getShiftHours('Sabah', settings.planMode, settings.customHours);
      return {
        type: 'Sabah',
        startTime: hours.start || '06:30',
        endTime: hours.end || '16:30',
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
      const hours = getShiftHours('Akşam', settings.planMode, settings.customHours);
      return {
        type: 'Akşam',
        startTime: hours.start || '16:00',
        endTime: hours.end || '02:00',
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
        const hours = getShiftHours('Sabah', settings.planMode, settings.customHours);
        return {
          type: 'Sabah',
          startTime: hours.start || '09:00',
          endTime: hours.end || '18:00',
          shiftDate: dateToCalculate,
        };
      } else {
        const hours = getShiftHours('Akşam', settings.planMode, settings.customHours);
        return {
          type: 'Akşam',
          startTime: hours.start || '18:00',
          endTime: hours.end || '01:00',
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
          const hours = getShiftHours('Nöbet', settings.planMode, settings.customHours);
          return {
            type: 'Nöbet',
            startTime: hours.start || '14:00',
            endTime: hours.end || '02:00',
            shiftDate: dateToCalculate,
          };
        }
      } else {
        // Evening Week: Sat is Nöbet, Sun is Tatil
        if (dayOfWeek === 6) {
          const hours = getShiftHours('Nöbet', settings.planMode, settings.customHours);
          return {
            type: 'Nöbet',
            startTime: hours.start || '14:00',
            endTime: hours.end || '02:00',
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

