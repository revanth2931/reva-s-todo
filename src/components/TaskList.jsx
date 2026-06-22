import React from 'react';
import TaskItem from './TaskItem';

export default function TaskList({ tasks, todayStr, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-zinc-900/20 border border-dashed border-zinc-800/80 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-zinc-800/40 flex items-center justify-center text-zinc-500 mb-3.5">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-400">No tasks for today</p>
        <p className="text-xs text-zinc-600 mt-1">Create a new habit or task below to build your streak!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isCompleted={task.completedDates.includes(todayStr)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
