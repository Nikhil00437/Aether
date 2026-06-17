import React, { useState } from 'react';
import { Home, Search, Music2, Heart, PlusCircle, HelpCircle, FolderHeart, ListMusic, RotateCcw, Flame, Sparkles } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import PlaylistCover from './PlaylistCover';
import ChibiCompanion from './ChibiCompanion';

const Sidebar = ({ activeTab, setActiveTab, openPlaylistModal }) => {
  const { 
    favorites, 
    isDemoMode, 
    playlists, 
    addSongToPlaylist,
    songs
  } = useAudio();

  const [dragOverId, setDragOverId] = useState(null);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'All Songs', icon: Music2 },
    { id: 'favorites', label: 'Favorites', icon: Heart, count: favorites.length },
    { id: 'recent', label: 'Recently Played', icon: RotateCcw },
    { id: 'repeat', label: 'On Repeat', icon: Flame },
    { id: 'companion', label: "Aethy's Room", icon: Sparkles }
  ];

  const handleCreatePlaylist = () => {
    openPlaylistModal();
  };

  // Drag & Drop handlers for playlist links
  const handleDragOver = (e, playlistId) => {
    e.preventDefault();
    setDragOverId(playlistId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e, playlistId) => {
    e.preventDefault();
    setDragOverId(null);
    const songId = e.dataTransfer.getData('text/plain');
    if (songId) {
      addSongToPlaylist(playlistId, songId);
      // Optional: Visual confirmation banner or feedback can go here
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', paddingLeft: '8px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--accent-glow)'
        }}>
          <Music2 size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.5px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AETHER
          </h1>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginTop: '-3px' }}>
            Music Player
          </span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                width: '100%',
                background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                position: 'relative'
              }}
              className={`nav-item-btn ${isActive ? 'active-nav-btn' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} className={isActive ? 'active active-icon' : ''} style={{ color: isActive ? 'var(--accent-primary)' : 'inherit' }} />
                <span>{item.label}</span>
              </div>
              
              {item.count !== undefined && item.count > 0 && (
                <span style={{
                  fontSize: '11px',
                  background: isActive ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 600
                }}>
                  {item.count}
                </span>
              )}

              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '25%',
                  height: '50%',
                  width: '3px',
                  background: 'var(--accent-gradient)',
                  borderRadius: '0 4px 4px 0',
                  boxShadow: '0 0 8px var(--accent-primary)'
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Playlists Title Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px 10px 12px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '12px'
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'var(--text-muted)'
        }}>
          Playlists
        </span>
        <button 
          onClick={handleCreatePlaylist}
          className="icon-btn"
          style={{ padding: '4px', borderRadius: '4px' }}
          title="Create Playlist"
        >
          <PlusCircle size={16} />
        </button>
      </div>

      {/* Playlists List Container */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px', 
        overflowY: 'auto', 
        maxHeight: '220px',
        paddingRight: '4px'
      }}>
        {playlists.length === 0 ? (
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '20px 10px',
            border: '1px dashed rgba(255, 255, 255, 0.04)',
            borderRadius: '8px'
          }}>
            No playlists yet. Click "+" to create one!
          </div>
        ) : (
          playlists.map((playlist) => {
            const isActive = activeTab === playlist.id;
            const isDragOver = dragOverId === playlist.id;
            
            return (
              <button
                key={playlist.id}
                id={`nav-item-${playlist.id}`}
                onClick={() => setActiveTab(playlist.id)}
                onDragOver={(e) => handleDragOver(e, playlist.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, playlist.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  width: '100%',
                  background: isDragOver
                    ? 'rgba(6, 182, 212, 0.12)'
                    : isActive
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'transparent',
                  border: isDragOver
                    ? '1px dashed var(--accent-primary)'
                    : '1px solid transparent',
                  borderRadius: '8px',
                  color: isActive || isDragOver ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: isDragOver ? 'var(--accent-glow)' : 'none'
                }}
                className="playlist-item-btn"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <PlaylistCover playlist={playlist} size={18} songs={songs} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {playlist.name}
                  </span>
                </div>
                
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginLeft: '8px',
                  flexShrink: 0
                }}>
                  {playlist.songIds.length}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Spacer */}
      <div style={{ flexGrow: 1 }} />

      {/* Guide Box */}
      <div className="glass-panel" style={{
        padding: '14px',
        fontSize: '11px',
        lineHeight: '1.5',
        color: 'var(--text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
          <FolderHeart size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Quick Tip</span>
        </div>
        <p style={{ fontSize: '10px' }}>
          Drag a song row from any list and drop it directly onto a playlist in the sidebar to add it!
        </p>
      </div>
      <ChibiCompanion activeTab={activeTab} />
    </aside>
  );
};

export default Sidebar;
