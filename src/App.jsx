import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import Header from "./components/Header";
import ProgressBar from "./components/ProgressBar";
import TaskList from "./components/TaskList";
import TaskForm from "./components/TaskForm";
import HistoryView from "./components/HistoryView";
import { calculateStreaks } from "./utils/streak";

export default function App() {
  // 1. Initialize states from localStorage
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("algolens_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [streakLog, setStreakLog] = useState(() => {
    const saved = localStorage.getItem("algolens_streak_log");
    return saved ? JSON.parse(saved) : {};
  });

  const [todayStr, setTodayStr] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [historyOpen, setHistoryOpen] = useState(false);

  // 2. Persist tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("algolens_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // 3. Keep track of current day and trigger midnight reset
  useEffect(() => {
    const checkDateInterval = setInterval(() => {
      const currentDay = format(new Date(), "yyyy-MM-dd");
      setTodayStr((prev) => {
        if (prev !== currentDay) {
          return currentDay;
        }
        return prev;
      });
    }, 10000); // Check every 10 seconds for date roll-over

    return () => clearInterval(checkDateInterval);
  }, []);

  // 4. Update the streak log when today's tasks completion status changes
  useEffect(() => {
    const totalCount = tasks.length;
    const completedCount = tasks.filter((t) =>
      t.completedDates.includes(todayStr),
    ).length;
    const isComplete = totalCount > 0 && completedCount === totalCount;

    setStreakLog((prev) => {
      if (prev[todayStr] === isComplete) return prev;
      const updatedLog = { ...prev, [todayStr]: isComplete };
      localStorage.setItem("algolens_streak_log", JSON.stringify(updatedLog));
      return updatedLog;
    });
  }, [tasks, todayStr]);

  // 5. Calculate statistics reactively
  const { currentStreak, longestStreak } = calculateStreaks(
    streakLog,
    todayStr,
  );
  const completedTodayCount = tasks.filter((t) =>
    t.completedDates.includes(todayStr),
  ).length;

  // 6. Action Handlers
  const handleAddTask = useCallback((name, category) => {
    const newTask = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      category,
      completedDates: [],
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const handleToggleTask = useCallback(
    (taskId) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          const isCompleted = task.completedDates.includes(todayStr);
          const updatedDates = isCompleted
            ? task.completedDates.filter((d) => d !== todayStr)
            : [...task.completedDates, todayStr];
          return { ...task, completedDates: updatedDates };
        }),
      );
    },
    [todayStr],
  );

  const handleDeleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden font-sans">
      {/* Decorative Floating Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none select-none" />

      {/* Main Glass Dashboard Card */}
      <div className="relative w-full max-w-xl bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col gap-6">
        {/* Top: App name + current streak badge */}
        <Header currentStreak={currentStreak} longestStreak={longestStreak} />

        {/* Middle: Today's task list with progress bar */}
        <div className="flex flex-col gap-5">
          <ProgressBar
            completedCount={completedTodayCount}
            totalCount={tasks.length}
          />

          <div className="space-y-3">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
              Today's Tasks
            </h2>
            <TaskList
              tasks={tasks}
              todayStr={todayStr}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          </div>
        </div>

        {/* Bottom: "+ Add Task" button that opens an inline form */}
        <TaskForm onAddTask={handleAddTask} />

        {/* Toggle button to show/hide the 7-day history panel */}
        <div className="flex flex-col items-center border-t border-zinc-800/60 pt-4 mt-2">
          <button
            id="toggle-history-btn"
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-all duration-300"
          >
            {historyOpen ? "Hide History" : "Show History"}
            <svg
              className={`w-3.5 h-3.5 transform transition-transform duration-300 ${
                historyOpen ? "rotate-180 text-violet-400" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Renders history view calendar inline */}
          <HistoryView
            streakLog={streakLog}
            todayStr={todayStr}
            isOpen={historyOpen}
          />
        </div>
      </div>
    </main>
  );
}
