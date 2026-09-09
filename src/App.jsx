import React, { useState, useEffect } from 'react';

// Exact imports matching your assets folder filenames
import motifImg from './assets/motif.jpeg';
import silhouetteImg from './assets/sillhouette.jpg';
import colorsImg from './assets/variety.jpg';
import saturationImg from './assets/saturation.jpg';

const INITIAL_STANDARD_DATA = {
  "Character Design": {
    description: "Audit design motif, silhouette readability, color palette choices, and saturation.",
    profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    items: [
      { 
        id: 1, 
        text: "Make sure the design has a motif", 
        checked: false, 
        image: motifImg,
        caption: "Define core design motifs (e.g. nightwear/sleep elements, star pattern repeats, eye mask)." 
      },
      { 
        id: 2, 
        text: "The silhouette is readable", 
        checked: false, 
        image: silhouetteImg,
        caption: "Test outer character shape in solid black for quick visual recognition." 
      },
      { 
        id: 3, 
        text: "Choose two-three main colors", 
        checked: false, 
        image: colorsImg,
        caption: "Limit base palette to 2-3 cohesive primary and secondary tones."
      },
      { 
        id: 4, 
        text: "Don’t over saturate the colors", 
        checked: false, 
        image: saturationImg,
        caption: "Avoid neon/hyper-saturated fills that cause visual fatigue."
      }
    ]
  },
  "Backgrounds": {
    description: "Verify perspective grids, horizon lines, and atmospheric depth.",
    profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    items: [
      { 
        id: 5, 
        text: "Horizon line & eye level confirmed", 
        checked: false,
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
        caption: "Verify level line and horizon line."
      },
      { 
        id: 6, 
        text: "Perspective grid locked in place", 
        checked: false, 
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80", 
        caption: "Vanishing point alignment for depth." 
      }
    ]
  }
};

const INITIAL_PROFILE = {
  username: "Artist Studio",
  bio: "Digital Illustrator & Concept Artist. Self-auditing workflow checkies.",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
};

const INITIAL_PROFILE_CHECKIES = {
  "My Personal Portfolio": {
    description: "Final quality checks before uploading to portfolio.",
    profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    items: [
      { id: 201, text: "Check edge sharpening and noise filter", checked: false },
      { id: 202, text: "Export in both sRGB and Display P3 profiles", checked: false }
    ]
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('standard');
  const [layoutMode, setLayoutMode] = useState('side-by-side');

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('checkies_v1_profile');
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  const [standardData, setStandardData] = useState(() => {
    try {
      const saved = localStorage.getItem('checkies_v1_standard');
      return saved ? JSON.parse(saved) : INITIAL_STANDARD_DATA;
    } catch {
      return INITIAL_STANDARD_DATA;
    }
  });

  const [profileCheckies, setProfileCheckies] = useState(() => {
    try {
      const saved = localStorage.getItem('checkies_v1_profile_checkies');
      return saved ? JSON.parse(saved) : INITIAL_PROFILE_CHECKIES;
    } catch {
      return INITIAL_PROFILE_CHECKIES;
    }
  });

  const [newCheckieTitle, setNewCheckieTitle] = useState('');
  const [newCheckieDesc, setNewCheckieDesc] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempUsername, setTempUsername] = useState(profile.username);
  const [tempBio, setTempBio] = useState(profile.bio);

  const [focusedCategory, setFocusedCategory] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('checkies_v1_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('checkies_v1_standard', JSON.stringify(standardData));
    } catch {}
  }, [standardData]);

  useEffect(() => {
    try {
      localStorage.setItem('checkies_v1_profile_checkies', JSON.stringify(profileCheckies));
    } catch {}
  }, [profileCheckies]);

  const toggleItem = (category, id) => {
    const setData = activeTab === 'profile' ? setProfileCheckies : setStandardData;
    setData(prev => {
      if (!prev[category]) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          items: prev[category].items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
          )
        }
      };
    });
  };

  const resetCategoryProgress = (category) => {
    const setData = activeTab === 'profile' ? setProfileCheckies : setStandardData;
    setData(prev => {
      if (!prev[category]) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          items: prev[category].items.map(item => ({ ...item, checked: false }))
        }
      };
    });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, avatar: url }));
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile(prev => ({
      ...prev,
      username: tempUsername,
      bio: tempBio
    }));
    setEditingProfile(false);
  };

  const handleAddProfileCheckie = (e) => {
    e.preventDefault();
    if (!newCheckieTitle.trim()) return;

    setProfileCheckies(prev => ({
      ...prev,
      [newCheckieTitle.trim()]: {
        description: newCheckieDesc.trim() || "Personal artist checkie.",
        profilePic: profile.avatar,
        items: [
          { id: Date.now(), text: "First checklist step", checked: false }
        ]
      }
    }));

    setNewCheckieTitle('');
    setNewCheckieDesc('');
  };

  const handleImageFiles = (files) => {
    if (!files || files.length === 0) return;
    const newUrls = Array.from(files).map(file => URL.createObjectURL(file));
    setUploadedImages(prev => [...prev, ...newUrls]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFiles(e.dataTransfer.files);
    }
  };

  const openInspector = (category) => {
    setFocusedCategory(category);
    setCurrentTaskIndex(0);
  };

  const closeInspector = () => {
    setFocusedCategory(null);
    setCurrentTaskIndex(0);
    setUploadedImages([]);
  };

  const handleFinishInspection = () => {
    if (focusedCategory) {
      resetCategoryProgress(focusedCategory);
    }
    closeInspector();
  };

  const currentData = activeTab === 'standard' ? standardData : profileCheckies;
  const currentCategoryData = focusedCategory ? currentData[focusedCategory] : null;
  const currentCategoryItems = currentCategoryData ? currentCategoryData.items : [];
  const currentItem = currentCategoryItems[currentTaskIndex];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-indigo-400">Checkies</h1>
            <p className="text-xs text-slate-500 mt-1">Audit Tool for Artists</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => { setActiveTab('standard'); closeInspector(); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                activeTab === 'standard'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>Standard Mode</span>
              <span className="text-xs bg-slate-950/40 px-2 py-0.5 rounded-full">Preset</span>
            </button>

            <button
              onClick={() => { setActiveTab('profile'); closeInspector(); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-3 ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <img 
                src={profile.avatar} 
                alt="Profile Avatar" 
                className="w-6 h-6 rounded-full object-cover border border-white/20"
              />
              <span className="truncate">{profile.username || 'My Profile'}</span>
            </button>
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">Settings</span>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-xs text-slate-400 font-medium block">Inspector Layout</span>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg">
                <button
                  onClick={() => setLayoutMode('side-by-side')}
                  className={`text-[11px] py-1.5 rounded-md font-semibold transition ${
                    layoutMode === 'side-by-side' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setLayoutMode('stacked')}
                  className={`text-[11px] py-1.5 rounded-md font-semibold transition ${
                    layoutMode === 'stacked' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Stacked
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            if (activeTab === 'standard') {
              localStorage.removeItem('checkies_v1_standard');
              setStandardData(INITIAL_STANDARD_DATA);
            } else {
              localStorage.removeItem('checkies_v1_profile');
              localStorage.removeItem('checkies_v1_profile_checkies');
              setProfile(INITIAL_PROFILE);
              setProfileCheckies(INITIAL_PROFILE_CHECKIES);
            }
            closeInspector();
          }}
          className="text-xs text-slate-500 hover:text-rose-400 bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg transition text-center"
        >
          Reset {activeTab === 'standard' ? 'Standard' : 'Profile'} Data
        </button>
      </aside>

      {/* MAIN MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 capitalize">
                {focusedCategory 
                  ? `${focusedCategory} Inspection` 
                  : activeTab === 'profile' 
                    ? 'My Profile' 
                    : 'Standard Mode'}
              </h2>
              <p className="text-sm text-slate-400">
                {focusedCategory 
                  ? `Slide ${currentTaskIndex + 1} of ${currentCategoryItems.length}` 
                  : 'Click any checkie to inspect items and compare artwork.'}
              </p>
            </div>

            {focusedCategory && (
              <button
                onClick={closeInspector}
                className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg font-semibold transition"
              >
                ← Return to Checkies
              </button>
            )}
          </div>

          {activeTab === 'profile' && !focusedCategory && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative group cursor-pointer">
                    <img 
                      src={profile.avatar} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                    />
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center text-[10px] text-white font-semibold cursor-pointer transition">
                      Change
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{profile.username}</h3>
                    <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">{profile.bio}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTempUsername(profile.username);
                    setTempBio(profile.bio);
                    setEditingProfile(!editingProfile);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-4 py-2 rounded-lg font-semibold border border-slate-700 transition"
                >
                  {editingProfile ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>

              {editingProfile && (
                <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Username</label>
                      <input 
                        type="text" 
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Bio / Description</label>
                      <input 
                        type="text" 
                        value={tempBio}
                        onChange={(e) => setTempBio(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Save Changes
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-3">
                  + Add Checkie to Profile
                </span>
                <form onSubmit={handleAddProfileCheckie} className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Checkie Title..."
                    value={newCheckieTitle}
                    onChange={(e) => setNewCheckieTitle(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Brief description..."
                    value={newCheckieDesc}
                    onChange={(e) => setNewCheckieDesc(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 flex-1"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-xs font-semibold transition flex-shrink-0"
                  >
                    Create Checkie
                  </button>
                </form>
              </div>
            </div>
          )}

          {focusedCategory ? (
            <div className="max-w-5xl mx-auto">
              {currentItem ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Step {currentTaskIndex + 1} / {currentCategoryItems.length}
                    </span>
                    {currentItem.image && (
                      <button
                        onClick={() => setZoomImage(currentItem.image)}
                        className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5"
                      >
                        🔍 Zoom Reference
                      </button>
                    )}
                  </div>

                  <div 
                    onClick={() => toggleItem(focusedCategory, currentItem.id)}
                    className="flex items-start gap-4 p-4 bg-slate-800/80 hover:bg-slate-800 rounded-xl cursor-pointer border border-slate-700/50 transition"
                  >
                    <input 
                      type="checkbox"
                      checked={currentItem.checked}
                      onChange={() => {}}
                      className="w-6 h-6 accent-indigo-500 rounded cursor-pointer mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={`text-base font-medium block ${currentItem.checked ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {currentItem.text}
                      </span>
                    </div>
                  </div>

                  <div className={`grid gap-6 ${layoutMode === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {currentItem.image ? (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between h-[340px]">
                        <span className="text-xs font-semibold text-slate-400 block mb-2">Example Reference:</span>
                        <div 
                          onClick={() => setZoomImage(currentItem.image)}
                          className="w-full flex-1 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900 cursor-pointer group relative flex items-center justify-center p-2"
                        >
                          <img 
                            src={currentItem.image} 
                            alt="Reference" 
                            className="w-full h-full object-contain rounded-lg transition transform group-hover:scale-102"
                          />
                          <span className="absolute bottom-2 right-2 bg-black/70 text-[10px] text-slate-200 px-2 py-1 rounded backdrop-blur">
                            🔍 Click to Zoom
                          </span>
                        </div>
                        {currentItem.caption && (
                          <p className="text-xs text-slate-400 italic mt-2">{currentItem.caption}</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 flex items-center justify-center text-xs text-slate-500 italic h-[340px]">
                        No example reference image for this step.
                      </div>
                    )}

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between h-[340px]">
                      <span className="text-xs font-semibold text-slate-400 block mb-2">Your Artwork Comparison:</span>
                      
                      {uploadedImages.length > 0 ? (
                        <div 
                          onClick={() => setZoomImage(uploadedImages[uploadedImages.length - 1])}
                          className="w-full flex-1 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900 cursor-pointer group relative flex items-center justify-center p-2"
                        >
                          <img 
                            src={uploadedImages[uploadedImages.length - 1]} 
                            alt="User Artwork" 
                            className="w-full h-full object-contain rounded-lg transition transform group-hover:scale-102"
                          />
                          <span className="absolute bottom-2 right-2 bg-black/70 text-[10px] text-slate-200 px-2 py-1 rounded backdrop-blur">
                            🔍 Click to Zoom
                          </span>
                        </div>
                      ) : (
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          className="w-full flex-1 rounded-xl border-2 border-dashed border-slate-800 hover:border-indigo-500/40 transition flex items-center justify-center"
                        >
                          <label className="cursor-pointer text-center p-4">
                            <span className="text-xs font-semibold text-slate-300 block">Drag & drop your artwork here</span>
                            <span className="text-[11px] text-slate-500 mt-1 block">or click to browse local files</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFiles(e.target.files)} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setCurrentTaskIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentTaskIndex === 0}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs px-4 py-2 rounded-lg font-semibold transition"
                    >
                      ← Previous
                    </button>

                    <button
                      onClick={() => {
                        if (currentItem.checked) {
                          if (currentTaskIndex < currentCategoryItems.length - 1) {
                            setCurrentTaskIndex(prev => prev + 1);
                          } else {
                            handleFinishInspection();
                          }
                        }
                      }}
                      disabled={!currentItem.checked}
                      className={`text-xs px-5 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                        currentItem.checked 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {!currentItem.checked && <span>🔒</span>}
                      {currentTaskIndex === currentCategoryItems.length - 1 ? 'Finish & Return 🎉' : 'Next Step →'}
                    </button>
                  </div>

                </div>
              ) : (
                <div className="bg-slate-900 p-8 rounded-xl text-center">
                  <p className="text-sm text-slate-400 mb-4">This checkie has no items yet.</p>
                  <button onClick={closeInspector} className="bg-indigo-600 px-4 py-2 rounded-lg text-xs font-semibold">
                    Return to Checkies
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(currentData).map(([category, sectionData]) => {
                const items = sectionData.items || [];

                return (
                  <div 
                    key={category} 
                    onClick={() => openInspector(category)}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer rounded-xl p-5 flex flex-col justify-between shadow-lg transition hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <img 
                          src={activeTab === 'profile' ? profile.avatar : (sectionData.profilePic || profile.avatar)} 
                          alt={category} 
                          className="w-12 h-12 rounded-full border border-indigo-500/40 object-cover flex-shrink-0"
                        />
                        <div>
                          <h3 className="text-base font-semibold text-slate-200">{category}</h3>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        {sectionData.description}
                      </p>
                    </div>

                    <div>
                      <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                        <span className="text-xs text-indigo-400 font-semibold">Open Checkie →</span>
                        <span className="text-[11px] text-slate-500">{items.length} Tasks</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* ZOOM MODAL */}
      {zoomImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col p-6 overflow-auto"
          onClick={() => setZoomImage(null)}
        >
          <div className="flex justify-between items-center mb-4 max-w-6xl mx-auto w-full">
            <span className="text-xs text-slate-400">Click anywhere to close</span>
            <button 
              onClick={() => setZoomImage(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-bold"
            >
              ✕ Close
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 max-w-6xl mx-auto w-full">
            <img 
              src={zoomImage} 
              alt="Zoomed Reference" 
              className="max-w-full max-h-none rounded-xl border border-slate-800 shadow-2xl object-contain cursor-zoom-out"
            />
          </div>
        </div>
      )}

    </div>
  );
}