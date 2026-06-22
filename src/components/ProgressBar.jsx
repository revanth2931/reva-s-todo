import React from 'react';

export default function ProgressBar({ completedCount = 0, totalCount = 0 }) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 mb-6 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
            Daily Progress
          </span>
          <h2 className="text-2xl font-black text-zinc-100 mt-1">
            {percentage === 100 ? '🎉 All Done!' : 'Keep Moving Forward'}
          </h2>
        </div>
        
        <div className="text-right">
          <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {completedCount}
          </span>
          <span className="text-zinc-500 font-semibold text-sm mx-1">/</span>
          <span className="text-zinc-400 font-semibold text-sm">
            {totalCount}
          </span>
          <p className="text-[10px] text-zinc-500 font-medium tracking-wide mt-0.5">habits completed</p>
        </div>
      </div>

      {/* Progress Track and Fill */}
      <div className="relative w-full h-4 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/40 shadow-inner">
        <div
          style={{ width: `${percentage}%` }}
          className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-500 rounded-full transition-all duration-750 ease-out shadow-[0_0_15px_rgba(124,58,237,0.5)]"
        />
        {/* Glow accent */}
        <div
          style={{ width: `${percentage}%` }}
          className="absolute inset-0 h-full bg-white/10 opacity-30 mix-blend-overlay rounded-full transition-all duration-750 ease-out"
        />
      </div>

      <div className="flex justify-between items-center mt-2.5">
        <span className="text-[10px] text-zinc-500 font-medium">0%</span>
        <span className="text-[10px] text-violet-400 font-bold tracking-wider uppercase bg-violet-500/10 px-2.5 py-0.5 rounded-full">
          {percentage}% Complete
        </span>
        <span className="text-[10px] text-zinc-500 font-medium">100%</span>
      </div>
    </div>
  );
}
