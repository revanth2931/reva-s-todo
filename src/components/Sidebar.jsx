import React, { useState } from 'react';

const COLOR_PRESETS = [
  { value: '#60a5fa', name: 'Blue' },
  { value: '#c084fc', name: 'Purple' },
  { value: '#34d399', name: 'Emerald' },
  { value: '#fb7185', name: 'Rose' },
  { value: '#fbbf24', name: 'Amber' },
  { value: '#a1a1aa', name: 'Zinc' }
];

export default function Sidebar({ 
  userDoc, 
  currentView, 
  onViewChange, 
  isOpen, 
  onClose, 
  tasks = [], 
  categories = [],
  selectedCategory = 'All', 
  onCategorySelect,
  onAddCategory,
  onDeleteCategory
}) {
  const currentStreak = userDoc?.currentStreak || 0;
  
  // Category form states
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0].value);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setErrorMsg('Name required');
      return;
    }
    setErrorMsg('');
    try {
      await onAddCategory(newCatName.trim(), newCatColor);
      setNewCatName('');
      setIsAdding(false);
    } catch (err) {
      console.error("Error creating category in Sidebar.jsx:", err);
      // Toasted by App.jsx
    }
  };

  const handleCancelAdd = () => {
    setNewCatName('');
    setErrorMsg('');
    setIsAdding(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[280px] lg:w-[250px] bg-zinc-950 p-6 lg:p-5 lg:py-6 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static shrink-0 select-none`}
      >
        {/* User Profile Block */}
        <div className="flex items-center gap-4 mb-6 lg:mb-6">
          <div className="w-12 h-12 lg:w-11 lg:h-11 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0">
            {userDoc?.photoURL ? (
              <img src={userDoc.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base lg:text-sm font-black text-zinc-500">
                {userDoc?.displayName?.[0] || 'U'}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[17px] lg:text-[14px] font-bold text-zinc-100 truncate">
              {userDoc?.displayName || 'Task Tracker'}
            </span>
            <span className="text-sm lg:text-xs font-bold text-orange-400 truncate mt-1">
              🔥 {currentStreak} Day Streak
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 lg:gap-1">
          <NavItem 
            icon={<svg className="w-5.5 h-5.5 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            label="Today" 
            active={currentView === 'dashboard' && selectedCategory === 'All'} 
            onClick={() => { onCategorySelect('All'); onViewChange('dashboard'); onClose(); }} 
          />
          <NavItem 
            icon={<svg className="w-5.5 h-5.5 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="History" 
            active={currentView === 'history'} 
            onClick={() => { onViewChange('history'); onClose(); }} 
          />
          <NavItem 
            icon={<svg className="w-5.5 h-5.5 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            label="Profile & Connections" 
            active={currentView === 'profile'} 
            onClick={() => { onViewChange('profile'); onClose(); }} 
          />
        </nav>

        {/* Categories Section */}
        <div className="mt-6 lg:mt-6 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3 px-4">
            <span className="text-[12px] lg:text-[11px] font-extrabold text-zinc-500 tracking-widest uppercase leading-none">
              Categories
            </span>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-900/50 transition-colors flex items-center justify-center"
              title="Add Category"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Inline Add Category Form */}
          {isAdding && (
            <form onSubmit={handleAddSubmit} className="mb-4 p-4 lg:p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl flex flex-col gap-4 lg:gap-3 animate-fadeIn mx-2 shrink-0">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Category name..."
                maxLength={18}
                className="bg-transparent text-sm w-full outline-none border-b border-zinc-800 focus:border-violet-500/50 p-1 text-zinc-100 placeholder-zinc-500 text-[15px] lg:text-[13px]"
                autoFocus
              />
              {errorMsg && (
                <span className="text-[11px] text-red-400 font-bold px-1 -mt-2.5 animate-fadeIn">
                  ⚠️ {errorMsg}
                </span>
              )}
              
              {/* Color dots picker */}
              <div className="flex items-center justify-between gap-2 px-0.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase">Color:</span>
                <div className="flex gap-2">
                  {COLOR_PRESETS.map((color) => {
                    const isSelected = newCatColor === color.value;
                    return (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewCatColor(color.value)}
                        className={`w-4 h-4 lg:w-3.5 lg:h-3.5 rounded-full transition-transform shrink-0 relative ${
                          isSelected ? 'scale-110 ring-2 ring-violet-500/50 ring-offset-2 ring-offset-zinc-950' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="px-3.5 py-1.5 text-[13px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg text-[13px] font-semibold transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Categories List Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar pr-1 flex flex-col gap-1.5 mb-4">
            {/* Default All Categories Filter */}
            <button
              onClick={() => onCategorySelect('All')}
              className={`flex items-center justify-between px-4 py-2.5 lg:py-2 rounded-xl transition-all duration-200 text-[16px] lg:text-sm font-bold w-full text-left mb-1 shrink-0 ${
                currentView === 'dashboard' && selectedCategory === 'All'
                  ? 'bg-zinc-900/70 text-violet-400' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <svg 
                  className={`w-4.5 h-4.5 lg:w-4 lg:h-4 shrink-0 ${currentView === 'dashboard' && selectedCategory === 'All' ? 'text-violet-400' : 'text-zinc-500'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>All Tasks</span>
              </div>
              
              {tasks.filter(t => !t.completed).length > 0 && (
                <span className={`text-xs lg:text-xs px-2.5 py-0.5 lg:px-2 lg:py-0.5 rounded-full font-bold shrink-0 ${
                  currentView === 'dashboard' && selectedCategory === 'All'
                    ? 'bg-violet-500/20 text-violet-300' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}>
                  {tasks.filter(t => !t.completed).length}
                </span>
              )}
            </button>

            {categories.map((cat) => {
              const count = tasks.filter(t => t.description === cat.name && !t.completed).length;
              return (
                <CategoryItem
                  key={cat.id}
                  label={cat.name}
                  active={currentView === 'dashboard' && selectedCategory === cat.name}
                  count={count}
                  color={cat.color}
                  onDelete={() => onDeleteCategory(cat.id, cat.name)}
                  onClick={() => {
                    onCategorySelect(cat.name);
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Today's Progress Section */}
        <div className="mt-auto pt-4 border-t border-zinc-900/60 flex flex-col shrink-0">
          <span className="text-[12px] lg:text-[11px] font-extrabold text-zinc-500 tracking-widest uppercase mb-4 px-4 leading-none">
            Today's Progress
          </span>
          <div className="flex items-center gap-2 px-4 py-2.5">
            {tasks.length === 0 ? (
              <div className="h-2.5 w-full rounded-full bg-zinc-800/30" />
            ) : (
              (() => {
                const completedCount = tasks.filter(t => t.completed).length;
                return tasks.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-2 lg:h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      idx < completedCount 
                        ? 'bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.4)]' 
                        : 'bg-zinc-800/60'
                    }`}
                  />
                ));
              })()
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 lg:gap-3 px-4 py-3 lg:py-2 border-l-2 transition-all duration-200 font-bold text-[16px] lg:text-sm w-full text-left ${
        active 
          ? 'bg-zinc-900 text-violet-400 border-violet-500 rounded-r-lg' 
          : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/50 rounded-lg'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CategoryItem({ label, active, count, color, onDelete, onClick }) {
  const isOther = label.toLowerCase() === 'other';

  return (
    <div className="group flex items-center relative w-full">
      <button
        onClick={onClick}
        className={`flex items-center justify-between px-4 py-2.5 lg:py-2 rounded-xl transition-all duration-200 text-[16px] lg:text-sm font-bold w-full text-left pr-10 ${
          active 
            ? 'bg-zinc-900/70 text-violet-400' 
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
        }`}
      >
        <div className="flex items-center gap-3.5 lg:gap-3 min-w-0">
          <span 
            className="w-3 h-3 lg:w-2.5 lg:h-2.5 rounded-full shrink-0 shadow-sm" 
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}50`
            }} 
          />
          <span className="truncate">{label}</span>
        </div>
        
        {count > 0 && (
          <span className={`text-xs lg:text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0 transition-opacity group-hover:opacity-0 ${
            active 
              ? 'bg-violet-500/20 text-violet-300' 
              : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
          }`}>
            {count}
          </span>
        )}
      </button>

      {/* Delete cross (hover only, undeletable on "Other") */}
      {!isOther && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
          title={`Delete category "${label}"`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
