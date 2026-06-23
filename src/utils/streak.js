import { parseISO, subDays, addDays, format } from 'date-fns';

/**
 * Calculates current and longest streaks from the streak log.
 * 
 * @param {Object} streakLog - Object containing {"YYYY-MM-DD": boolean | "skip"}
 * @param {string} todayStr - Today's date string in YYYY-MM-DD format
 * @returns {Object} { currentStreak: number, longestStreak: number }
 */
export function calculateStreaks(streakLog, todayStr) {
  if (!streakLog || Object.keys(streakLog).length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Current Streak calculation (walk backward day-by-day)
  let currentStreak = 0;
  const checkDate = parseISO(todayStr);
  
  let dayOffset = 0;
  const maxDaysBack = 1000; // safety limit

  while (dayOffset < maxDaysBack) {
    const d = subDays(checkDate, dayOffset);
    const dStr = format(d, 'yyyy-MM-dd');
    const status = streakLog[dStr];

    if (status === true) {
      currentStreak++;
    } else if (status === 'skip') {
      // Skip day preserves the streak: continue backward without incrementing
    } else {
      // Not completed and not skip:
      if (dayOffset === 0) {
        // Today is not complete: doesn't break the streak yet, continue to yesterday
      } else {
        // Past day is not complete/skip: breaks the streak
        break;
      }
    }
    dayOffset++;
  }

  // 2. Longest Streak calculation (walk forward day-by-day)
  let longestStreak = 0;
  let currentTempStreak = 0;
  let inStreak = false;

  const logDates = Object.keys(streakLog);
  if (logDates.length > 0) {
    const parsedDates = logDates.map(d => parseISO(d)).sort((a, b) => a - b);
    const earliestDate = parsedDates[0];
    const latestDate = parseISO(todayStr);

    let checkDay = earliestDate;
    while (checkDay <= latestDate) {
      const dStr = format(checkDay, 'yyyy-MM-dd');
      const status = streakLog[dStr];

      if (status === true) {
        if (!inStreak) {
          inStreak = true;
          currentTempStreak = 1;
        } else {
          currentTempStreak++;
        }
        if (currentTempStreak > longestStreak) {
          longestStreak = currentTempStreak;
        }
      } else if (status === 'skip') {
        // Skip day preserves the active streak: do not increment, but keep inStreak true
      } else {
        // Failed or missing day: breaks the streak
        inStreak = false;
        currentTempStreak = 0;
      }

      checkDay = addDays(checkDay, 1); // move forward 1 day
    }
  }

  return {
    currentStreak,
    longestStreak,
  };
}
