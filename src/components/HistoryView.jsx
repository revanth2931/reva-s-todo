import React, { useRef } from 'react';
import { subDays, format, parseISO } from 'date-fns';

export default function HistoryView({ streakLog = {}, todayStr, isOpen, onToggleSkipDay }) {
  const lastTapRef = useRef({});

  if (!isOpen) return null;

  // Calculate past 7 days chronologically: 6 days ago -> today
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(parseISO(todayStr), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const isComplete = streakLog[dateStr] === true;
    const isSkip = streakLog[dateStr] === 'skip';
    const isToday = dateStr === todayStr;

    return {
      date,
      dateStr,
      isComplete,
      isSkip,
      isToday,
      dayLabel: format(date, 'EEE'), // e.g., "Mon"
      dayNum: format(date, 'd'),     // e.g., "17"
    };
  });

  return (
    <div className="mt-8 p-3 sm:p-6 lg:p-6 rounded-2xl sm:rounded-3xl lg:rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md transition-all duration-300 ease-in-out animate-fadeIn shadow-[0_15px_40px_rgba(0,0,0,0.25)] w-full">
      <div className="flex items-center gap-3.5 mb-4 sm:mb-6 lg:mb-5">
        {/* Calendar Icon */}
        <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <svg className="w-6 h-6 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base sm:text-lg lg:text-base font-bold text-zinc-200">7-Day Completion Log</h3>
          <p className="text-xs lg:text-xs text-zinc-500 font-bold mt-1.5">Double-tap day to toggle skip • History of your consistency</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-3.5 lg:gap-3">
        {days.map((day) => {
          const handleDayClick = (e) => {
            if (day.isComplete || !onToggleSkipDay) return;
            const now = Date.now();
            const lastTap = lastTapRef.current[day.dateStr] || 0;
            if (now - lastTap < 300) {
              onToggleSkipDay(day.dateStr);
              lastTapRef.current[day.dateStr] = 0; // Reset
            } else {
              lastTapRef.current[day.dateStr] = now;
            }
          };

          return (
            <div
              key={day.dateStr}
              onClick={handleDayClick}
              className={`flex flex-col items-center p-1.5 py-3 sm:p-4 lg:p-3 rounded-xl sm:rounded-2xl lg:rounded-xl transition-all duration-300 select-none ${
                day.isComplete || !onToggleSkipDay 
                  ? '' 
                  : 'cursor-pointer hover:border-zinc-700/80 active:scale-[0.98]'
              } ${
                day.isToday
                  ? 'bg-zinc-800/40 border border-violet-500/30 ring-1 ring-violet-500/20 shadow-[0_0_10px_rgba(124,58,237,0.05)]'
                  : 'bg-zinc-950/40 border border-zinc-900/60'
              }`}
              title={day.isComplete ? 'Completed' : 'Double-tap to toggle skip'}
            >
              <span className={`text-[10px] sm:text-[13px] lg:text-[11px] font-extrabold tracking-widest uppercase ${
                day.isToday ? 'text-violet-400' : 'text-zinc-500'
              }`}>
                {day.dayLabel}
              </span>
              <span className="text-sm sm:text-lg lg:text-[15px] font-black text-zinc-300 mt-2">
                {day.dayNum}
              </span>

              {/* Status Indicator Badge */}
              <div className="mt-2.5 sm:mt-4 lg:mt-4">
                {day.isComplete ? (
                  // Pass: Green Check Icon
                  <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-8 lg:h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                    <svg className="w-4 h-4 sm:w-5.5 sm:h-5.5 lg:w-4.5 lg:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : day.isSkip ? (
                  // Skip: Purple Fast Forward Icon
                  <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-8 lg:h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-[0_0_8px_rgba(124,58,237,0.1)]" title="Skipped Day">
                    <svg className="w-4 h-4 sm:w-5.5 sm:h-5.5 lg:w-4.5 lg:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </div>
                ) : day.isToday ? (
                  // Today in progress: Indigo spin loader
                  <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-8 lg:h-8 rounded-full border border-dashed border-violet-500/30 flex items-center justify-center text-violet-400" title="In Progress">
                    <svg className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  // Fail: Red Cross Icon
                  <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-8 lg:h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400/80 shadow-[0_0_8px_rgba(239,68,68,0.05)]">
                    <svg className="w-4 h-4 sm:w-5.5 sm:h-5.5 lg:w-4.5 lg:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
