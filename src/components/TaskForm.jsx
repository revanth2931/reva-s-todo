import React, { useState } from "react";

const CATEGORIES = ["Work", "Personal", "Health", "Other"];

export default function TaskForm({ onAddTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Personal");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddTask(name.trim(), category);
    setName("");
    setCategory("Personal");
    setIsOpen(false);
  };

  const handleCancel = () => {
    setName("");
    setCategory("Personal");
    setIsOpen(false);
  };

  return (
    <div className="mt-4 transition-all duration-300 ease-in-out">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-800/80 hover:border-violet-500/50 bg-zinc-900/40 hover:bg-zinc-900/80 text-zinc-300 hover:text-white font-medium text-sm transition-all duration-300 active:scale-[0.98]"
        >
          <svg
            className="w-4 h-4 text-violet-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Task
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md transition-all duration-300 ease-in-out animate-fadeIn"
        >
          <div className="space-y-4">
            {/* Task Name Input */}
            <div>
              <label
                htmlFor="task-name"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
              >
                Habit / Task Name
              </label>
              <input
                id="task-name"
                type="text"
                placeholder="E.g., Read for 30 mins, Exercise, Meditate..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-violet-500 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all duration-300"
              />
            </div>

            {/* Category Selector Grid */}
            <div>
              <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Category
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  let colorClasses = "";

                  // Categorized styling on selection
                  if (isSelected) {
                    if (cat === "Work")
                      colorClasses =
                        "bg-blue-500/10 border-blue-500/50 text-blue-400";
                    else if (cat === "Personal")
                      colorClasses =
                        "bg-purple-500/10 border-purple-500/50 text-purple-400";
                    else if (cat === "Health")
                      colorClasses =
                        "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
                    else
                      colorClasses =
                        "bg-zinc-500/20 border-zinc-500 text-zinc-300";
                  } else {
                    colorClasses =
                      "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300";
                  }

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold tracking-wide text-center transition-all duration-300 active:scale-95 ${colorClasses}`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs font-semibold hover:bg-zinc-800/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-500 text-xs font-semibold shadow-md shadow-violet-500/10 transition-all duration-300 active:scale-95"
              >
                Save Habit
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
