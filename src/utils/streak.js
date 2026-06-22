import { parseISO, subDays, differenceInCalendarDays, format } from 'date-fns';

/**
 * Calculates current and longest streaks from the streak log.
 * 
 * @param {Object} streakLog - Object containing {"YYYY-MM-DD": boolean}
 * @param {string} todayStr - Today's date string in YYYY-MM-DD format
 * @returns {Object} { currentStreak: number, longestStreak: number }
 */
export function calculateStreaks(streakLog, todayStr) {
  if (!streakLog || Object.keys(streakLog).length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Current Streak calculation
  let currentStreak = 0;
  const checkDate = parseISO(todayStr);

  // If today is complete, we start the streak count including today
  if (streakLog[todayStr] === true) {
    currentStreak = 1;
    let prevDate = subDays(checkDate, 1);
    let prevDateStr = format(prevDate, 'yyyy-MM-dd');
    while (streakLog[prevDateStr] === true) {
      currentStreak++;
      prevDate = subDays(prevDate, 1);
      prevDateStr = format(prevDate, 'yyyy-MM-dd');
    }
  } else {
    // If today is not complete (false or undefined), check yesterday
    let prevDate = subDays(checkDate, 1);
    let prevDateStr = format(prevDate, 'yyyy-MM-dd');
    if (streakLog[prevDateStr] === true) {
      currentStreak = 1;
      let nextPrevDate = subDays(prevDate, 1);
      let nextPrevDateStr = format(nextPrevDate, 'yyyy-MM-dd');
      while (streakLog[nextPrevDateStr] === true) {
        currentStreak++;
        nextPrevDate = subDays(nextPrevDate, 1);
        nextPrevDateStr = format(nextPrevDate, 'yyyy-MM-dd');
      }
    } else {
      currentStreak = 0;
    }
  }

  // 2. Longest Streak calculation
  // Filter for all completed dates, parse, and sort chronologically
  const completedDates = Object.keys(streakLog)
    .filter((date) => streakLog[date] === true)
    .map((date) => parseISO(date))
    .sort((a, b) => a - b);

  let longestStreak = 0;
  let currentTempStreak = 0;

  if (completedDates.length > 0) {
    longestStreak = 1;
    currentTempStreak = 1;

    for (let i = 1; i < completedDates.length; i++) {
      const prev = completedDates[i - 1];
      const curr = completedDates[i];
      const diff = differenceInCalendarDays(curr, prev);

      if (diff === 1) {
        currentTempStreak++;
      } else if (diff > 1) {
        currentTempStreak = 1;
      }
      
      if (currentTempStreak > longestStreak) {
        longestStreak = currentTempStreak;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
  };
}
