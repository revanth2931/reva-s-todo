import React from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = {
  Work: {
    badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]',
    dot: 'bg-blue-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  Personal: {
    badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.05)]',
    dot: 'bg-purple-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  Health: {
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]',
    dot: 'bg-emerald-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  Other: {
    badge: 'bg-zinc-500/10 text-zinc-400 border border-zinc-700/50 shadow-[0_0_10px_rgba(255,255,255,0.02)]',
    dot: 'bg-zinc-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

export default function TaskItem({ task, isCompleted, onToggle, onDelete, todayStr }) {
  // Derived state: A task is overdue if not completed and its createdDate is before today
  const isOverdue = !task.completed && task.createdDate < todayStr;
  const categoryConfig = CATEGORIES[task.description] || CATEGORIES.Other;
  const streakCount = task.streakCount || 0;

  return (
    <motion.div
      variants={itemVariants}
      layout
      animate={{ 
        opacity: isCompleted ? 0.4 : (isOverdue ? 0.75 : 1), 
        scale: isCompleted ? 0.98 : 1,
        y: 0
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeInOut" }}
      className={`group flex items-center justify-between p-4.5 rounded-2xl bg-zinc-900/40 border transition-all duration-300 ease-in-out ${
        isCompleted
          ? 'border-zinc-800/40 shadow-inner bg-zinc-950/20'
          : isOverdue
          ? 'border-zinc-800/80 border-l-4 border-l-amber-500/80 bg-zinc-950/10 shadow-md'
          : 'border-zinc-800/80 hover:border-zinc-700/80 hover:scale-[1.01] hover:translate-y-[-1px] hover:bg-zinc-900/60 shadow-md hover:shadow-lg'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Toggle Checkbox Button */}
        <button
          onClick={() => onToggle(task.id)}
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
            isCompleted
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 scale-105 shadow-[0_0_12px_rgba(124,58,237,0.4)] border-none'
              : 'border-2 border-zinc-700 hover:border-violet-500 hover:scale-105'
          }`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <svg
            className={`w-4 h-4 text-white transition-all duration-300 transform ${
              isCompleted ? 'scale-100 rotate-0' : 'scale-0 -rotate-12'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0 pr-3">
          <span
            className={`block text-base font-semibold transition-all duration-300 truncate ${
              isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-100'
            }`}
          >
            {task.title}
          </span>
          
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase select-none ${categoryConfig.badge}`}
            >
              {categoryConfig.icon}
              {task.description}
            </span>
            {isOverdue && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase select-none bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pending from {task.createdDate}
              </span>
            )}
            {streakCount > 0 && (
              <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1 select-none">
                <span className={`w-1 h-1 rounded-full ${categoryConfig.dot}`} />
                🔥 {streakCount} day streak
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </motion.div>
  );
}
