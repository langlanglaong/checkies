// #region Imports
import beeLogo from './assets/bee-logo.png';
import React, { useState, useEffect } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithGoogle
} from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { createPortal } from "react-dom";
// #endregion

// App //
export default function App() {
  const primaryOwnerEmail = 'aaronwillpardede@gmail.com';
  const loggedOutGoogleHistoryKey = 'honeycommz_logged_out_google_history';
  const legacyLoggedOutGoogleKey = 'honeycommz_last_logged_out_google_account';

  // Helper to normalize saved logged-out Google history entries into an array
  const loadLoggedOutGoogleHistory = () => {
    try {
      const multiRaw = localStorage.getItem(loggedOutGoogleHistoryKey);
      if (multiRaw) {
        const parsed = JSON.parse(multiRaw);
        if (Array.isArray(parsed)) {
          return parsed.filter((entry) => entry && entry.email);
        }
      }
      const legacyRaw = localStorage.getItem(legacyLoggedOutGoogleKey);
      if (legacyRaw) {
        const legacyEntry = JSON.parse(legacyRaw);
        if (legacyEntry && legacyEntry.email) {
          return [legacyEntry];
        }
      }
    } catch {
      // ignore storage parse error
    }
    return [];
  };

  // Google Sign-In / Sign-Up Handler (supports both sign-in & new account sign-up, plus choosing between logged-out Google accounts or a new account)
  const handleGoogleSignIn = async ({ mode = 'signin', forceAccountChooser = false, preferredEmail = '' } = {}) => {
    try {
      const providerToUse = googleProvider;
      const customParams = {
        prompt: forceAccountChooser ? 'select_account' : 'select_account consent'
      };
      if (preferredEmail) {
        customParams.login_hint = preferredEmail;
      }
      providerToUse.setCustomParameters(customParams);

      const result = await signInWithPopup(auth, providerToUse);
      const signedInUser = result.user;
      const userRef = doc(db, "users", signedInUser.uid);
      const userSnap = await getDoc(userRef);
      const isNewAccount = !userSnap.exists();

      if (isNewAccount) {
        const defaultProfile = {
          displayName: signedInUser.displayName || signedInUser.email?.split('@')[0] || "Anonymous",
          bio: '',
          portfolioLink: '',
          avatarUrl: signedInUser.photoURL || '',
        };
        await setDoc(userRef, {
          uid: signedInUser.uid,
          displayName: signedInUser.displayName || "Anonymous",
          email: signedInUser.email,
          photoURL: signedInUser.photoURL,
          profile: defaultProfile,
          createdAt: new Date(),
          signedUpVia: mode === 'signup' ? 'google_signup' : 'google_signin_auto_signup'
        });
      }

      // Remove the signed-in Google account from logged-out history once explicitly used
      if (signedInUser.email) {
        setLoggedOutGoogleHistory((prev) => {
          const updated = prev.filter(
            (acc) => acc.email.toLowerCase() !== signedInUser.email.toLowerCase()
          );
          localStorage.setItem(loggedOutGoogleHistoryKey, JSON.stringify(updated));
          return updated;
        });
      }
      localStorage.removeItem(legacyLoggedOutGoogleKey);
      setShowGoogleAccountChoice(false);

      console.log(
        isNewAccount ? "Signed up new Google account:" : "Signed in with existing Google account:",
        signedInUser
      );
    } catch (error) {
      console.error("Error signing in/up with Google:", error);
    }
  };

  const [user, setUser] = useState(null);
  const [loggedOutGoogleHistory, setLoggedOutGoogleHistory] = useState(loadLoggedOutGoogleHistory);
  const [showGoogleAccountChoice, setShowGoogleAccountChoice] = useState(false);

  // Delete a specific logged-out Google account entry from history
  const handleDeleteLoggedOutHistory = (targetEmail) => {
    if (!targetEmail) return;
    setLoggedOutGoogleHistory((prev) => {
      const updated = prev.filter(
        (acc) => acc.email.toLowerCase() !== targetEmail.toLowerCase()
      );
      localStorage.setItem(loggedOutGoogleHistoryKey, JSON.stringify(updated));
      if (updated.length === 0) {
        localStorage.removeItem(legacyLoggedOutGoogleKey);
        setShowGoogleAccountChoice(false);
      }
      return updated;
    });
  };

  // #region 🔵 SEED
  // Primary Default Checkies assigned strictly to Aaron
  const [checkies, setCheckies] = useState([
    {
      id: 1,
      title: 'Character Design',
      author: 'Aaron',
      ownerEmail: 'aaronwillpardede@gmail.com',
      type: 'Checklist & Pictures',
      isSaved: false,
      tasks: [
        { id: 't1', text: 'Find a Motif!', done: false, exampleName: 'Silhouette Guide Example', exampleImg: '' },
        { id: 't2', text: 'Line out the Sillhouette!', done: false, exampleName: 'Flat Colors Palette Ref', exampleImg: '' },
        { id: 't3', text: 'Find appealing Colors', done: false, exampleName: 'Lighting Contrast Spec', exampleImg: '' },
        { id: 't4', text: 'Balance them', done: false, exampleName: 'Resolution & Crop Spec', exampleImg: '' },
      ],
    },
    {
      id: 2,
      title: 'Backgrounds',
      author: 'Aaron',
      ownerEmail: 'aaronwillpardede@gmail.com',
      type: 'Checklist Only',
      isSaved: false,
      tasks: [
        { id: 't5', text: 'Perspective Grid Setup', done: false },
        { id: 't6', text: 'Focal Point Contrast', done: false },
        { id: 't7', text: 'Atmospheric Perspective Check', done: false },
      ]
    },
    {
      id: '3',
      title: 'Lighting & Value Guide',
      author: 'Aaron',
      ownerEmail: 'aaronwillpardede@gmail.com',
      type: 'Viewing Only',
      isSaved: false,
      tasks: [
        { id: 't8', text: 'Key Light Source at 45° Angle', done: false, exampleName: '45-Degree Key Light Spec Sheet' },
        { id: 't9', text: 'Ambient Occlusion in Soft Cavities', done: false, exampleName: 'Soft AO Cavity Occlusion Map' },
        { id: 't10', text: 'Rim Light Intensity Match', done: false, exampleName: 'Rim Light Intensity & Falloff Guide' },
      ]
    },
    {
      id: '4',
      title: 'Anatomy & Proportions',
      author: 'Aaron',
      ownerEmail: 'aaronwillpardede@gmail.com',
      type: 'Mixed',
      isSaved: false,
      tasks: [
        {
          id: 'm1',
          text: 'Head-to-Body Proportion Check',
          done: false,
          slideType: 'picture_and_checklist',
          exampleName: '7.5 Heads Proportion Guide'
        },
        {
          id: 'm2',
          text: 'Gesture & Line of Action',
          done: false,
          slideType: 'checklist_and_link',
          linkUrl: 'https://example.com/gesture-guide',
          linkLabel: 'View Gesture Reference Sheet'
        },
        {
          id: 'm3',
          text: 'Hand & Foot Structure Review',
          done: false,
          slideType: 'picture_and_checklist',
          exampleName: 'Hand Planes & Anatomy Spec'
        },
      ]
    }
  ]);
  // #endregion

  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const activeProfileEmail = selectedUserEmail || user?.email;
  const isSelfProfile = activeProfileEmail === user?.email;
  const userCheckiesCollection = checkies.filter(
    c => (c.ownerEmail || c.authorEmail) === activeProfileEmail
  );
  const [activeTab, setActiveTab] = useState('standard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState('side-by-side');
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);

  // Discovery Search States
  const [discoverySearchInput, setDiscoverySearchInput] = useState('');
  const [discoverySearchQuery, setDiscoverySearchQuery] = useState('');

  // Sign out without auto-logging back in on next load, while recording logged-out Google account in history
  const handleSignOut = async () => {
    const currentGoogleSnapshot = auth.currentUser
      ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || '',
          displayName: auth.currentUser.displayName || profileData?.displayName || 'Google Account',
          photoURL: auth.currentUser.photoURL || profileData?.avatarUrl || '',
          loggedOutAt: new Date().toISOString(),
          providerIds: (auth.currentUser.providerData || []).map((p) => p.providerId),
        }
      : null;

    try {
      await signOut(auth);
      setIsSettingsOpen(false);
      setUser(null);
      setSelectedUserEmail(null);
      setProfileData({});
      setCheckies([]);

      if (currentGoogleSnapshot && currentGoogleSnapshot.email) {
        setLoggedOutGoogleHistory((prev) => {
          const filtered = prev.filter(
            (acc) => acc.email.toLowerCase() !== currentGoogleSnapshot.email.toLowerCase()
          );
          const nextHistory = [currentGoogleSnapshot, ...filtered];
          localStorage.setItem(loggedOutGoogleHistoryKey, JSON.stringify(nextHistory));
          return nextHistory;
        });
        setShowGoogleAccountChoice(true);
      } else {
        setShowGoogleAccountChoice(false);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Checkie Editor States
  const [editingCheckieId, setEditingCheckieId] = useState(null);
  const [checkieMode, setCheckieMode] = useState(1);
  const [checkieTitle, setCheckieTitle] = useState('');
  const [checkieDesc, setCheckieDesc] = useState('');
  const [checkieTasks, setCheckieTasks] = useState([]);
  const [checkieSlides, setCheckieSlides] = useState([]);

  // #region ⚙️ Component States (Profile, Modals, Workspace & Auth)
  const [profileData, setProfileData] = useState({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ ...profileData });

  // Active Checkie detail modal state
  const [selectedCheckie, setSelectedCheckie] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [activeTaskRef, setActiveTaskRef] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Create Checkie Modal State
  const [isWorkspaceUnlocked, setIsWorkspaceUnlocked] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("checklist-picture");
  const [isCreatingCheckie, setIsCreatingCheckie] = useState(false);
  const [newCheckieForm, setNewCheckieForm] = useState({});
  // #endregion

  // Author ownership helper
  const isCheckieAuthor = (item) => {
    if (!user || !item) return false;
    return (
      (item.ownerEmail && item.ownerEmail === user.email) ||
      (item.authorEmail && item.authorEmail === user.email) ||
      (item.authorId && item.authorId === user.uid)
    );
  };

  // Open any checkie (draft or published) in the Editor — Author Only
  const handleEditCheckie = (item) => {
    if (!isCheckieAuthor(item)) {
      alert("Only the author can edit this checkie.");
      return;
    }
    setEditingCheckieId(item.id);
    setCheckieTitle(item.title || '');
    setCheckieDesc(item.description || '');
    setCheckieMode(item.mode || 1);
    setCheckieTasks(item.tasks || []);
    setCheckieSlides(item.slides || []);
    setIsWorkspaceUnlocked(true);
    setShowDraftsModal(false);
    setSelectedDraftIds([]);
    setSelectedCheckie(null);
    setActiveTab('editor');
  };

  // Delete any checkie (draft or published) from Firestore & state — Author Only
  const handleDeleteCheckie = async (item) => {
    if (!isCheckieAuthor(item)) {
      alert("Only the author can delete this checkie.");
      return;
    }
    if (!window.confirm(`Delete "${item.title || 'this checkie'}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "checkies", String(item.id)));
      setCheckies((prev) => prev.filter((c) => c.id !== item.id));
      setSelectedDraftIds((prev) => prev.filter((id) => id !== item.id));
      if (selectedCheckie?.id === item.id) {
        setSelectedCheckie(null);
        setActiveTaskRef(null);
      }
      if (editingCheckieId === item.id) {
        setEditingCheckieId(null);
        setCheckieTitle('');
        setCheckieDesc('');
        setCheckieTasks([]);
        setCheckieSlides([]);
        setIsWorkspaceUnlocked(false);
        setActiveTab('profile');
      }
    } catch (error) {
      console.error("Error deleting checkie:", error);
      alert("Failed to delete checkie.");
    }
  };

  // Mass delete selected drafts from Draft Box
  const handleMassDeleteDrafts = async (draftList) => {
    if (!selectedDraftIds.length) return;
    const targets = draftList.filter(
      (d) => selectedDraftIds.includes(d.id) && isCheckieAuthor(d)
    );
    if (!targets.length) return;

    if (!window.confirm(`Delete ${targets.length} selected draft${targets.length === 1 ? '' : 's'}? This cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(
        targets.map((draft) => deleteDoc(doc(db, "checkies", String(draft.id))))
      );
      const deletedSet = new Set(targets.map((d) => d.id));
      setCheckies((prev) => prev.filter((c) => !deletedSet.has(c.id)));
      setSelectedDraftIds((prev) => prev.filter((id) => !deletedSet.has(id)));
    } catch (error) {
      console.error("Error mass deleting drafts:", error);
      alert("Failed to delete one or more selected drafts.");
    }
  };

  // #region 🔐 Auth & Real-Time Global Firestore Sync
  useEffect(() => {
    let unsubscribeCheckies = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeCheckies) {
        unsubscribeCheckies();
        unsubscribeCheckies = null;
      }

      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "Artist",
        });
        setSelectedUserEmail(currentUser.email);
        setShowGoogleAccountChoice(false);

        try {
          // 1. Fetch or initialize user profile document
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setProfileData(data.profile || {});
          } else {
            const defaultProfile = {
              displayName: currentUser.displayName || currentUser.email.split('@')[0],
              bio: '',
              portfolioLink: '',
              avatarUrl: currentUser.photoURL || '',
            };
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: defaultProfile.displayName,
              photoURL: currentUser.photoURL || '',
              profile: defaultProfile,
              createdAt: new Date()
            }, { merge: true });
            setProfileData(defaultProfile);
          }

          // 2. Real-time global listener so everyone sees all published checkies in Discovery Mode
          unsubscribeCheckies = onSnapshot(
            collection(db, "checkies"),
            (querySnapshot) => {
              const loadedCheckies = [];
              querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const isMine =
                  data.ownerEmail === currentUser.email ||
                  data.authorEmail === currentUser.email ||
                  data.authorId === currentUser.uid;
                const isPublished = !(
                  data.isDraft ||
                  data.status === "draft" ||
                  data.isPublished === false
                );
                // Keep private drafts strictly for the author, while broadcasting all published posts globally
                if (isMine || isPublished) {
                  loadedCheckies.push({ id: docSnap.id, ...data });
                }
              });
              setCheckies(loadedCheckies);
            },
            (error) => {
              console.error("Error listening to checkies from Firestore:", error);
            }
          );
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
        }
      } else {
        // Do NOT auto-login into a previously logged-out session; stay on login screen
        setUser(null);
        setSelectedUserEmail(null);
        setProfileData({});
        setCheckies([]);
        setLoggedOutGoogleHistory(loadLoggedOutGoogleHistory());
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeCheckies) unsubscribeCheckies();
    };
  }, []);

  const openAuthorProfile = (authorEmail) => {
    if (!authorEmail) return;
    setSelectedUserEmail(authorEmail);
    setActiveTab('profile');
  };

  const openCheckieModal = (checkie) => {
    setSelectedCheckie(checkie);
    setUploadedImage(null);
    setActiveTaskRef(null);
    setCurrentSlideIndex(0);
  };

  const toggleTask = (checkieId, taskId) => {
    setCheckies(prev => prev.map(c => {
      if (c.id === checkieId) {
        const newTasks = c.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
        return { ...c, tasks: newTasks };
      }
      return c;
    }));
    if (selectedCheckie && selectedCheckie.id === checkieId) {
      const nextTasks = selectedCheckie.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
      setSelectedCheckie({ ...selectedCheckie, tasks: nextTasks });
    }
  };

  const handleSaveProgress = () => {
    if (!selectedCheckie) return;
    setCheckies(prev => prev.map(c => {
      if (c.id === selectedCheckie.id) {
        return {
          ...c,
          isSaved: true
        };
      }
      return c;
    }));
    setSelectedCheckie(null);
    setUploadedImage(null);
    setActiveTaskRef(null);
  };

  const handleSaveAndComplete = () => {
    if (!selectedCheckie) return;
    setCheckies((prev) =>
      prev.map((c) =>
        c.id === selectedCheckie.id
          ? {
            ...c,
            isSaved: true,
            savedImage: uploadedImage,
            lastSlideIndex: currentSlideIndex
          }
          : c
      )
    );
    setShowDoneModal(true);
  };

  const handleCompleteCheckie = () => {
    if (!selectedCheckie) return;
    setShowDoneModal(true);
    setCheckies(prev => prev.map(c => {
      if (c.id === selectedCheckie.id) {
        return {
          ...c,
          isSaved: false,
          tasks: c.tasks.map(t => ({ ...t, done: false }))
        };
      }
      return c;
    }));
    setUploadedImage(null);
    setSelectedCheckie(null);
    setActiveTaskRef(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedImage(URL.createObjectURL(e.dataTransfer.files[0]));
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setEditForm((prev) => ({ ...prev, avatarUrl: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user || !user.uid) return;
    try {
      const updatedProfile = { ...editForm };
      setProfileData(updatedProfile);
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        profile: updatedProfile,
        checkies
      }, { merge: true });
      console.log("Profile & collection saved successfully to Firestore!");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handlePublishDraft = async (draftId) => {
    const target = checkies.find((item) => item.id === draftId);
    if (target && !isCheckieAuthor(target)) {
      alert("Only the author can publish this checkie.");
      return;
    }
    try {
      const checkieRef = doc(db, 'checkies', draftId);
      const publishedFields = {
        isDraft: false,
        status: 'published',
        publishedAt: new Date().toISOString()
      };
      await updateDoc(checkieRef, publishedFields);
      setCheckies((prev) =>
        prev.map((item) =>
          item.id === draftId ? { ...item, ...publishedFields } : item
        )
      );
      setSelectedDraftIds((prev) => prev.filter((id) => id !== draftId));
    } catch (error) {
      console.error('Error publishing draft:', error);
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'Checklist Only':
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80';
      case 'Checklist & Pictures':
        return 'bg-purple-950/70 text-purple-300 border-purple-800/80';
      case 'Viewing Only':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/80';
      case 'Mixed':
        return 'bg-teal-950/70 text-teal-300 border-teal-800/80';
      default:
        return 'bg-slate-950 text-slate-300 border-slate-700';
    }
  };
  // #endregion

  // #region 📝 CREATE CHECKIE HANDLER (FIRESTORE DRAFT)
  const handleCreateCheckie = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTitle.trim()) return;
    const newCheckie = {
      title: newTitle,
      author: profileData?.displayName || 'Fill In',
      ownerEmail: user?.email || 'fillin@example.com',
      authorEmail: user?.email || 'fillin@example.com',
      authorId: user?.uid || '',
      type: newType || 'Checklist Only',
      mode: checkieMode || 1,
      isDraft: true,
      status: 'draft',
      isSaved: false,
      tasks: checkieTasks,
      createdAt: new Date().toISOString(),
    };
    try {
      const docRef = await addDoc(collection(db, 'checkies'), newCheckie);
      setCheckies((prev) => [{ id: docRef.id, ...newCheckie }, ...prev]);
      setNewTitle('');
      setCheckieTasks([]);
      if (typeof setIsWorkspaceUnlocked === 'function') {
        setIsWorkspaceUnlocked(false);
      }
      setShowDraftsModal(true);
    } catch (error) {
      console.error('Error saving draft to Firestore:', error);
    }
  };
  // #endregion

  // #region 🟢 SIGN IN / SIGN UP SCREEN (CLEAN GOOGLE-ONLY FLOW WITH LOGGED-OUT ACCOUNT HISTORY)
  if (!user) {
    const hasLoggedOutGoogle = loggedOutGoogleHistory.length > 0;

    const triggerGoogleAuth = (mode = 'signin') => {
      if (hasLoggedOutGoogle) {
        setShowGoogleAccountChoice(true);
      } else {
        handleGoogleSignIn({ mode, forceAccountChooser: true });
      }
    };

    return (
      <div className="min-h-screen w-full bg-amber-950 text-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-amber-950 flex flex-col items-center">
          <img
            src={beeLogo}
            alt="Checkies Bee Mascot"
            className="w-60 h-60 object-contain mb-2 hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-3xl font-black text-amber-100 tracking-tight">
            HoneyCommz
          </h1>
          <p className="text-xs font-semibold text-amber-400/90 mb-7 uppercase tracking-wider">
            Connecting Creativity with Trust
          </p>

          {/* Google Sign In / Sign Up Button (Works as both Sign In & Sign Up) */}
          <button
            type="button"
            onClick={() => triggerGoogleAuth('signin')}
            className="flex items-center justify-center gap-3 w-full py-3.5 px-4 bg-amber-900/50 hover:bg-amber-900/80 text-amber-100 font-semibold rounded-xl border border-amber-700/60 transition duration-200 text-sm shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            Sign in / Sign up with Google
          </button>

          {/* Option prompt when logged-out Google account history exists */}
          {showGoogleAccountChoice && hasLoggedOutGoogle && (
            <div className="w-full mt-4 p-4 rounded-2xl bg-amber-900/50 border border-amber-600/50 space-y-3 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-amber-200">
                    Choose how to continue with Google
                  </p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Select a logged-out account below, delete a history entry, or use a new Google account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleAccountChoice(false)}
                  className="text-amber-400 hover:text-amber-200 text-xs px-1.5 py-0.5 rounded"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {loggedOutGoogleHistory.map((acc) => (
                  <div
                    key={acc.email}
                    className="w-full p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleGoogleSignIn({
                          mode: 'signin',
                          forceAccountChooser: false,
                          preferredEmail: acc.email,
                        })
                      }
                      className="flex-1 min-w-0 text-left flex items-center justify-between gap-2 group"
                    >
                      <div className="truncate">
                        <span className="block text-xs font-bold text-amber-100 group-hover:text-amber-300 transition-colors">
                          Use logged-out account
                        </span>
                        <span className="block text-[11px] text-amber-300/80 truncate">
                          {acc.displayName} ({acc.email})
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-400 shrink-0">&rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteLoggedOutHistory(acc.email)}
                      className="px-2 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/60 text-[11px] font-semibold transition-colors shrink-0"
                      title={`Remove ${acc.email} from logout history`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    handleGoogleSignIn({
                      mode: 'signup',
                      forceAccountChooser: true,
                    })
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs flex items-center justify-between transition-colors"
                >
                  <span>Sign up / Use a new Google account</span>
                  <span>+</span>
                </button>
              </div>
            </div>
          )}

          {/* Sign Up trigger wired exclusively to Google for now */}
          <button
            type="button"
            onClick={() => triggerGoogleAuth('signup')}
            className="mt-6 text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline transition-colors"
          >
            Need an account? Sign Up with Google
          </button>
        </div>
      </div>
    );
  }
  // #endregion

  // MAIN APP INTERFACE
  const getProfileForEmail = (targetEmail) => {
    if (targetEmail === user?.email) return profileData;
    const stored = localStorage.getItem(`profile_${targetEmail}`);
    if (stored) return JSON.parse(stored);
    return {
      displayName: targetEmail === primaryOwnerEmail ? 'Aaron' : (targetEmail ? targetEmail.split('@')[0] : 'User'),
      bio: '',
      portfolioLink: '',
      avatarUrl: ''
    };
  };

  const isDraftItem = (item) =>
    Boolean(item.isDraft || item.status === "draft" || item.isPublished === false);

  const editingItem = checkies.find((c) => c.id === editingCheckieId);
  const isEditingPublished = Boolean(editingItem && !isDraftItem(editingItem));

  return (
    <div className="min-h-screen bg-[#AA5002] text-slate-100 flex flex-col pb-28 relative overflow-x-hidden">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('standard')}>
          <img
            src={beeLogo}
            alt="Checkies Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-lg text-slate-100">Checkies</span>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          title="Settings Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* #region 🟢 SETTINGS DRAWER COMPONENT */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative w-80 bg-slate-900 h-full border-l border-slate-800 p-6 flex flex-col justify-between z-10 shadow-2xl">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-white">Settings</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Artwork View Layout
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setLayoutMode('side-by-side')}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${layoutMode === 'side-by-side'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    <span>Side by Side</span>
                    {layoutMode === 'side-by-side' && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => setLayoutMode('stacked')}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${layoutMode === 'stacked'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    <span>On Top of Each Other</span>
                    {layoutMode === 'stacked' && <span>✓</span>}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
      {/* #endregion */}

      {/* Main Content View */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 pt-24">
        {activeTab === 'standard' && (
          <div>
            <div className="mb-6 border-b border-slate-800/80 pb-4">
              <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Standard Mode</h2>
              <p className="text-xs text-slate-400">Select a checkie to start auditing or viewing references.</p>
            </div>
            {/* GRID OF CHECKIES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {checkies
                .filter((checkie) => !isDraftItem(checkie))
                .map((checkie) => {
                  const canManage = isCheckieAuthor(checkie);
                  return (
                    <div
                      key={checkie.id}
                      onClick={() => openCheckieModal(checkie)}
                      className="aspect-square p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between shadow-xl relative group"
                    >
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getBadgeStyle(checkie.type)}`}>
                            • {checkie.type}
                          </span>
                          {canManage && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleEditCheckie(checkie)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white text-[10px] font-semibold border border-slate-700 transition-colors"
                                title="Edit Published Checkie"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCheckie(checkie)}
                                className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-semibold border border-rose-800/60 transition-colors"
                                title="Delete Published Checkie"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-xl text-white mb-1 group-hover:text-amber-300 transition-colors">
                          {checkie.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAuthorProfile(checkie.ownerEmail || checkie.authorEmail);
                          }}
                          className="text-xs text-amber-400 hover:underline"
                        >
                          by {checkie.author || checkie.authorName}
                        </button>
                      </div>
                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-400 font-medium border border-slate-700/50">
                          {checkie.isSaved
                            ? `${(checkie.tasks || []).filter(t => t.done).length}/${(checkie.tasks || []).length} done`
                            : `${(checkie.tasks || []).length} tasks`
                          }
                        </span>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white flex items-center gap-1">
                          Open &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (() => {
          const activeProfile = getProfileForEmail(activeProfileEmail);
          const draftItems = userCheckiesCollection.filter(isDraftItem);
          const publishedItems = userCheckiesCollection.filter((item) => !isDraftItem(item));

          return (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Profile View</h2>
                {!isSelfProfile && (
                  <button
                    onClick={() => setSelectedUserEmail(user.email)}
                    className="text-xs text-amber-400 hover:underline bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
                  >
                    ← Back to My Profile
                  </button>
                )}
              </div>
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 flex flex-col md:flex-row gap-6 justify-between items-start">
                <div className="flex gap-4 items-center">
                  {/* Profile Picture Display */}
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center font-bold text-2xl text-amber-400 overflow-hidden shrink-0 shadow-lg shadow-amber-950/40">
                    {activeProfile?.avatarUrl ? (
                      <img src={activeProfile.avatarUrl} alt="Profile Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{activeProfile?.displayName?.[0] || 'A'}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-white">
                      {activeProfile?.displayName}
                    </h3>
                    <p className="text-xs text-slate-400">{activeProfileEmail}</p>
                    {activeProfile?.bio && (
                      <p className="text-xs text-slate-300 mt-1 max-w-md">{activeProfile.bio}</p>
                    )}
                    {activeProfile?.portfolioLink && (
                      <a
                        href={activeProfile.portfolioLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-400 hover:underline flex items-center gap-1 mt-1 font-medium"
                      >
                        <span>🔗 {activeProfile.portfolioLink.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                  </div>
                </div>
                {isSelfProfile && (
                  <button
                    onClick={() => {
                      setEditForm({ ...profileData });
                      setIsEditingProfile(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-md shrink-0"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {isSelfProfile ? 'My Collection' : `${activeProfile.displayName}'s Collection`}
                  </h3>
                  {isSelfProfile && (
                    <button
                      onClick={() => {
                        setEditingCheckieId(null);
                        setCheckieTitle('');
                        setCheckieDesc('');
                        setCheckieTasks([]);
                        setCheckieSlides([]);
                        setCheckieMode(1);
                        setIsWorkspaceUnlocked(false);
                        setActiveTab('editor');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-md"
                    >
                      + Create
                    </button>
                  )}
                </div>
                {publishedItems.length === 0 && (!isSelfProfile || draftItems.length === 0) ? (
                  <div className="p-12 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 text-xl mb-3">
                      📁
                    </div>
                    <h4 className="text-sm font-bold text-slate-300 mb-1">No Checkies Collection Yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs">
                      This user profile does not have any personal checkies created or saved in their collection.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* 1. PRIVATE DRAFT BOX CARD (Only visible on your profile) */}
                    {isSelfProfile && (
                      <div
                        onClick={() => {
                          setSelectedDraftIds([]);
                          setShowDraftsModal(true);
                        }}
                        className="p-4 rounded-xl bg-amber-950/40 border-2 border-dashed border-amber-500/50 hover:border-amber-400 hover:bg-amber-900/30 cursor-pointer transition-all flex flex-col justify-between min-h-[96px] group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📦</span>
                            <h4 className="font-semibold text-sm text-amber-200 group-hover:text-white transition-colors">
                              Draft Box
                            </h4>
                          </div>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Private
                          </span>
                        </div>
                        <p className="text-xs text-amber-300/70">
                          {draftItems.length} Drafts
                        </p>
                      </div>
                    )}
                    {/* 2. PUBLISHED CHECKIES (Editable & Deletable ONLY by the Author) */}
                    {publishedItems.map((item) => {
                      const canManage = isCheckieAuthor(item);
                      return (
                        <div
                          key={item.id}
                          onClick={() => openCheckieModal(item)}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-medium text-sm text-slate-200 truncate">{item.title}</h4>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${getBadgeStyle(item.type)}`}>
                                {item.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{item.tasks?.length || 0} Checkie Tasks</p>
                          </div>

                          {canManage && (
                            <div
                              className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleEditCheckie(item)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white rounded-lg text-[11px] font-semibold transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCheckie(item)}
                                className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/60 rounded-lg text-[11px] font-semibold transition-colors"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* EDITOR VIEW */}
        {activeTab === 'editor' && (
          <div className="max-w-3xl mx-auto p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingCheckieId ? "Edit ArtistCheck Workspace" : "Create New Checkie"}
              </h2>
              <button
                onClick={() => setActiveTab('profile')}
                className="text-sm text-slate-400 hover:text-white"
              >
                ✕ Back to Profile
              </button>
            </div>

            {/* #region Buzz It */}
            {/* STEP 1: Initial Setup Card */}
            {!isWorkspaceUnlocked && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Select Layout Mode (1-4)</label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4].map((modeNum) => (
                      <button
                        key={modeNum}
                        type="button"
                        onClick={() => setCheckieMode(modeNum)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${checkieMode === modeNum
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                      >
                        Mode {modeNum}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={checkieTitle}
                    onChange={(e) => setCheckieTitle(e.target.value)}
                    placeholder="Give your checkie a catchy title..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Short Description</label>
                  <textarea
                    value={checkieDesc}
                    onChange={(e) => setCheckieDesc(e.target.value)}
                    placeholder="What is this checkie about?"
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={async () => {
                      if (!user) return alert("Please sign in first.");
                      if (!checkieTitle.trim()) return alert("Please add a title first.");
                      try {
                        const initialTasks =
                          checkieMode === 1 && checkieTasks.length === 0
                            ? [
                              { id: 't1', text: 'Find a Motif!', done: false, exampleName: 'Silhouette Guide Example', exampleImg: '' },
                              { id: 't2', text: 'Line out the Sillhouette!', done: false, exampleName: 'Flat Colors Palette Ref', exampleImg: '' },
                              { id: 't3', text: 'Find appealing Colors', done: false, exampleName: 'Lighting Contrast Spec', exampleImg: '' },
                              { id: 't4', text: 'Balance them', done: false, exampleName: 'Resolution & Crop Spec', exampleImg: '' },
                            ]
                            : checkieTasks;
                        const docRef = editingCheckieId
                          ? doc(db, "checkies", editingCheckieId)
                          : doc(collection(db, "checkies"));
                        const keepDraftStatus = editingCheckieId ? !isEditingPublished : true;
                        const checkieData = {
                          id: docRef.id,
                          authorId: user.uid,
                          author: profileData?.displayName || "Anonymous",
                          authorName: profileData?.displayName || "Anonymous",
                          ownerEmail: user.email,
                          authorEmail: user.email,
                          title: checkieTitle,
                          description: checkieDesc,
                          type: checkieMode === 1 ? 'Checklist & Pictures' : `Mode ${checkieMode}`,
                          mode: checkieMode,
                          tasks: initialTasks,
                          slides: checkieSlides,
                          isDraft: keepDraftStatus,
                          status: keepDraftStatus ? "draft" : "published",
                          updatedAt: new Date()
                        };
                        await setDoc(docRef, checkieData, { merge: true });
                        setCheckies((prev) => {
                          const exists = prev.some((item) => item.id === docRef.id);
                          return exists
                            ? prev.map((item) => (item.id === docRef.id ? { ...item, ...checkieData } : item))
                            : [checkieData, ...prev];
                        });
                        setCheckieTasks(initialTasks);
                        setEditingCheckieId(docRef.id);
                        setIsWorkspaceUnlocked(true);
                      } catch (error) {
                        console.error("Error saving checkie setup:", error);
                      }
                    }}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold transition"
                  >
                    {editingCheckieId ? "Save & Continue" : "Buzz it Up!"}
                  </button>
                </div>
              </div>
            )}
            {/* #endregion */}

            {/* #region 🟢 WORKSPACE UNLOCKED VIEW */}
            {/* INLINE WORKSPACE (Edit, Save Draft, Publish / Save Changes, or Delete) */}
            {isWorkspaceUnlocked && (
              <div className="space-y-6">
                {/* Status Bar */}
                <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-amber-400 font-medium">✨ {checkieTitle} (Mode {checkieMode})</p>
                      {isEditingPublished ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          In Draft Box
                        </span>
                      )}
                    </div>
                    {checkieDesc && <p className="text-xs text-slate-400 mt-0.5">{checkieDesc}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsWorkspaceUnlocked(false)}
                      className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      ← Edit Setup
                    </button>
                    {/* SAVE DRAFT / UNPUBLISH TO DRAFT BUTTON */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!user) return alert("Please sign in first.");
                        try {
                          const docRef = editingCheckieId
                            ? doc(db, "checkies", editingCheckieId)
                            : doc(collection(db, "checkies"));
                          const modeLabels = {
                            1: "Checklist & Pictures",
                            2: "Mode 2",
                            3: "Mode 3",
                            4: "Mode 4",
                          };
                          const draftPayload = {
                            id: docRef.id,
                            authorId: user.uid,
                            author: profileData?.displayName || "Anonymous",
                            authorName: profileData?.displayName || "Anonymous",
                            ownerEmail: user.email,
                            authorEmail: user.email,
                            title: checkieTitle.trim() || "Untitled Draft",
                            description: checkieDesc,
                            type: modeLabels[checkieMode] || `Mode ${checkieMode}`,
                            mode: checkieMode,
                            tasks: checkieTasks || [],
                            slides: checkieSlides || [],
                            isDraft: true,
                            status: "draft",
                            updatedAt: new Date(),
                          };
                          await setDoc(docRef, draftPayload, { merge: true });
                          setCheckies((prev) => {
                            const exists = prev.some((item) => item.id === docRef.id);
                            return exists
                              ? prev.map((item) => (item.id === docRef.id ? { ...item, ...draftPayload } : item))
                              : [draftPayload, ...prev];
                          });
                          setEditingCheckieId(docRef.id);
                          setActiveTab('profile');
                        } catch (error) {
                          console.error("Error saving draft:", error);
                          alert("Failed to save draft.");
                        }
                      }}
                      className="text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-600 border border-amber-500/40 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      📦 {isEditingPublished ? "Move to Drafts" : "Save Draft"}
                    </button>
                    {/* PUBLISH / SAVE PUBLISHED CHANGES BUTTON */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingCheckieId) return;
                        try {
                          const modeLabels = {
                            1: "Checklist & Pictures",
                            2: "Mode 2",
                            3: "Mode 3",
                            4: "Mode 4",
                          };
                          const publishedFields = {
                            title: checkieTitle.trim() || "Untitled Checkie",
                            description: checkieDesc,
                            type: modeLabels[checkieMode] || `Mode ${checkieMode}`,
                            mode: checkieMode,
                            tasks: checkieTasks,
                            slides: checkieSlides,
                            isDraft: false,
                            status: "published",
                            updatedAt: new Date()
                          };
                          await updateDoc(doc(db, "checkies", editingCheckieId), publishedFields);
                          setCheckies((prev) =>
                            prev.map((item) =>
                              item.id === editingCheckieId ? { ...item, ...publishedFields } : item
                            )
                          );
                          setEditingCheckieId(null);
                          setIsWorkspaceUnlocked(false);
                          setActiveTab('profile');
                        } catch (error) {
                          console.error("Error publishing checkie:", error);
                          alert("Failed to publish checkie.");
                        }
                      }}
                      className="text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      {isEditingPublished ? "💾 Save Published Changes" : "🚀 Publish"}
                    </button>
                    {/* DELETE CHECKIE BUTTON */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Delete this entire checkie? This cannot be undone.")) return;
                        try {
                          if (editingCheckieId) {
                            await deleteDoc(doc(db, "checkies", String(editingCheckieId)));
                            setCheckies((prev) => prev.filter((item) => item.id !== editingCheckieId));
                          }
                          setEditingCheckieId(null);
                          setCheckieTitle('');
                          setCheckieDesc('');
                          setCheckieTasks([]);
                          setCheckieSlides([]);
                          setIsWorkspaceUnlocked(false);
                          setActiveTab('profile');
                        } catch (error) {
                          console.error("Error deleting checkie:", error);
                          alert("Failed to delete checkie.");
                        }
                      }}
                      className="text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-600 border border-rose-500/40 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Mode 1 Specific Task Manager (Editable & Deletable) */}
                {checkieMode === 1 && (
                  <div className="space-y-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <label className="block text-sm font-semibold text-slate-300">Mode 1: Manage Checklist Steps</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="newTaskInput"
                        placeholder="Add a new task step..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (!val) return;
                            setCheckieTasks([
                              ...checkieTasks,
                              {
                                id: `t_${Date.now()}`,
                                text: val,
                                done: false,
                                exampleName: 'Reference Example',
                                exampleImg: '',
                              },
                            ]);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const inputEl = document.getElementById('newTaskInput');
                          const val = inputEl.value.trim();
                          if (!val) return;
                          setCheckieTasks([
                            ...checkieTasks,
                            {
                              id: `t_${Date.now()}`,
                              text: val,
                              done: false,
                              exampleName: 'Reference Example',
                              exampleImg: '',
                            },
                          ]);
                          inputEl.value = '';
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
                      >
                        Add Task
                      </button>
                    </div>
                    <div className="space-y-3 mt-3">
                      {checkieTasks.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No tasks added yet for Mode 1.</p>
                      ) : (
                        checkieTasks.map((task, index) => (
                          <div key={task.id || index} className="flex flex-col gap-2 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-400 w-5 shrink-0">
                                {index + 1}.
                              </span>
                              <input
                                type="text"
                                value={task.text}
                                onChange={(e) => {
                                  const updated = [...checkieTasks];
                                  updated[index] = { ...updated[index], text: e.target.value };
                                  setCheckieTasks(updated);
                                }}
                                placeholder="Task instruction..."
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => setCheckieTasks(checkieTasks.filter((_, i) => i !== index))}
                                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                              >
                                ✕ Delete
                              </button>
                            </div>
                            <div className="flex items-center gap-2 pl-7">
                              <span className="text-[11px] text-slate-500 shrink-0">Ref Label:</span>
                              <input
                                type="text"
                                value={task.exampleName || ''}
                                onChange={(e) => {
                                  const updated = [...checkieTasks];
                                  updated[index] = { ...updated[index], exampleName: e.target.value };
                                  setCheckieTasks(updated);
                                }}
                                placeholder="Example reference name..."
                                className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {/* Placeholder for Modes 2, 3, or 4 */}
                {checkieMode !== 1 && (
                  <div className="p-6 text-center text-slate-400 italic bg-slate-950 rounded-xl border border-slate-800">
                    Workspace layout for Mode {checkieMode} is coming up next!
                  </div>
                )}
              </div>
            )}
            {/* #endregion */}
          </div>
        )}

        {/* DISCOVERY MODE (Public Pinterest-style Feed with Search Bar & Search Button) */}
        {activeTab === 'discovery' && (() => {
          const allPublished = checkies.filter((c) => !isDraftItem(c));
          const normalizedQuery = discoverySearchQuery.trim().toLowerCase();
          const filteredDiscovery = normalizedQuery
            ? allPublished.filter((c) => {
                const titleMatch = (c.title || '').toLowerCase().includes(normalizedQuery);
                const descMatch = (c.description || '').toLowerCase().includes(normalizedQuery);
                const authorMatch = (c.author || c.authorName || '').toLowerCase().includes(normalizedQuery);
                const typeMatch = (c.type || '').toLowerCase().includes(normalizedQuery);
                const taskMatch = (c.tasks || []).some((t) =>
                  (t.text || '').toLowerCase().includes(normalizedQuery)
                );
                return titleMatch || descMatch || authorMatch || typeMatch || taskMatch;
              })
            : allPublished;

          const handleDiscoverySearch = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            setDiscoverySearchQuery(discoverySearchInput);
          };

          const handleClearDiscoverySearch = () => {
            setDiscoverySearchInput('');
            setDiscoverySearchQuery('');
          };

          return (
            <div className="space-y-6">
              {/* Top Header & Pinterest-Style Search Bar */}
              <div className="border-b border-slate-800/80 pb-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
                      Discovery Mode
                    </h2>
                    <p className="text-xs text-slate-300/80">
                      Public community feed — explore published checkies from all creators.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-300 bg-amber-950/70 border border-amber-700/60 px-3 py-1 rounded-full">
                    {filteredDiscovery.length} {filteredDiscovery.length === 1 ? 'Post' : 'Posts'}
                  </span>
                </div>

                {/* Search Input + Search Button at the Top of Discovery Mode */}
                <form
                  onSubmit={handleDiscoverySearch}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={discoverySearchInput}
                      onChange={(e) => {
                        setDiscoverySearchInput(e.target.value);
                        if (e.target.value === '') setDiscoverySearchQuery('');
                      }}
                      placeholder="Search posts by title, creator, tag, or checklist step..."
                      className="w-full pl-10 pr-9 py-3 rounded-2xl bg-slate-900/95 border border-slate-700/90 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 shadow-lg"
                    />
                    {discoverySearchInput && (
                      <button
                        type="button"
                        onClick={handleClearDiscoverySearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-slate-800"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>🔍</span>
                    <span>Search</span>
                  </button>
                </form>

                {normalizedQuery && (
                  <div className="flex items-center justify-between text-xs bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="text-slate-300">
                      Showing results for <span className="font-bold text-amber-300">"{discoverySearchQuery}"</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearDiscoverySearch}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>

              {/* Empty States */}
              {allPublished.length === 0 ? (
                <div className="p-12 rounded-2xl bg-slate-900/70 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
                  <span className="text-3xl mb-3">Δ</span>
                  <h3 className="text-sm font-bold text-slate-200 mb-1">No Published Checkies Yet</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Once creators publish checkies, they will appear live here for everyone to discover.
                  </p>
                </div>
              ) : filteredDiscovery.length === 0 ? (
                <div className="p-12 rounded-2xl bg-slate-900/70 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
                  <span className="text-3xl mb-3">🔎</span>
                  <h3 className="text-sm font-bold text-slate-200 mb-1">
                    No matching posts for "{discoverySearchQuery}"
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-4">
                    Try searching a different title, creator name, or keyword.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearDiscoverySearch}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Show All Posts
                  </button>
                </div>
              ) : (
                /* Pinterest-Style Masonry Pin Feed */
                <div className="columns-1 sm:columns-2 md:columns-3 gap-5 space-y-5">
                  {filteredDiscovery.map((checkie) => {
                    const canManage = isCheckieAuthor(checkie);
                    const authorEmail = checkie.ownerEmail || checkie.authorEmail;
                    const authorLabel = checkie.author || checkie.authorName || 'Artist';
                    const previewTasks = (checkie.tasks || []).slice(0, 3);
                    const coverImg =
                      checkie.coverImage ||
                      (checkie.tasks || []).find((t) => t.exampleImg || t.imageUrl)?.exampleImg ||
                      (checkie.tasks || []).find((t) => t.exampleImg || t.imageUrl)?.imageUrl;

                    return (
                      <div
                        key={checkie.id}
                        onClick={() => openCheckieModal(checkie)}
                        className="break-inside-avoid mb-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400/70 cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between shadow-xl overflow-hidden group"
                      >
                        {coverImg && (
                          <div className="w-full max-h-56 overflow-hidden bg-slate-950 border-b border-slate-800">
                            <img
                              src={coverImg}
                              alt={checkie.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getBadgeStyle(checkie.type)}`}>
                              • {checkie.type || `Mode ${checkie.mode || 1}`}
                            </span>
                            {canManage && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleEditCheckie(checkie)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white text-[10px] font-semibold border border-slate-700 transition-colors"
                                  title="Edit Published Checkie"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCheckie(checkie)}
                                  className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-semibold border border-rose-800/60 transition-colors"
                                  title="Delete Published Checkie"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="font-bold text-lg text-white leading-snug group-hover:text-amber-300 transition-colors">
                              {checkie.title}
                            </h3>
                            {checkie.description && (
                              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                {checkie.description}
                              </p>
                            )}
                          </div>

                          {previewTasks.length > 0 && (
                            <ul className="space-y-1.5 pt-1">
                              {previewTasks.map((t, idx) => (
                                <li
                                  key={t.id || idx}
                                  className="text-xs text-slate-300 bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2"
                                >
                                  <span className="text-amber-400 text-[10px]">◆</span>
                                  <span className="truncate">{t.text}</span>
                                </li>
                              ))}
                              {(checkie.tasks || []).length > 3 && (
                                <li className="text-[11px] text-amber-400/90 font-medium pl-1">
                                  +{(checkie.tasks || []).length - 3} more steps...
                                </li>
                              )}
                            </ul>
                          )}

                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAuthorProfile(authorEmail);
                              }}
                              className="flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200 hover:underline truncate"
                            >
                              <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {authorLabel[0]?.toUpperCase() || 'A'}
                              </span>
                              <span className="truncate font-medium">{authorLabel}</span>
                            </button>

                            <span className="text-xs font-bold text-slate-300 group-hover:text-amber-300 shrink-0">
                              Open &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'messages' && (
          <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Direct Messages</h2>
            <p className="text-xs text-slate-400">Chat with collaborating artists and clients.</p>
          </div>
        )}
        {activeTab === 'commission' && (
          <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Commission Board</h2>
            <p className="text-xs text-slate-400">Manage client requests and active art commissions.</p>
          </div>
        )}
      </main>

      {/* #region 📦 DRAFT BOX MODAL (WITH MASS SELECT TO DELETE) */}
      {showDraftsModal && (() => {
        const currentDrafts = userCheckiesCollection.filter(isDraftItem);
        const allDraftsSelected =
          currentDrafts.length > 0 &&
          currentDrafts.every((d) => selectedDraftIds.includes(d.id));

        const toggleSelectAllDrafts = () => {
          if (allDraftsSelected) {
            setSelectedDraftIds([]);
          } else {
            setSelectedDraftIds(currentDrafts.map((d) => d.id));
          }
        };

        const toggleSelectDraft = (draftId) => {
          setSelectedDraftIds((prev) =>
            prev.includes(draftId)
              ? prev.filter((id) => id !== draftId)
              : [...prev, draftId]
          );
        };

        return createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div
              className="fixed inset-0"
              onClick={() => {
                setShowDraftsModal(false);
                setSelectedDraftIds([]);
              }}
            />
            <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 my-auto max-h-[85vh]">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    📦 Draft Box ({currentDrafts.length})
                  </h3>
                  <p className="text-xs text-slate-400">Private work-in-progress checkies</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDraftsModal(false);
                    setSelectedDraftIds([]);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors bg-slate-800 px-2.5 py-1 text-xs font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Mass Select & Delete Toolbar */}
              {currentDrafts.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={allDraftsSelected}
                      onChange={toggleSelectAllDrafts}
                      className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                    />
                    <span>
                      Select All ({selectedDraftIds.length}/{currentDrafts.length} selected)
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    {selectedDraftIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDraftIds([])}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        Clear Selection
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={selectedDraftIds.length === 0}
                      onClick={() => handleMassDeleteDrafts(currentDrafts)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:cursor-not-allowed"
                    >
                      <span>🗑️</span>
                      <span>
                        Delete Selected{selectedDraftIds.length > 0 ? ` (${selectedDraftIds.length})` : ''}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-y-auto space-y-3 pr-1 max-h-[60vh]">
                {currentDrafts.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">No draft checkies found.</p>
                ) : (
                  currentDrafts.map((draft) => {
                    const isChecked = selectedDraftIds.includes(draft.id);
                    return (
                      <div
                        key={draft.id}
                        className={`p-4 bg-slate-950 border rounded-xl flex items-center justify-between gap-3 transition-colors ${
                          isChecked
                            ? 'border-rose-500/70 bg-rose-950/15'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectDraft(draft.id)}
                            className="w-4 h-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500 bg-slate-900 cursor-pointer shrink-0"
                            aria-label={`Select draft ${draft.title || 'Untitled Draft'}`}
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-white truncate">
                              {draft.title || "Untitled Draft"}
                            </h4>
                            <span className="text-[10px] text-amber-400 font-medium capitalize">
                              {draft.type || `Mode ${draft.mode || 1}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditCheckie(draft)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePublishDraft(draft.id)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-md"
                          >
                            🚀 Publish Now
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCheckie(draft)}
                            className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/60 rounded-lg text-xs font-semibold transition-colors"
                            title="Delete Draft"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
      {/* #endregion */}

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsEditingProfile(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-lg font-bold text-white">Edit Profile</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-500/60 flex items-center justify-center font-bold text-xl text-amber-400 overflow-hidden shrink-0">
                {editForm.avatarUrl ? (
                  <img src={editForm.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{editForm?.displayName?.[0] || 'A'}</span>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-slate-400">Profile Picture</label>
                <div className="flex gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors">
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  {editForm.avatarUrl && (
                    <button
                      onClick={() => setEditForm(prev => ({ ...prev, avatarUrl: '' }))}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">Display Name</label>
              <input
                type="text"
                placeholder="Your Name / Artist Handle"
                value={editForm.displayName}
                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">Bio</label>
              <textarea
                rows="3"
                placeholder="Tell other artists about your work and goals..."
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">Portfolio / Social Link</label>
              <input
                type="url"
                placeholder="https://portfolio.artstation.com"
                value={editForm.portfolioLink}
                onChange={(e) => setEditForm(prev => ({ ...prev, portfolioLink: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-slate-900 pb-1">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-lg shadow-amber-600/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKIE DETAIL MODAL */}
      {selectedCheckie && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => {
              setSelectedCheckie(null);
              setActiveTaskRef(null);
            }}
          />
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-white">{selectedCheckie.title}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getBadgeStyle(selectedCheckie.type)}`}>
                    • {selectedCheckie.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Created by {selectedCheckie.author || selectedCheckie.authorName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isCheckieAuthor(selectedCheckie) && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEditCheckie(selectedCheckie)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCheckie(selectedCheckie)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold border border-rose-800/60 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedCheckie(null);
                    setActiveTaskRef(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {selectedCheckie.type === 'Mixed' ? (
                <div className="flex flex-col gap-4 py-2 min-h-[420px]">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-900/40">
                    <div className="flex items-center gap-1 bg-amber-950/60 p-1 rounded-xl border border-amber-900/50 text-amber-400/80">
                      <button type="button" className="p-1.5 hover:text-amber-200 hover:bg-amber-900/50 rounded-lg transition-colors" title="Bookmark">
                        🔖
                      </button>
                      <button type="button" className="p-1.5 hover:text-amber-200 hover:bg-amber-900/50 rounded-lg transition-colors" title="Favorite">
                        🤍
                      </button>
                      <button type="button" className="p-1.5 hover:text-amber-200 hover:bg-amber-900/50 rounded-lg transition-colors" title="Share">
                        📄
                      </button>
                    </div>
                    <span className="text-xs font-bold text-amber-300 bg-amber-950 border border-amber-800/80 px-3 py-1 rounded-xl">
                      {currentSlideIndex + 1}/{(selectedCheckie.tasks || []).length}
                    </span>
                  </div>
                  <div className="bg-amber-950/80 border border-amber-900/60 rounded-xl p-3.5 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCheckie.tasks[currentSlideIndex]?.done || false}
                      onChange={() => toggleTask(selectedCheckie.id, selectedCheckie.tasks[currentSlideIndex].id)}
                      className="w-5 h-5 rounded border-amber-700 text-amber-500 focus:ring-amber-500 bg-amber-950 cursor-pointer"
                    />
                    <span className={`text-base font-bold ${selectedCheckie.tasks[currentSlideIndex]?.done ? 'line-through text-amber-600/70' : 'text-amber-100'}`}>
                      {selectedCheckie.tasks[currentSlideIndex]?.text || 'Examples of my work!'}
                    </span>
                  </div>
                  <div className="w-full min-h-[280px] bg-amber-950/40 border border-amber-900/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner">
                    {selectedCheckie.tasks[currentSlideIndex]?.imageUrl ? (
                      <img
                        src={selectedCheckie.tasks[currentSlideIndex].imageUrl}
                        alt="User example"
                        className="max-h-[260px] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-amber-500/70">
                        <span className="text-3xl">🖼️</span>
                        <p className="text-base font-medium text-amber-200/80">Insert examples by user.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                        className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-800 text-amber-200 hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg transition-all"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        disabled={currentSlideIndex === selectedCheckie.tasks.length - 1}
                        onClick={() => setCurrentSlideIndex(prev => Math.min(selectedCheckie.tasks.length - 1, prev + 1))}
                        className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-800 text-amber-200 hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg transition-all"
                      >
                        ›
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCheckie.tasks.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`h-2.5 rounded-full transition-all ${currentSlideIndex === idx
                            ? 'bg-amber-400 w-7'
                            : 'bg-amber-900/80 hover:bg-amber-700 w-2.5'
                            }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveProgress}
                        className="p-2.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-800 font-bold transition-all"
                        title="Save Progress"
                      >
                        ✋
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAndComplete}
                        className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold shadow-lg shadow-amber-500/20 transition-all"
                        title="Done / Complete"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedCheckie.type === 'Viewing Only' ? (
                <div className="flex flex-col items-center justify-between gap-6 py-2 min-h-[420px]">
                  <div className="flex items-center justify-between w-full border-b border-amber-900/40 pb-3">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Reference Spec Presentation
                    </span>
                    <span className="text-xs text-amber-300 font-medium bg-amber-950 px-3 py-1 rounded-full border border-amber-800/80">
                      Slide {currentSlideIndex + 1} of {selectedCheckie.tasks.length}
                    </span>
                  </div>
                  <div className="w-full flex-1 flex flex-col justify-between bg-amber-950/80 border border-amber-900/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="bg-amber-900/40 border border-amber-800/50 rounded-xl p-4 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCheckie.tasks[currentSlideIndex]?.done || false}
                          onChange={() => toggleTask(selectedCheckie.id, selectedCheckie.tasks[currentSlideIndex].id)}
                          className="w-5 h-5 rounded border-amber-700 text-amber-500 focus:ring-amber-500 bg-amber-950 cursor-pointer"
                        />
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                            Slide #{currentSlideIndex + 1} Checklist Task
                          </span>
                          <h4 className={`text-base font-bold ${selectedCheckie.tasks[currentSlideIndex]?.done ? 'line-through text-amber-600/70' : 'text-amber-100'}`}>
                            {selectedCheckie.tasks[currentSlideIndex]?.text}
                          </h4>
                        </div>
                      </div>
                      <span className="text-xs text-amber-400 bg-amber-950 px-2.5 py-1 rounded-md border border-amber-800/80">
                        {selectedCheckie.tasks[currentSlideIndex]?.slideType === 'checklist_and_link' ? 'Checklist & Reference Link' : 'Picture & Checklist'}
                      </span>
                    </div>
                    <div className="w-full flex-1 min-h-[220px] bg-amber-950/60 border border-amber-900/40 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                      {selectedCheckie.tasks[currentSlideIndex]?.slideType === 'checklist_and_link' ? (
                        <div className="flex flex-col items-center gap-4 my-auto">
                          <div className="w-14 h-14 rounded-full bg-amber-900/60 border border-amber-700/50 flex items-center justify-center text-amber-300 text-xl">
                            🔗
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-amber-200 mb-1">
                              External Reference Link
                            </h5>
                            <p className="text-xs text-amber-400/80 max-w-md mb-4">
                              Access additional study sheets and interactive guides for this specific task.
                            </p>
                          </div>
                          <a
                            href={selectedCheckie.tasks[currentSlideIndex]?.linkUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                          >
                            <span>{selectedCheckie.tasks[currentSlideIndex]?.linkLabel || 'Reference Link'}</span>
                            <span>&rarr;</span>
                          </a>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-full bg-amber-900/80 border border-amber-800 flex items-center justify-center text-amber-400 text-2xl mb-2">
                            🖼️
                          </div>
                          <h5 className="text-sm font-bold text-amber-200">
                            {selectedCheckie.tasks[currentSlideIndex]?.exampleName || 'Visual Reference Spec'}
                          </h5>
                          <p className="text-xs text-amber-400/80 max-w-md">
                            Visual reference image provided for task verification and accuracy check.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full pt-2">
                    <button
                      type="button"
                      disabled={currentSlideIndex === 0}
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                      className="px-5 py-2.5 rounded-xl bg-amber-900/60 border border-amber-800 text-amber-200 text-xs font-bold hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      ← Previous Slide
                    </button>
                    <div className="flex items-center gap-1.5">
                      {selectedCheckie.tasks.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`h-2.5 rounded-full transition-all ${currentSlideIndex === idx
                            ? 'bg-amber-400 w-6'
                            : 'bg-amber-900/80 hover:bg-amber-700 w-2.5'
                            }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentSlideIndex === selectedCheckie.tasks.length - 1}
                        onClick={() => setCurrentSlideIndex(prev => Math.min(selectedCheckie.tasks.length - 1, prev + 1))}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 border border-amber-400 text-amber-950 text-xs font-bold hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                      >
                        Next Slide →
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProgress}
                        className="px-4 py-2.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 font-bold text-xs border border-amber-800 transition-colors"
                      >
                        Save Progress
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAndComplete}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-colors flex items-center gap-1.5"
                      >
                        <span>✓</span> Save & Complete
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-6 ${layoutMode === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        Artwork
                      </h4>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className="relative w-full h-full min-h-[300px] bg-amber-950/60 rounded-2xl border-2 border-dashed border-amber-900/80 flex flex-col items-center justify-center p-4 text-center hover:border-amber-500/50 transition-colors overflow-hidden group"
                      >
                        {uploadedImage ? (
                          <>
                            <img
                              src={uploadedImage}
                              alt="Uploaded Artwork"
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setUploadedImage(null)}
                              className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-semibold bg-amber-950/80 hover:bg-rose-600 text-amber-100 rounded-md border border-amber-800 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Change Artwork
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xl">
                              📷
                            </div>
                            <span className="text-sm font-bold text-slate-200">
                              Upload Artwork
                            </span>
                            <span className="text-xs text-slate-400">
                              Drop artwork here, or <span className="text-amber-400 underline">browse</span>
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
                      <div />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSaveProgress}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
                        >
                          Save Progress
                        </button>
                        <button
                          type="button"
                          onClick={handleCompleteCheckie}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-colors"
                        >
                          Complete Review
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Checklist Items
                      </h4>
                      <span className="text-xs text-amber-400 font-semibold bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-md">
                        {(selectedCheckie.tasks || []).filter(t => t.done).length} / {(selectedCheckie.tasks || []).length} Completed
                      </span>
                    </div>
                    {!activeTaskRef ? (
                      <div className="space-y-2">
                        {(selectedCheckie.tasks || []).map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${task.done
                              ? 'bg-amber-950/20 border-amber-900/50 text-slate-400'
                              : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 text-slate-200'
                              }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1 mr-2">
                              <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => toggleTask(selectedCheckie.id, task.id)}
                                className="w-4 h-4 rounded border-slate-600 text-amber-600 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                              />
                              <span className={`text-sm ${task.done ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                                {task.text}
                              </span>
                            </label>
                            {selectedCheckie.type === 'Checklist & Pictures' && (
                              <button
                                type="button"
                                onClick={() => setActiveTaskRef(task)}
                                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:bg-purple-600 hover:text-white transition-all shrink-0"
                                title="Expand Reference Example"
                              >
                                &gt;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 h-full">
                        <div className="w-full h-full min-h-[300px] bg-slate-950/90 rounded-2xl border border-purple-500/60 p-5 flex flex-col justify-between shadow-xl shadow-purple-950/20 relative">
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={activeTaskRef.done}
                                  onChange={() => toggleTask(selectedCheckie.id, activeTaskRef.id)}
                                  className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-900 cursor-pointer"
                                />
                                <h5 className="text-base font-bold text-white">{activeTaskRef.text}</h5>
                              </div>
                              <button
                                onClick={() => setActiveTaskRef(null)}
                                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center font-bold text-xs"
                                title="Close Reference View"
                              >
                                &gt;
                              </button>
                            </div>
                          </div>
                          <div className="w-full flex-1 min-h-[200px] bg-slate-900/80 rounded-xl border border-purple-900/40 flex flex-col items-center justify-center p-4 text-center my-2">
                            <span className="text-3xl mb-2">🔍</span>
                            <span className="text-sm font-semibold text-purple-200">Reference Guide</span>
                            <span className="text-xs text-slate-400 mt-1">{activeTaskRef.exampleName || 'Silhouette Guide Example'}</span>
                          </div>
                          <div className="text-center">
                            <button
                              onClick={() => setActiveTaskRef(null)}
                              className="text-xs text-purple-400 hover:underline font-medium"
                            >
                              ← Return to All Checklist Items
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* "DONE!" POPUP SCREEN */}
      {showDoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl mb-4">
              🎉
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Done!</h3>
            <p className="text-xs text-slate-300 mb-6">
              You’ve completed this audit and the checkie items have been reset!
            </p>
            <button
              onClick={() => setShowDoneModal(false)}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl z-20">
        <button
          onClick={() => setActiveTab('standard')}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${activeTab === 'standard'
            ? 'bg-amber-600 text-white ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-amber-500/30'
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          title="Standard Mode"
        >
          S
        </button>
        <button
          onClick={() => {
            setSelectedUserEmail(user.email);
            setActiveTab('profile');
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${activeTab === 'profile'
            ? 'bg-amber-600 text-white ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-amber-500/30'
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          title="Profile"
        >
          P
        </button>
        <button
          onClick={() => setActiveTab('discovery')}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${activeTab === 'discovery'
            ? 'bg-amber-600 text-white ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-amber-500/30'
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          title="Discovery"
        >
          Δ
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${activeTab === 'messages'
            ? 'bg-amber-600 text-white ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-amber-500/30'
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          title="Direct Message"
        >
          💬
        </button>
        <button
          onClick={() => setActiveTab('commission')}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${activeTab === 'commission'
            ? 'bg-amber-600 text-white ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-amber-500/30'
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          title="Commission"
        >
          C
        </button>
      </div>
    </div>
  );
}

