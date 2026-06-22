import React from 'react';
import { subDays, format, parseISO } from 'date-fns';

export default function HistoryView({ streakLog = {}, todayStr, isOpen }) {
  if (!isOpen) return null;

  // Calculate past 7 days chronologically: 6 days ago -> today
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(parseISO(todayStr), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const isComplete = streakLog[dateStr] === true;
    const isToday = dateStr === todayStr;

    return {
      date,
      dateStr,
      isComplete,
      isToday,
      dayLabel: format(date, 'EEE'), // e.g., "Mon"
      dayNum: format(date, 'd'),     // e.g., "17"
    };
  });

  return (
    <div className="mt-6 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md transition-all duration-300 ease-in-out animate-fadeIn shadow-[0_10px_30px_rgba(0,0,0,0.15)] w-full">
      <div className="flex items-center gap-2 mb-4">
        {/* Calendar Icon */}
        <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-200">7-Day Completion Log</h3>
          <p className="text-[10px] text-zinc-500 font-medium">History of your consistency</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          return (
            <div
              key={day.dateStr}
              className={`flex flex-col items-center p-2.5 rounded-xl transition-all duration-300 select-none ${
                day.isToday
                  ? 'bg-zinc-800/40 border border-violet-500/30 ring-1 ring-violet-500/20 shadow-[0_0_10px_rgba(124,58,237,0.05)]'
                  : 'bg-zinc-950/40 border border-zinc-900/60'
              }`}
            >
              <span className={`text-[9px] font-extrabold tracking-widest uppercase ${
                day.isToday ? 'text-violet-400' : 'text-zinc-500'
              }`}>
                {day.dayLabel}
              </span>
              <span className="text-sm font-extrabold text-zinc-300 mt-1">
                {day.dayNum}
              </span>

              {/* Status Indicator Badge */}
              <div className="mt-3">
                {day.isComplete ? (
                  // Pass: Green Check Icon
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : day.isToday ? (
                  // Today in progress: Indigo spin loader
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-violet-500/30 flex items-center justify-center text-violet-400" title="In Progress">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  // Fail: Red Cross Icon
                  <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400/80 shadow-[0_0_8px_rgba(239,68,68,0.05)]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
