import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  writeBatch, 
  serverTimestamp, 
  runTransaction,
  deleteDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider, db } from './firebase';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import ProfilePage from './components/ProfilePage';
import { calculateStreaks } from './utils/streak';

export default function App() {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [todayStr, setTodayStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'history' | 'profile'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsProfiles, setFriendsProfiles] = useState({});

  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Helper to show toasts
  const showToast = useCallback((message) => {
    setToast({ message, visible: true });
  }, []);

  // Dismiss toast after 2s
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Listen to user document & handle one-time local storage migration
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserDoc(docSnap.data());
      } else {
        // Document does not exist: first-time user login
        const initialDoc = {
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          totalCompletedAllTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          streakLog: {},
          todayCompletedCount: 0,
          todayTotalCount: 0,
        };

        // Check if there are local storage tasks to migrate
        const localTasksRaw = localStorage.getItem('algolens_tasks');
        const localStreakLogRaw = localStorage.getItem('algolens_streak_log');

        if (localTasksRaw) {
          const localTasks = JSON.parse(localTasksRaw);
          const localStreakLog = localStreakLogRaw ? JSON.parse(localStreakLogRaw) : {};

          // Count all-time task completions
          let totalCompletions = 0;
          localTasks.forEach((t) => {
            if (t.completedDates) {
              totalCompletions += t.completedDates.length;
            }
          });

          // Calculate initial streaks
          const { currentStreak, longestStreak } = calculateStreaks(localStreakLog, todayStr);

          initialDoc.totalCompletedAllTime = totalCompletions;
          initialDoc.streakLog = localStreakLog;
          initialDoc.currentStreak = currentStreak;
          initialDoc.longestStreak = longestStreak;

          // Save user profile first
          setDoc(userDocRef, initialDoc).then(() => {
            // Batch migrate tasks
            const batch = writeBatch(db);
            localTasks.forEach((t) => {
              const taskRef = doc(db, 'tasks', user.uid, 'items', t.id);
              batch.set(taskRef, {
                title: t.name,
                description: t.category || 'Other',
                completed: t.completedDates ? t.completedDates.includes(todayStr) : false,
                createdDate: t.completedDates && t.completedDates.length > 0 ? t.completedDates[0] : todayStr,
                completedDate: t.completedDates && t.completedDates.length > 0 ? t.completedDates[t.completedDates.length - 1] : null,
                streakCount: 0,
              });
            });

            batch.commit().then(() => {
              // Clear migrated localStorage items
              localStorage.removeItem('algolens_tasks');
              localStorage.removeItem('algolens_streak_log');
              showToast('Migration completed successfully!');
            });
          });
        } else {
          // Standard creation for new user without local data
          setDoc(userDocRef, initialDoc);
        }
      }
    });

    return unsubscribe;
  }, [user, todayStr, showToast]);

  // 3. Live Sync user's tasks subcollection
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const tasksRef = collection(db, 'tasks', user.uid, 'items');
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const taskList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setTasks(taskList);
    });

    return unsubscribe;
  }, [user]);

  // 3.5 Live Sync user's categories subcollection
  useEffect(() => {
    if (!user) {
      setCategories([]);
      return;
    }

    const categoriesRef = collection(db, 'categories', user.uid, 'items');
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const catList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // If categories collection is empty, auto-seed defaults
      if (catList.length === 0) {
        const batch = writeBatch(db);
        const defaults = [
          { id: 'work', name: 'Work', color: '#60a5fa' },
          { id: 'personal', name: 'Personal', color: '#c084fc' },
          { id: 'health', name: 'Health', color: '#34d399' },
          { id: 'other', name: 'Other', color: '#a1a1aa' }
        ];
        defaults.forEach((def) => {
          const docRef = doc(db, 'categories', user.uid, 'items', def.id);
          batch.set(docRef, { name: def.name, color: def.color });
        });
        batch.commit().catch(err => console.error("Error setting default categories:", err));
      } else {
        setCategories(catList);
      }
    });

    return unsubscribe;
  }, [user]);

  // 3.7 Listen to friends list (mutual connections) at app-level
  useEffect(() => {
    if (!user) {
      setFriends([]);
      return;
    }
    const friendsRef = collection(db, 'connections', user.uid, 'friends');
    const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
      const friendIds = snapshot.docs.map(docSnap => docSnap.id);
      setFriends(friendIds);
    });
    return unsubscribe;
  }, [user]);

  // 3.8 Listen to friend profile documents live at app-level
  useEffect(() => {
    if (friends.length === 0) {
      setFriendsProfiles({});
      return;
    }
    const unsubscribes = friends.map(friendId => {
      return onSnapshot(doc(db, 'users', friendId), (snap) => {
        if (snap.exists()) {
          setFriendsProfiles(prev => ({
            ...prev,
            [friendId]: snap.data()
          }));
        }
      });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [friends]);

  // 4. Midnight Check: Roll over date string and reset completion states
  useEffect(() => {
    const checkDateInterval = setInterval(() => {
      const currentDay = format(new Date(), 'yyyy-MM-dd');
      setTodayStr((prev) => {
        if (prev !== currentDay) return currentDay;
        return prev;
      });
    }, 10000);

    return () => clearInterval(checkDateInterval);
  }, []);

  // Helper to reset completed tasks from previous days (client-side trigger)
  const resetOldCompletedTasks = useCallback(async (userUid, currentTasks) => {
    const batch = writeBatch(db);
    let hasUpdates = false;

    currentTasks.forEach((task) => {
      // Reset completed status to false if completed date belongs to a previous day
      if (task.completed && task.completedDate && task.completedDate < todayStr) {
        const taskRef = doc(db, 'tasks', userUid, 'items', task.id);
        batch.update(taskRef, { completed: false });
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      try {
        await batch.commit();
      } catch (err) {
        console.error("Error resetting completed tasks for new day: ", err);
      }
    }
  }, [todayStr]);

  // Reset completion trigger on day-change or list load
  useEffect(() => {
    if (!user || tasks.length === 0) return;
    resetOldCompletedTasks(user.uid, tasks);
  }, [todayStr, user, resetOldCompletedTasks, tasks.length]);

  // 5. Update user streak logs, current streaks, and daily stats when task statuses change
  useEffect(() => {
    if (!user || !userDoc) return;

    const totalCount = tasks.length;
    const completedCount = tasks.filter((t) => t.completed).length;
    const isComplete = totalCount > 0 && completedCount === totalCount;

    const currentTodayCompletedCount = userDoc.todayCompletedCount || 0;
    const currentTodayTotalCount = userDoc.todayTotalCount || 0;
    const streakLogStatus = userDoc.streakLog?.[todayStr] === true;

    const statsNeedSync = currentTodayCompletedCount !== completedCount || currentTodayTotalCount !== totalCount;
    const streakNeedsSync = totalCount > 0 && streakLogStatus !== isComplete;

    if (statsNeedSync || streakNeedsSync) {
      const updates = {};
      if (statsNeedSync) {
        updates.todayCompletedCount = completedCount;
        updates.todayTotalCount = totalCount;
      }
      if (streakNeedsSync) {
        const newStreakLog = { ...userDoc.streakLog, [todayStr]: isComplete };
        const { currentStreak, longestStreak } = calculateStreaks(newStreakLog, todayStr);
        updates.streakLog = newStreakLog;
        updates.currentStreak = currentStreak;
        updates.longestStreak = longestStreak;
      }

      updateDoc(doc(db, 'users', user.uid), updates).catch((err) => console.error("Error syncing user stats: ", err));
    }
  }, [tasks, todayStr, user, userDoc]);

  // 6. Action Handlers
  const handleAddTask = useCallback(async (title, description) => {
    if (!user) return;
    const taskId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const taskRef = doc(db, 'tasks', user.uid, 'items', taskId);

    await setDoc(taskRef, {
      title,
      description, // category
      completed: false,
      createdDate: todayStr,
      completedDate: null,
      streakCount: 0,
    });
  }, [user, todayStr]);

  const handleToggleTask = useCallback(async (taskId) => {
    if (!user || !userDoc) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isCompleted = task.completed && task.completedDate === todayStr;
    const newCompleted = !isCompleted;
    const newCompletedDate = newCompleted ? todayStr : null;

    // Calculate item streak counts
    let newStreakCount = task.streakCount || 0;
    if (newCompleted) {
      if (task.completedDate === yesterdayStr) {
        newStreakCount += 1;
      } else if (task.completedDate !== todayStr) {
        newStreakCount = 1;
      }
    } else {
      if (newStreakCount > 0) {
        newStreakCount -= 1;
      }
    }

    const taskRef = doc(db, 'tasks', user.uid, 'items', taskId);
    const userRef = doc(db, 'users', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        let newTotal = userData.totalCompletedAllTime || 0;
        if (newCompleted) {
          newTotal += 1;
        } else {
          newTotal = Math.max(0, newTotal - 1);
        }

        transaction.update(taskRef, {
          completed: newCompleted,
          completedDate: newCompletedDate,
          streakCount: newStreakCount,
        });

        transaction.update(userRef, {
          totalCompletedAllTime: newTotal,
        });
      });
    } catch (error) {
      console.error("Task toggle transaction failed:", error);
    }
  }, [user, userDoc, tasks, todayStr, yesterdayStr]);

  const handleDeleteTask = useCallback(async (taskId) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'tasks', user.uid, 'items', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }, [user]);

  const handleAddCategory = useCallback(async (name, color) => {
    if (!user) return;
    const catId = name.toLowerCase().trim().replace(/\s+/g, '-');
    const catRef = doc(db, 'categories', user.uid, 'items', catId);
    try {
      await setDoc(catRef, { name, color });
      showToast(`Category "${name}" created! ✨`);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error.code === 'permission-denied') {
        showToast("Error: Deploy firestore.rules to allow category operations.");
      } else {
        showToast(`Failed to create category: ${error.message}`);
      }
      throw error;
    }
  }, [user, showToast]);

  const handleDeleteCategory = useCallback(async (catId, catName) => {
    if (!user) return;

    try {
      const affectedTasks = tasks.filter(t => t.description === catName);

      if (affectedTasks.length > 0) {
        const confirmMsg = `There are ${affectedTasks.length} tasks assigned to "${catName}". Do you want to delete this category and reassign these tasks to "Other"?`;
        if (!window.confirm(confirmMsg)) return;

        // Reassign tasks to "Other"
        const batch = writeBatch(db);
        affectedTasks.forEach((task) => {
          const taskRef = doc(db, 'tasks', user.uid, 'items', task.id);
          batch.update(taskRef, { description: 'Other' });
        });
        await batch.commit();
      }

      const catRef = doc(db, 'categories', user.uid, 'items', catId);
      await deleteDoc(catRef);
      showToast(`Deleted category "${catName}"`);

      if (selectedCategory === catName) {
        setSelectedCategory('All');
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      if (error.code === 'permission-denied') {
        showToast("Error: Deploy firestore.rules to allow category operations.");
      } else {
        showToast(`Failed to delete category: ${error.message}`);
      }
    }
  }, [user, tasks, selectedCategory, showToast]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      showToast("Sign-in failed. Please try again.");
    }
  };

  const handleViewChange = useCallback((newView) => {
    setView(newView);
    if (newView === 'dashboard') {
      setSelectedCategory('All');
      setSearchQuery('');
    }
  }, []);

  // Loading Screen
  if (authLoading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <svg className="w-10 h-10 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </main>
    );
  }

  // Unauthenticated Auth-Guard Screen
  if (!user) {
    return (
      <main className="relative min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4 overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none select-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none select-none" />

        <div className="relative w-full max-w-md bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              HabitFlow
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Sign in with your Google account to sync habits, track streaks, and connect with connections.
            </p>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-800 hover:border-violet-500/50 bg-zinc-950 hover:bg-zinc-900/50 text-zinc-200 hover:text-white text-sm font-semibold transition-all duration-300 active:scale-[0.98] shadow-md"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  // Authenticated State View
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === 'All' || task.description === selectedCategory;
    const matchesSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedTodayCount = filteredTasks.filter((t) => t.completed).length;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans relative">
      {/* Fixed Ambient Gradient Light Source - Top Right */}
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[180px] pointer-events-none select-none z-0" />

      {/* Ambient purple glow - Bottom Center */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[800px] h-[400px] rounded-t-full bg-violet-600/12 blur-[160px] pointer-events-none select-none z-0" />

      <Sidebar 
        userDoc={userDoc} 
        currentView={view} 
        onViewChange={handleViewChange} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        tasks={tasks}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          setView('dashboard');
        }}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden z-10">
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:py-8 lg:pr-12 lg:pl-16 flex flex-col">
          <div className="max-w-[1100px] xl:max-w-none mx-auto xl:mx-0 w-full flex-1 flex flex-col">
            <Header 
              userDoc={userDoc} 
              onViewChange={handleViewChange} 
              onMenuToggle={() => setSidebarOpen(true)}
              currentView={view}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showToast={showToast}
            />

            <AnimatePresence mode="wait">
              {view === 'dashboard' ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col"
                >
                  <Dashboard 
                    tasks={filteredTasks}
                    allTasks={tasks}
                    categories={categories}
                    todayStr={todayStr}
                    completedTodayCount={completedTodayCount}
                    handleToggleTask={handleToggleTask}
                    handleDeleteTask={handleDeleteTask}
                    handleAddTask={handleAddTask}
                    userDoc={userDoc}
                    friends={friends}
                    friendsProfiles={friendsProfiles}
                    onViewChange={handleViewChange}
                  />
                </motion.div>
              ) : view === 'history' ? (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-sm backdrop-blur-md">
                    <HistoryView 
                      streakLog={userDoc?.streakLog || {}} 
                      todayStr={todayStr} 
                      isOpen={true} 
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProfilePage
                    user={user}
                    userDoc={userDoc}
                    onViewChange={handleViewChange}
                    showToast={showToast}
                    friends={friends}
                    friendsProfiles={friendsProfiles}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-zinc-900/90 border border-violet-500/30 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold text-zinc-200 z-50 flex items-center gap-3 backdrop-blur-md"
          >
            <span className="text-lg">✨</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
