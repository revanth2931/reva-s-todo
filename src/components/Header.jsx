import React from 'react';

export default function Header({ currentStreak = 0, longestStreak = 0 }) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80 mb-6">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-[0_8px_20px_rgba(124,58,237,0.3)]">
          <svg className="w-6.5 h-6.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            HabitFlow
          </h1>
          <p className="text-xs text-zinc-400 font-medium tracking-wide mt-0.5">Optimize your daily routine</p>
        </div>
      </div>

      {/* Streak Dashboard Card */}
      <div className="flex items-center bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-1 shadow-inner select-none w-full md:w-auto">
        {/* Current Streak */}
        <div className="flex flex-col items-center px-5 py-2.5 min-w-[100px] border-r border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs uppercase tracking-wider">
            <span className="text-sm">🔥</span>
            <span>Streak</span>
          </div>
          <span className="text-xl font-black text-zinc-100 mt-1 drop-shadow-[0_0_8px_rgba(249,115,22,0.2)]">
            {currentStreak} <span className="text-xs font-semibold text-zinc-500">Days</span>
          </span>
        </div>

        {/* Longest Streak */}
        <div className="flex flex-col items-center px-5 py-2.5 min-w-[100px]">
          <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-xs uppercase tracking-wider">
            {/* Trophy Icon */}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm-2 4h4M8 14h8m-8-4h8" />
            </svg>
            <span>Best</span>
          </div>
          <span className="text-xl font-black text-zinc-100 mt-1">
            {longestStreak} <span className="text-xs font-semibold text-zinc-500">Days</span>
          </span>
        </div>
      </div>
    </header>
  );
}
