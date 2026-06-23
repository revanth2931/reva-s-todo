import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } }
};

export default function TaskItem({ 
  task, 
  isCompleted, 
  onToggle, 
  onDelete, 
  todayStr, 
  categories = [] 
}) {
  const isOverdue = !task.completed && task.createdDate < todayStr;
  const streakCount = task.streakCount || 0;

  // Resolve category color dynamically from local categories array
  const categoryObj = categories.find(c => c.name === task.description) || { color: '#a1a1aa' };
  const categoryColor = categoryObj.color;

  return (
    <motion.div
      variants={itemVariants}
      layout
      animate={{ 
        opacity: isCompleted ? 0.45 : 1, 
        scale: 1,
        y: 0
      }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
      className={`group flex items-center justify-between py-3.5 border-b border-zinc-900 transition-colors duration-200 ease-in-out ${
        isCompleted ? 'bg-transparent hover:bg-zinc-900/10' : 'hover:bg-zinc-900/30'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0 px-2">
        {/* Toggle Checkbox Button */}
        <button
          onClick={() => onToggle(task.id)}
          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 ${
            isCompleted
              ? 'bg-violet-600 border-none'
              : 'border-2 border-zinc-700 hover:border-violet-500 hover:bg-violet-500/10'
          }`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <svg
            className={`w-3 h-3 text-white transition-all duration-150 transform ${
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
        <div className="flex-1 min-w-0 pr-3 flex flex-col justify-center">
          <div className="flex items-center gap-2.5">
            {/* Minimal Color Coded Category Dot */}
            <span 
              className="w-2 h-2 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: categoryColor,
                boxShadow: `0 0 6px ${categoryColor}40`
              }} 
              title={task.description}
            />
            <span
              className={`block text-[17px] font-medium transition-all duration-150 truncate ${
                isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-200'
              }`}
            >
              {task.title}
            </span>
          </div>
          
          {/* Subtle Details Subline (Overdue, Streaks) */}
          {(isOverdue || streakCount > 0) && (
            <div className="flex items-center gap-3 mt-1.5 pl-[18px] flex-wrap animate-fadeIn">
              {isOverdue && (
                <span className="text-[10px] font-bold text-amber-500/90 tracking-wider uppercase">
                  Overdue
                </span>
              )}
              {streakCount > 0 && (
                <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                  🔥 {streakCount} Days
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 p-1.5 mr-2 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </motion.div>
  );
}
