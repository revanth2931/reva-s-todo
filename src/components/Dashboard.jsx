import React from 'react';
import { format } from 'date-fns';
import TaskList from './TaskList';
import TaskForm from './TaskForm';

export default function Dashboard({ 
  tasks, 
  allTasks = [], 
  categories = [],
  todayStr, 
  completedTodayCount, 
  handleToggleTask, 
  handleDeleteTask, 
  handleAddTask, 
  userDoc,
  friends = [],
  friendsProfiles = {},
  onViewChange
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const pendingCount = tasks.length - completedTodayCount;
  const name = userDoc?.displayName?.split(' ')[0] || 'there';

  const dateObj = new Date();
  const dayName = format(dateObj, 'EEE').toUpperCase();
  const dateNum = format(dateObj, 'd');
  const monthName = format(dateObj, 'MMMM');

  // Determine global states
  const isNoTasks = allTasks.length === 0;
  const isAllDone = allTasks.length > 0 && pendingCount === 0;

  return (
    <div className="flex-1 flex flex-col xl:flex-row xl:gap-12 relative">
      {/* Main Content Column */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Top Greeting */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-[40px] font-extrabold text-zinc-100 tracking-tight">
            {getGreeting()}, {name}<span className="text-violet-500">.</span>
          </h1>
          <p className="text-zinc-200 text-lg sm:text-2xl mt-4 font-semibold tracking-tight leading-relaxed max-w-xl">
            {isNoTasks 
              ? "Let's start fresh. Add your first habit below! 🌱"
              : isAllDone 
                ? "All habits done for today. Great job! 🎉"
                : `You have ${pendingCount} habit${pendingCount > 1 ? 's' : ''} left to complete today.`}
          </p>
        </div>

        {/* Date Header Block */}
        <div className="flex items-center pl-1 mb-8 select-none">
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-violet-500 tracking-widest uppercase leading-none">{dayName}</span>
            <span className="text-3xl font-black text-zinc-100 leading-none mt-1.5">{dateNum}</span>
          </div>
          {/* Subtle violet dot separator */}
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500/70 mx-5 shrink-0" />
          <div className="flex flex-col justify-center">
            <span className="text-base font-bold text-zinc-300 leading-none">{monthName}</span>
            <span className="text-sm text-zinc-500 font-medium mt-1.5">{completedTodayCount} / {tasks.length} completed</span>
          </div>
        </div>

        {/* Habits List */}
        <div className="flex-grow">
          <TaskList
            tasks={tasks}
            categories={categories}
            todayStr={todayStr}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
          />
        </div>

        {/* Sticky Bottom Input */}
        <div className="sticky bottom-4 left-0 right-0 z-10 mt-8">
          <TaskForm onAddTask={handleAddTask} categories={categories} />
        </div>
      </div>

      {/* Connections Panel (right-side desktop only) */}
      <div className="hidden xl:flex w-[340px] shrink-0 flex-col sticky top-8 max-h-[calc(100vh-80px)] overflow-y-auto border-l border-zinc-900/60 pl-8 gap-6 self-start select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <svg className="w-4.5 h-4.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Friends' Progress
            </span>
          </div>
          {friends.length > 0 && (
            <button 
              onClick={() => onViewChange('profile')}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-900/50 transition-colors flex items-center justify-center"
              title="Add Connection"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        {friends.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-zinc-900/10 border border-dashed border-zinc-800/80 flex flex-col items-center gap-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Connect with friends to see their progress here.
            </p>
            <button
              onClick={() => onViewChange('profile')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-800 hover:border-violet-500/50 bg-zinc-900/40 hover:bg-zinc-900/80 text-zinc-300 hover:text-white text-xs font-semibold transition-all duration-300 active:scale-[0.98] shadow-sm w-full"
            >
              <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Connection
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {friends.map((friendId) => {
              const profile = friendsProfiles[friendId];
              if (!profile) return null;

              const completed = profile.todayCompletedCount || 0;
              const total = profile.todayTotalCount || 0;
              const streak = profile.currentStreak || 0;

              return (
                <div 
                  key={friendId} 
                  className="p-3.5 rounded-xl bg-zinc-900/20 border border-zinc-800/60 flex items-center justify-between hover:border-zinc-700/60 hover:bg-zinc-900/30 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        profile.displayName?.[0] || 'U'
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col font-sans">
                      <span className="block text-sm font-bold text-zinc-200 truncate leading-tight">
                        {profile.displayName}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-semibold mt-1">
                        {completed}/{total} today
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-bold text-[11px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full select-none shrink-0">
                    🔥 {streak}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
