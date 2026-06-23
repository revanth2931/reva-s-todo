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
import ImageCropper from './ImageCropper';

export default function ProfilePage({ user, userDoc, onViewChange, showToast, friends = [], friendsProfiles = {} }) {
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequestUids, setOutgoingRequestUids] = useState(new Set());
  
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

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

  // 4. Handle Profile Photo Upload (Trigger Cropper)
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropImageSrc(event.target.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      showToast('Failed to read image.');
    }
  };

  const handleCropSave = async (croppedBase64) => {
    setShowCropper(false);
    setCropImageSrc(null);
    setUploading(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), { photoURL: croppedBase64 });
      showToast('Profile picture updated successfully!');
    } catch (err) {
      console.error("Error saving photo URL to database:", err);
      showToast('Failed to save profile picture.');
    } finally {
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
    <div className="flex flex-col gap-9 lg:gap-10 select-none">
      {showCropper && cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onSave={handleCropSave}
          onCancel={() => {
            setShowCropper(false);
            setCropImageSrc(null);
          }}
        />
      )}

      {/* Header back navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6">
        <button
          onClick={() => onViewChange('dashboard')}
          className="flex items-center gap-3 text-sm lg:text-base font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors duration-300"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tasks
        </button>
        
        <button
          onClick={handleSignOut}
          className="text-sm lg:text-base font-bold uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-red-500/10 px-4.5 py-2.5 rounded-xl border border-red-500/20 transition-all duration-300"
        >
          Sign Out
        </button>
      </div>

      {/* Profile Info & Stats */}
      <div className="flex flex-col sm:flex-row items-center gap-9 lg:gap-10 p-9 lg:p-10 rounded-3xl bg-zinc-900/30 border border-zinc-800/80">
        {/* Editable Profile Image */}
        <div className="relative group w-36 h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-950 flex items-center justify-center cursor-pointer shadow-lg hover:border-violet-500 transition-all duration-300">
          {uploading ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <svg className="w-9 h-9 lg:w-10 lg:h-10 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {userDoc?.photoURL ? (
                <img src={userDoc.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl lg:text-5xl font-black text-zinc-500">
                  {userDoc?.displayName?.[0] || 'U'}
                </span>
              )}
              {/* Hover Edit Overlay */}
              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer text-[15px] font-bold text-zinc-200 tracking-wider">
                <svg className="w-7 h-7 lg:w-8 lg:h-8 mb-1.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <h2 className="text-3xl lg:text-[40px] font-black text-zinc-100">{userDoc?.displayName || 'Task Tracker'}</h2>
          <p className="text-sm lg:text-base text-zinc-500 mt-1.5">{userDoc?.email}</p>

          <div className="flex items-center justify-center sm:justify-start gap-6 mt-6 lg:gap-8 lg:mt-8">
            <div className="px-5 py-2.5 lg:px-6 lg:py-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center">
              <span className="block text-[13px] lg:text-[14px] font-bold text-zinc-500 uppercase tracking-widest">Completed</span>
              <span className="text-xl lg:text-2xl font-black text-zinc-200 mt-1.5 block">{userDoc?.totalCompletedAllTime || 0}</span>
            </div>
            <div className="px-5 py-2.5 lg:px-6 lg:py-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center">
              <span className="block text-[13px] lg:text-[14px] font-bold text-zinc-500 uppercase tracking-widest">Streak</span>
              <span className="text-xl lg:text-2xl font-black text-orange-400 mt-1.5 block">🔥 {userDoc?.currentStreak || 0}</span>
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
            className="space-y-4.5 overflow-hidden"
          >
            <h3 className="text-sm lg:text-base font-bold text-zinc-400 uppercase tracking-widest">Incoming Requests</h3>
            <div className="flex flex-col gap-3 lg:gap-4.5">
              {incomingRequests.map((req) => (
                <div key={req.uid} className="flex items-center justify-between p-5 lg:p-6 rounded-2xl bg-zinc-900/40 border border-violet-500/20 shadow-[0_0_10px_rgba(124,58,237,0.05)] animate-fadeIn">
                  <div className="flex items-center gap-4.5 lg:gap-5">
                    <div className="w-12 h-12 lg:w-13 lg:h-13 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sm lg:text-base font-bold text-zinc-400">
                      {req.senderPhoto ? (
                        <img src={req.senderPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        req.senderName[0]
                      )}
                    </div>
                    <span className="text-[17px] lg:text-[19px] font-semibold text-zinc-200">{req.senderName}</span>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="text-sm lg:text-base font-bold bg-violet-600 hover:bg-violet-500 px-4.5 py-2.5 rounded-xl text-white shadow-md transition-all duration-300"
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
      <div className="space-y-4.5">
        <h3 className="text-sm lg:text-base font-bold text-zinc-400 uppercase tracking-widest">Add Connections</h3>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            placeholder="Search by Display Name or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-6 py-4 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-violet-500 text-zinc-100 placeholder-zinc-600 text-[17px] lg:text-[19px] focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[17px] lg:text-[19px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-300"
          >
            {searching ? (
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
              className="p-6 lg:p-8 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 space-y-3.5"
            >
              {searchResults.map((result) => {
                const isFriend = friends.includes(result.uid);
                const isRequestSent = outgoingRequestUids.has(result.uid);

                return (
                  <div key={result.uid} className="flex items-center justify-between py-3 border-b border-zinc-900 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 lg:w-13 lg:h-13 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sm lg:text-base font-bold text-zinc-400">
                        {result.photoURL ? (
                          <img src={result.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          result.displayName?.[0] || 'U'
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[17px] lg:text-[19px] font-semibold text-zinc-200">{result.displayName}</span>
                        <span className="text-xs lg:text-sm text-zinc-500 mt-1">{result.email}</span>
                      </div>
                    </div>

                    {isFriend ? (
                      <span className="text-sm lg:text-base font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl select-none">
                        Connected
                      </span>
                    ) : isRequestSent ? (
                      <span className="text-sm lg:text-base font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl select-none">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(result)}
                        className="text-sm lg:text-base font-bold bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white px-4.5 py-2.5 rounded-xl transition-all duration-300 active:scale-95"
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
      <div className="space-y-4.5">
        <h3 className="text-sm lg:text-base font-bold text-zinc-400 uppercase tracking-widest">My Connections</h3>
        
        {friends.length === 0 ? (
          <div className="py-12 text-center bg-zinc-900/10 border border-dashed border-zinc-800/80 rounded-2xl">
            <p className="text-sm lg:text-base text-zinc-500">No connections yet. Search above to find friends and compare streaks!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 lg:gap-6">
            {friends.map((friendId) => {
              const profile = friendsProfiles[friendId];
              if (!profile) return null;

              return (
                <div key={friendId} className="p-6 lg:p-7 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 flex items-center justify-between select-none hover:border-zinc-700/60 transition-colors duration-300">
                  <div className="flex items-center gap-4.5 lg:gap-5">
                    <div className="w-15 h-15 lg:w-16 lg:h-16 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[17px] lg:text-[19px] font-bold text-zinc-500">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        profile.displayName?.[0] || 'U'
                      )}
                    </div>
                    <div>
                      <span className="block text-[17px] lg:text-[19px] font-bold text-zinc-200">{profile.displayName}</span>
                      <span className="text-xs lg:text-sm text-zinc-500 font-semibold uppercase tracking-wide mt-1.5 block">
                        {profile.totalCompletedAllTime || 0} completed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-sm lg:text-base text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full select-none">
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
