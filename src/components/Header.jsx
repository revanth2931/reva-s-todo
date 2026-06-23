import React, { useState } from 'react';

export default function Header({ 
  userDoc, 
  onViewChange, 
  onMenuToggle, 
  searchQuery = '', 
  onSearchChange, 
  showToast,
  currentView 
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefresh = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    showToast("Habits synced with cloud! ✨");
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  return (
    <header className="flex items-center justify-between h-16 mb-2">
      <div className="flex items-center gap-3 h-full">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Right Icons Row */}
      <div className="flex items-center justify-end gap-5 h-full">
        {/* Expandable Search Bar */}
        {currentView === 'dashboard' && (
          <>
            {isSearchOpen ? (
              <div className="flex items-center bg-zinc-900 border border-zinc-800/80 rounded-full px-3 py-1.5 text-zinc-200 gap-2 focus-within:border-violet-500/50 transition-all w-48 sm:w-60 animate-fadeIn shrink-0">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search habits..." 
                  className="bg-transparent text-xs w-full outline-none border-none focus:ring-0 p-0 text-zinc-100 placeholder-zinc-500"
                  autoFocus
                />
                <button 
                  onClick={() => { onSearchChange(''); setIsSearchOpen(false); }}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all"
                aria-label="Search habits"
              >
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Sync/Refresh Button */}
        <button 
          onClick={handleRefresh}
          className="w-9 h-9 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all"
          aria-label="Sync with cloud"
        >
          <svg 
            className={`w-5.5 h-5.5 transition-transform duration-1000 ${isSyncing ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        {/* Notifications Bell */}
        <button 
          onClick={() => showToast("No new notifications 🔔")}
          className="w-9 h-9 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all"
          aria-label="Notifications"
        >
          <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* Profile Picture / Account Button */}
        <button 
          onClick={() => onViewChange('profile')}
          className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800 hover:border-violet-500 bg-zinc-900 transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer ml-1"
          aria-label="Account Settings"
        >
          {userDoc?.photoURL ? (
            <img src={userDoc.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-black text-zinc-500">
              {userDoc?.displayName?.[0] || 'U'}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
