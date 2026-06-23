import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } }
};

// Format 24h time to 12h display
function formatTime12h(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function TaskItem({ 
  task, 
  isCompleted, 
  onToggle, 
  onDelete, 
  onEdit,
  todayStr, 
  categories = [] 
}) {
  const isOverdue = !task.completed && task.createdDate < todayStr;
  const categoryObj = categories.find(c => c.name === task.description) || { color: '#a1a1aa' };
  const categoryColor = categoryObj.color;

  return (
    <motion.div
      variants={itemVariants}
      layout
      animate={{ opacity: isCompleted ? 0.45 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
      className={`group flex items-center justify-between py-5 lg:py-5.5 border-b border-zinc-900 transition-colors duration-200 ease-in-out ${isCompleted ? 'bg-transparent hover:bg-zinc-900/10' : 'hover:bg-zinc-900/30'}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0 px-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`flex-shrink-0 w-6.5 h-6.5 lg:w-7.5 lg:h-7.5 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 ${isCompleted ? 'bg-violet-600 border-none' : 'border-2 border-zinc-700 hover:border-violet-500 hover:bg-violet-500/10'}`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <svg
            className={`w-4 h-4 lg:w-4.5 lg:h-4.5 text-white transition-all duration-150 transform ${isCompleted ? 'scale-100 rotate-0' : 'scale-0 -rotate-12'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <div 
          className="flex-1 min-w-0 pr-3 flex flex-col justify-center cursor-pointer"
          onClick={() => onEdit && onEdit(task)}
        >
          <div className="flex items-center gap-2.5">
            <span 
              className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: categoryColor, boxShadow: `0 0 6px ${categoryColor}40` }}
              title={task.description}
            />
            <span
              className={`block text-[19px] lg:text-[21px] font-semibold transition-all duration-150 truncate ${isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}
            >
              {task.title}
            </span>
          </div>
          
          {(isOverdue || task.reminderTime) && (
            <div className="flex items-center gap-3.5 mt-1.5 pl-[26px] flex-wrap">
              {isOverdue && (
                <span className="text-xs lg:text-sm font-extrabold text-amber-500/90 tracking-wider uppercase">
                  Overdue
                </span>
              )}
              {task.reminderTime && (
                <div className="flex items-center gap-1 text-violet-400/80">
                  <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold tabular-nums">
                    {formatTime12h(task.reminderTime)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="flex-shrink-0 p-2 mr-2 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <svg className="w-5.5 h-5.5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </motion.div>
  );
}
