import React, { useState, useEffect, useRef } from "react";

export default function TaskForm({ onAddTask, categories = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Personal");
  const inputRef = useRef(null);

  // Sync category state with first available category if "Personal" is missing
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

    onAddTask(name.trim(), category);
    setName("");
    setIsOpen(false);
  };

  const handleCancel = () => {
    setName("");
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl text-zinc-400 hover:text-white transition-all shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        >
          <svg
            className="w-5 h-5 text-violet-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-base font-medium">Add task</span>
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col gap-3 animate-fadeIn"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="I want to..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-zinc-100 text-base placeholder-zinc-500 border-none outline-none focus:ring-0 px-1 py-2"
          />
          
          <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
            {/* Dynamic Categories selector */}
            <div className="flex gap-2 overflow-x-auto pr-2 py-0.5 max-w-[70%] scrollbar-none select-none">
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className="px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-800 shrink-0 select-none cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? cat.color : 'transparent',
                      color: isSelected ? '#09090b' : '#a1a1aa',
                      borderColor: isSelected ? cat.color : '#27272a'
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ 
                        backgroundColor: isSelected ? '#09090b' : cat.color 
                      }} 
                    />
                    {cat.name}
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="p-1.5 rounded-lg bg-violet-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
