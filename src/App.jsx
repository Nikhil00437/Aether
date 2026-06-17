import React, { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './context/AudioContext';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PlayerBar from './components/PlayerBar';
import RightDrawer from './components/RightDrawer';
import AmbientBackground from './components/AmbientBackground';
import KaraokeOverlay from './components/KaraokeOverlay';
import { ListMusic, X, LineSquiggle, Keyboard } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isScribbling, setIsScribbling] = useState(false);
  const [isInputPopping, setIsInputPopping] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const { 
    toast, 
    createPlaylist,
    currentSong,
    currentTime,
    duration,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    adjustVolume,
    toggleFavorite,
    showQueue,
    toggleQueue,
    showLyrics,
    toggleLyrics
  } = useAudio();

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key events if the user is typing in a text field
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyN':
          e.preventDefault();
          nextTrack();
          break;
        case 'KeyP':
          e.preventDefault();
          prevTrack();
          break;
        case 'KeyL':
          if (currentSong) {
            e.preventDefault();
            toggleFavorite(currentSong.id);
          }
          break;
        case 'KeyQ':
          e.preventDefault();
          toggleQueue();
          break;
        case 'KeyY':
          e.preventDefault();
          toggleLyrics();
          break;
        default:
          break;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowHelpModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay, 
    seek, 
    currentTime, 
    duration, 
    adjustVolume, 
    volume, 
    nextTrack, 
    prevTrack, 
    currentSong, 
    toggleFavorite, 
    toggleQueue, 
    toggleLyrics
  ]);

  const handleCreatePlaylistSubmit = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      const newPlaylist = createPlaylist(newPlaylistName);
      if (newPlaylist) {
        setActiveTab(newPlaylist.id);
      }
      setNewPlaylistName('');
      setShowPlaylistModal(false);
    }
  };

  const handleGenerateRandomName = () => {
    if (isScribbling) return;
    setIsScribbling(true);
    setIsInputPopping(true);

    const adjectives = [
      "Neon", "Cosmic", "Chillout", "Sunset", "Moonlight", "Deep", "Retro", 
      "Infinite", "Hyper", "Lofi", "Aether", "Starlight", "Solar", "Ocean", 
      "Vintage", "Liquid", "Digital", "Ambient", "Velvet", "Golden", "Cyber"
    ];
    const nouns = [
      "Glow", "Echoes", "Dreams", "Vibes", "Flow", "Voyage", "Beats", 
      "Waves", "Horizon", "Shadows", "Drift", "Pulse", "Rhythms", "Sparks", 
      "Breeze", "Nostalgia", "Chords", "Melody", "Aura", "Harmonies", "Reverie"
    ];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    setNewPlaylistName(`${randomAdj} ${randomNoun}`);

    setTimeout(() => {
      setIsScribbling(false);
    }, 600);

    setTimeout(() => {
      setIsInputPopping(false);
    }, 700);
  };

  return (
    <div className="app-container">
      <AmbientBackground />
      <KaraokeOverlay />
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openPlaylistModal={() => setShowPlaylistModal(true)} 
      />
      
      {/* Main Content Pane */}
      <MainContent activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Bottom Playback bar */}
      <PlayerBar onOpenHelp={() => setShowHelpModal(true)} />

      {/* Global Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '105px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 15, 18, 0.95)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '30px',
          padding: '10px 24px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 10000,
          boxShadow: 'var(--accent-glow)',
          backdropFilter: 'blur(10px)',
          pointerEvents: 'none',
          animation: 'slideUpToast 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: 'var(--accent-primary)', 
            boxShadow: '0 0 8px var(--accent-primary)' 
          }} />
          {toast}
        </div>
      )}

      {/* Custom Playlist Creation Modal */}
      {showPlaylistModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }} onClick={() => setShowPlaylistModal(false)}>
          <form 
            onSubmit={handleCreatePlaylistSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(18, 18, 22, 0.95)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '32px',
              width: '400px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), var(--accent-glow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              animation: 'modalScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            <button 
              type="button"
              onClick={() => setShowPlaylistModal(false)}
              className="icon-btn"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '6px',
                borderRadius: '50%'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--accent-glow)'
              }}>
                <ListMusic size={22} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Create Playlist</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Organize your sound library</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Playlist Name</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type="text"
                  autoFocus
                  placeholder="Enter playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 48px 12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'var(--transition-smooth)'
                  }}
                  className={`modal-input ${isInputPopping ? 'input-pulse-glow input-pop' : ''}`}
                />
                <button
                  type="button"
                  onClick={handleGenerateRandomName}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'var(--transition-smooth)'
                  }}
                  className="scribble-btn"
                  title="Scribble Random Name"
                >
                  <span className={`scribble-icon-inner ${isScribbling ? 'scribble-animate' : ''}`} style={{ display: 'flex' }}>
                    <LineSquiggle size={16} />
                  </span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button"
                onClick={() => setShowPlaylistModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{
                  padding: '10px 22px',
                  borderRadius: '20px',
                  border: 'none',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: 'var(--accent-glow)'
                }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Right Drawer (Lyrics & Queue Overlay) */}
      <RightDrawer 
        isOpen={showQueue || showLyrics} 
        onClose={() => {
          if (showQueue) toggleQueue();
          if (showLyrics) toggleLyrics();
        }} 
        mode={showLyrics ? 'lyrics' : 'queue'} 
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }} onClick={() => setShowHelpModal(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(18, 18, 22, 0.95)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '32px',
              width: '480px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), var(--accent-glow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              animation: 'modalScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            <button 
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="icon-btn"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '6px',
                borderRadius: '50%'
              }}
              title="Close Guide"
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--accent-glow)'
              }}>
                <Keyboard size={22} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Keyboard Shortcuts</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Control your listening experience</span>
              </div>
            </div>

            <div className="kbd-guide-grid">
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Play / Pause</span>
                <span className="kbd-key-cap">Space</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Next Track</span>
                <span className="kbd-key-cap">N</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Previous Track</span>
                <span className="kbd-key-cap">P</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Like Current Song</span>
                <span className="kbd-key-cap">L</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Seek Forward 5s</span>
                <span className="kbd-key-cap">→</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Seek Backward 5s</span>
                <span className="kbd-key-cap">←</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Volume Up 5%</span>
                <span className="kbd-key-cap">↑</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Volume Down 5%</span>
                <span className="kbd-key-cap">↓</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Toggle Play Queue</span>
                <span className="kbd-key-cap">Q</span>
              </div>
              <div className="kbd-shortcut-item">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Toggle Synced Lyrics</span>
                <span className="kbd-key-cap">Y</span>
              </div>
            </div>

            <div style={{ 
              textAlign: 'center', 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              marginTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '12px'
            }}>
              Press <span className="kbd-key-cap" style={{ minWidth: '16px', padding: '1px 5px', fontSize: '9px' }}>?</span> anywhere to toggle this guide.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}

export default App;
