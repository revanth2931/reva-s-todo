import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModernTimePicker from './ModernTimePicker';

// Format time from 24h HH:MM to 12h display
function formatTime12h(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function TaskEditModal({
  task,
  categories = [],
  onClose,
  onToggle,
  onUpdate,
  onUpdateReminder,
  onDelete,
}) {
  const [title, setTitle] = useState(task.title || '');
  const [category, setCategory] = useState(task.description || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    setTitle(task.title || '');
    setCategory(task.description || '');
    setNotes(task.notes || '');
  }, [task]);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSaveTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdate(task.id, { title: trimmed });
    }
  };

  const handleSaveNotes = () => {
    if (notes !== (task.notes || '')) {
      onUpdate(task.id, { notes });
    }
  };

  const handleCategoryChange = (catName) => {
    setCategory(catName);
    onUpdate(task.id, { description: catName });
  };

  const handleSetTime = (time) => {
    setShowTimePicker(false);
    onUpdateReminder(task.id, time);
  };

  const handleClearReminder = () => {
    onUpdateReminder(task.id, null);
  };

  const categoryObj = categories.find(c => c.name === category);
  const catColor = categoryObj?.color || '#a1a1aa';
  const breadcrumb = `My Lists › ${category || 'All Tasks'}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-lg" onClick={onClose} />

        {/* Modal Panel — 1.5× wider, taller paddings, larger text */}
        <motion.div
          className="relative z-10 w-full max-w-3xl mx-5 mb-5 sm:mb-0 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
          initial={{ y: 80, scale: 0.97, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 50, scale: 0.96, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-zinc-800/80">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2.5 text-sm font-semibold text-zinc-500 min-w-0">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="truncate text-base">{breadcrumb}</span>
            </div>

            {/* Actions: Complete + Close */}
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button
                onClick={() => { onToggle(task.id); onClose(); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-150 ${
                  task.completed
                    ? 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {task.completed ? 'Completed' : 'Complete'}
              </button>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Task Title */}
          <div className="px-8 pt-7 pb-4">
            <div className="flex items-start gap-4">
              <span
                className="w-5 h-5 rounded-full shrink-0 mt-2.5"
                style={{ backgroundColor: catColor, boxShadow: `0 0 12px ${catColor}55` }}
              />
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                rows={title.length > 50 ? 3 : 2}
                placeholder="Task name..."
                className={`flex-1 bg-transparent text-[2rem] font-bold placeholder-zinc-600 outline-none resize-none leading-snug ${
                  task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                }`}
              />
            </div>
          </div>

          {/* Pills Row — Remind Me */}
          <div className="px-8 py-4 flex flex-wrap gap-3 border-t border-zinc-800/50">
            <div className="flex items-center gap-2">
              {task.reminderTime ? (
                <div className="flex items-center gap-3 bg-violet-600/15 border border-violet-500/30 rounded-full px-5 py-2.5">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span
                    className="text-sm font-bold text-violet-300 cursor-pointer hover:text-violet-200"
                    onClick={() => setShowTimePicker(true)}
                  >
                    {formatTime12h(task.reminderTime)}
                  </span>
                  <button
                    onClick={handleClearReminder}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-violet-400/60 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTimePicker(true)}
                  className="flex items-center gap-2.5 bg-zinc-800/70 border border-zinc-700/60 hover:border-violet-500/40 hover:bg-zinc-800 rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Remind me
                </button>
              )}
            </div>
          </div>

          {/* Category Selector */}
          <div className="px-8 pb-5">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">Category</p>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.name)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border"
                    style={{
                      backgroundColor: isSelected ? cat.color : 'transparent',
                      color: isSelected ? '#09090b' : '#a1a1aa',
                      borderColor: isSelected ? cat.color : '#3f3f46',
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#09090b' : cat.color }}
                    />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Area */}
          <div className="px-8 pb-6 border-t border-zinc-800/50 pt-5">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              rows={4}
              placeholder="Add a description or notes..."
              className="w-full bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 focus:border-violet-500/50 rounded-2xl text-base text-zinc-300 placeholder-zinc-700 px-5 py-4 outline-none resize-none transition-colors focus:bg-zinc-950/80 leading-relaxed"
            />
          </div>

          {/* Footer: Delete */}
          <div className="px-8 py-4 border-t border-zinc-800/60 flex items-center justify-end">
            <button
              onClick={() => { onDelete(task.id); onClose(); }}
              className="flex items-center gap-2.5 text-sm font-semibold text-zinc-600 hover:text-red-400 transition-colors py-2.5 px-5 rounded-xl hover:bg-red-500/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete task
            </button>
          </div>
        </motion.div>

        {/* Modern Time Picker */}
        {showTimePicker && (
          <ModernTimePicker
            initialTime={task.reminderTime || ''}
            onConfirm={handleSetTime}
            onCancel={() => setShowTimePicker(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
