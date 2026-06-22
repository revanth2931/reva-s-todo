import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  getDocs,
  limit 
} from 'firebase/firestore';
import { updateProfile, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase';

export default function ProfilePage({ user, userDoc, onViewChange, showToast }) {
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsProfiles, setFriendsProfiles] = useState({});
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequestUids, setOutgoingRequestUids] = useState(new Set());

  // 1. Listen to friends list (mutual connections)
  useEffect(() => {
    if (!user) return;
    const friendsRef = collection(db, 'connections', user.uid, 'friends');
    const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
      const friendIds = snapshot.docs.map(doc => doc.id);
      setFriends(friendIds);
    });
    return unsubscribe;
  }, [user]);

  // 2. Listen to friend profile documents live
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

  // 3. Listen to incoming and outgoing requests
  useEffect(() => {
    if (!user) return;
    const requestsRef = collection(db, 'requests', user.uid, 'friends');
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const incoming = [];
      const outgoing = new Set();
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'pending') {
          if (data.direction === 'incoming') {
            incoming.push({ uid: docSnap.id, ...data });
          } else if (data.direction === 'outgoing') {
            outgoing.add(docSnap.id);
          }
        }
      });

      setIncomingRequests(incoming);
      setOutgoingRequestUids(outgoing);
    });
    return unsubscribe;
  }, [user]);

  // 4. Handle Profile Photo Upload (Base64 Canvas Compression)
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          // Compress using canvas to fit Spark free tier limits without Storage
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 120;
          const MAX_HEIGHT = 120;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Get low-size Base64 data URL (approx 5-8KB)
          const compressedURL = canvas.toDataURL('image/jpeg', 0.7);

          try {
            // Update Firebase Auth profile photo
            await updateProfile(auth.currentUser, { photoURL: compressedURL });

            // Update Firestore user document
            await updateDoc(doc(db, 'users', user.uid), { photoURL: compressedURL });

            showToast('Profile picture updated successfully!');
          } catch (err) {
            console.error("Error saving photo URL to database:", err);
            showToast('Failed to save profile picture.');
          } finally {
            setUploading(false);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing profile photo:", error);
      showToast('Failed to process image.');
      setUploading(false);
    }
  };

  // 5. Search Users (by displayName or email)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const results = [];

      // Query by Email
      const qEmail = query(
        collection(db, 'users'), 
        where('email', '==', searchQuery.trim()),
        limit(5)
      );
      const emailSnap = await getDocs(qEmail);
      emailSnap.forEach(docSnap => {
        if (docSnap.id !== user.uid) {
          results.push({ uid: docSnap.id, ...docSnap.data() });
        }
      });

      // Query by DisplayName
      const qName = query(
        collection(db, 'users'), 
        where('displayName', '==', searchQuery.trim()),
        limit(5)
      );
      const nameSnap = await getDocs(qName);
      nameSnap.forEach(docSnap => {
        if (docSnap.id !== user.uid && !results.some(r => r.uid === docSnap.id)) {
          results.push({ uid: docSnap.id, ...docSnap.data() });
        }
      });

      setSearchResults(results);
      if (results.length === 0) {
        showToast('No users found.');
      }
    } catch (error) {
      console.error("Error searching users:", error);
      showToast('Failed to search users.');
    } finally {
      setSearching(false);
    }
  };

  // 6. Send Connection Request
  const handleSendRequest = async (targetUser) => {
    try {
      const curUserDoc = userDoc || {};
      
      // 1. Add record in target's subcollection (incoming request)
      await setDoc(doc(db, 'requests', targetUser.uid, 'friends', user.uid), {
        status: 'pending',
        direction: 'incoming',
        senderName: curUserDoc.displayName || user.displayName || 'Anonymous',
        senderPhoto: curUserDoc.photoURL || user.photoURL || '',
        receiverName: targetUser.displayName || 'Anonymous',
        receiverPhoto: targetUser.photoURL || '',
        timestamp: serverTimestamp()
      });

      // 2. Add record in self subcollection (outgoing request)
      await setDoc(doc(db, 'requests', user.uid, 'friends', targetUser.uid), {
        status: 'pending',
        direction: 'outgoing',
        senderName: curUserDoc.displayName || user.displayName || 'Anonymous',
        senderPhoto: curUserDoc.photoURL || user.photoURL || '',
        receiverName: targetUser.displayName || 'Anonymous',
        receiverPhoto: targetUser.photoURL || '',
        timestamp: serverTimestamp()
      });

      showToast(`Request sent to ${targetUser.displayName}!`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      showToast('Failed to send request.');
    }
  };

  // 7. Accept Connection Request
  const handleAcceptRequest = async (req) => {
    try {
      const curUserDoc = userDoc || {};

      // 1. Update status in own request document
      await setDoc(doc(db, 'requests', user.uid, 'friends', req.uid), {
        status: 'accepted',
        direction: 'incoming',
        senderName: req.senderName,
        senderPhoto: req.senderPhoto,
        receiverName: curUserDoc.displayName || user.displayName || 'Anonymous',
        receiverPhoto: curUserDoc.photoURL || user.photoURL || '',
        timestamp: serverTimestamp()
      }, { merge: true });

      // 2. Update status in sender's request document
      await setDoc(doc(db, 'requests', req.uid, 'friends', user.uid), {
        status: 'accepted',
        direction: 'outgoing',
        senderName: req.senderName,
        senderPhoto: req.senderPhoto,
        receiverName: curUserDoc.displayName || user.displayName || 'Anonymous',
        receiverPhoto: curUserDoc.photoURL || user.photoURL || '',
        timestamp: serverTimestamp()
      }, { merge: true });

      // 3. Create mutual connections
      await setDoc(doc(db, 'connections', user.uid, 'friends', req.uid), {
        connectedAt: serverTimestamp()
      });
      await setDoc(doc(db, 'connections', req.uid, 'friends', user.uid), {
        connectedAt: serverTimestamp()
      });

      showToast(`Connected with ${req.senderName}!`);
    } catch (error) {
      console.error("Error accepting request:", error);
      showToast('Failed to accept request.');
    }
  };

  const handleSignOut = () => {
    signOut(auth).then(() => {
      onViewChange('dashboard');
    });
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Header back navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <button
          onClick={() => onViewChange('dashboard')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors duration-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Habits
        </button>
        
        <button
          onClick={handleSignOut}
          className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all duration-300"
        >
          Sign Out
        </button>
      </div>

      {/* Profile Info & Stats */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
        {/* Editable Profile Image */}
        <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-950 flex items-center justify-center cursor-pointer shadow-lg hover:border-violet-500 transition-all duration-300">
          {uploading ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <svg className="w-6 h-6 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {userDoc?.photoURL ? (
                <img src={userDoc.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-zinc-500">
                  {userDoc?.displayName?.[0] || 'U'}
                </span>
              )}
              {/* Hover Edit Overlay */}
              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer text-[10px] font-bold text-zinc-200 tracking-wider">
                <svg className="w-5 h-5 mb-1 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploading} />
              </label>
            </>
          )}
        </div>

        {/* Display Details & Stats */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-black text-zinc-100">{userDoc?.displayName || 'Habit Tracker'}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{userDoc?.email}</p>

          <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center">
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Completed</span>
              <span className="text-base font-black text-zinc-200 mt-0.5 block">{userDoc?.totalCompletedAllTime || 0}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center">
              <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Streak</span>
              <span className="text-base font-black text-orange-400 mt-0.5 block">🔥 {userDoc?.currentStreak || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Requests (Incoming) */}
      <AnimatePresence>
        {incomingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Incoming Requests</h3>
            <div className="flex flex-col gap-2">
              {incomingRequests.map((req) => (
                <div key={req.uid} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/40 border border-violet-500/20 shadow-[0_0_10px_rgba(124,58,237,0.05)] animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {req.senderPhoto ? (
                        <img src={req.senderPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        req.senderName[0]
                      )}
                    </div>
                    <span className="text-sm font-semibold text-zinc-200">{req.senderName}</span>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="text-xs font-bold bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg text-white shadow-md transition-all duration-300"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Search */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Add Connections</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by Display Name or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-violet-500 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300"
          >
            {searching ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            Search
          </button>
        </form>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 space-y-2"
            >
              {searchResults.map((result) => {
                const isFriend = friends.includes(result.uid);
                const isRequestSent = outgoingRequestUids.has(result.uid);

                return (
                  <div key={result.uid} className="flex items-center justify-between py-2 border-b border-zinc-900 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {result.photoURL ? (
                          <img src={result.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          result.displayName?.[0] || 'U'
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-200">{result.displayName}</span>
                        <span className="text-[10px] text-zinc-500">{result.email}</span>
                      </div>
                    </div>

                    {isFriend ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg select-none">
                        Connected
                      </span>
                    ) : isRequestSent ? (
                      <span className="text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg select-none">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(result)}
                        className="text-xs font-bold bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-300 active:scale-95"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connected Users List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">My Connections</h3>
        
        {friends.length === 0 ? (
          <div className="py-8 text-center bg-zinc-900/10 border border-dashed border-zinc-800/80 rounded-2xl">
            <p className="text-xs text-zinc-500">No connections yet. Search above to find friends and compare streaks!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map((friendId) => {
              const profile = friendsProfiles[friendId];
              if (!profile) return null;

              return (
                <div key={friendId} className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/60 flex items-center justify-between select-none hover:border-zinc-700/60 transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        profile.displayName?.[0] || 'U'
                      )}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-zinc-200">{profile.displayName}</span>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">
                        {profile.totalCompletedAllTime || 0} completed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-bold text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full select-none">
                    🔥 {profile.currentStreak || 0}
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
