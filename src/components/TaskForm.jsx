import React, { useState, useEffect, useRef } from "react";
import ModernTimePicker from "./ModernTimePicker";

export default function TaskForm({ onAddTask, categories = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Personal");
  const [reminderTime, setReminderTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const inputRef = useRef(null);

  // Sync category state with first available category if selected is missing
  useEffect(() => {
    if (categories.length > 0) {
      const hasSelected = categories.some(c => c.name === category);
      if (!hasSelected) {
        const fallback = categories.find(c => c.name === 'Personal') || categories[0];
        setCategory(fallback.name);
      }
    }
  }, [categories, category]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddTask(name.trim(), category, reminderTime || null);
    setName("");
    setReminderTime("");
    setIsOpen(false);
  };

  const handleCancel = () => {
    setName("");
    setReminderTime("");
    setIsOpen(false);
  };

  // Format time from HH:MM (24h) to 12h display
  function formatTime12h(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const period = h < 12 ? 'AM' : 'PM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

  return (
    <div className="w-full">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-4 py-4.5 px-6 lg:py-5 lg:px-8 rounded-xl border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl text-zinc-400 hover:text-white transition-all shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        >
          <svg className="w-6 h-6 lg:w-7 lg:h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-lg lg:text-xl font-semibold">Add task</span>
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-5 lg:p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col gap-4 lg:gap-5 animate-fadeIn"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="I want to..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-zinc-100 text-lg lg:text-xl placeholder-zinc-500 border-none outline-none focus:ring-0 px-2 py-3 lg:py-4"
          />

          {/* Bottom row: reminder + categories + actions */}
          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            {/* Left: Clock icon to set reminder + selected time */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowTimePicker(true)}
                title="Set reminder time"
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                  reminderTime
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30'
                    : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-300'
                }`}
                aria-label="Set reminder"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {reminderTime && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-violet-300 tabular-nums">{formatTime12h(reminderTime)}</span>
                  <button
                    type="button"
                    onClick={() => setReminderTime("")}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                    aria-label="Clear reminder"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto pr-1 py-1 scrollbar-none select-none">
                {categories.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className="px-3 py-1 lg:px-4 lg:py-1.5 rounded-full text-xs lg:text-sm font-extrabold transition-all flex items-center gap-1.5 border border-zinc-800 shrink-0 select-none cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? cat.color : 'transparent',
                        color: isSelected ? '#09090b' : '#a1a1aa',
                        borderColor: isSelected ? cat.color : '#27272a'
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isSelected ? '#09090b' : cat.color }}
                      />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Cancel + Submit */}
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <button
                type="button"
                onClick={handleCancel}
                className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-6 h-6 lg:w-6.5 lg:h-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="p-2.5 rounded-xl bg-violet-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors active:scale-95"
              >
                <svg className="w-6 h-6 lg:w-6.5 lg:h-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Modern Time Picker dialog */}
      {showTimePicker && (
        <ModernTimePicker
          initialTime={reminderTime}
          onConfirm={(time) => { setReminderTime(time); setShowTimePicker(false); }}
          onCancel={() => setShowTimePicker(false)}
        />
      )}
    </div>
  );
}
