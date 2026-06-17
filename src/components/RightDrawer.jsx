import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2, ListMusic, Volume2, Play, Music, Mic2, Search, RotateCcw } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

const RightDrawer = ({ isOpen, onClose, mode }) => {
  const { 
    currentSong, 
    isPlaying,
    playQueue, 
    currentQueueIndex, 
    currentTime,
    playTrack,
    removeFromQueue,
    clearQueue,
    lyrics,
    lyricsLoading,
    seek,
    lyricsOffset,
    setLyricsOffset,
    searchLyricsManually,
    reorderQueue
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOpen, setIsSearchingOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const lyricsContainerRef = useRef(null);

  // Sync searchQuery to current song title when song changes
  useEffect(() => {
    if (currentSong) {
      setSearchQuery(`${currentSong.artist || ''} ${currentSong.title || ''}`.trim());
    }
  }, [currentSong]);

  // Determine active lyric line index based on current song time + timing offset
  const activeLyricIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    const currentLineTime = line.time + lyricsOffset;
    const nextLineTime = nextLine ? nextLine.time + lyricsOffset : null;
    return currentTime >= currentLineTime && (!nextLineTime || currentTime < nextLineTime);
  });

  // Scroll active lyric smoothly into view
  useEffect(() => {
    if (mode === 'lyrics' && activeLyricIndex !== -1) {
      const activeEl = document.getElementById(`lyric-line-${activeLyricIndex}`);
      if (activeEl && lyricsContainerRef.current) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex, mode]);

  // Separate queue list: currently playing and upcoming tracks
  const upcomingSongs = playQueue.slice(currentQueueIndex + 1);

  return (
    <div className={`right-drawer ${isOpen ? 'open' : ''}`}>
      {/* Drawer Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          {mode === 'queue' ? (
            <>
              <ListMusic size={18} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '15px', fontWeight: 700 }}>Play Queue</span>
            </>
          ) : (
            <>
              <Mic2 size={18} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '15px', fontWeight: 700 }}>Synced Lyrics</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {mode === 'lyrics' && (
            <button 
              onClick={() => setIsSearchingOpen(!isSearchingOpen)} 
              className={`icon-btn ${isSearchingOpen ? 'active' : ''}`} 
              style={{ padding: '6px', borderRadius: '50%' }}
              title="Search lyrics manually"
            >
              <Search size={15} />
            </button>
          )}
          <button 
            onClick={onClose} 
            className="icon-btn" 
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Manual Search Form */}
      {mode === 'lyrics' && isSearchingOpen && (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              searchLyricsManually(searchQuery.trim());
            }
          }}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            width: '100%',
            animation: 'fadeInContent 0.25s ease forwards',
            flexShrink: 0
          }}
        >
          <input 
            type="text" 
            placeholder="Search lyrics manually..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flexGrow: 1,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '6px 14px',
              fontSize: '12px',
              color: '#fff',
              outline: 'none'
            }}
            className="modal-input"
          />
          <button 
            type="submit" 
            style={{
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '16px',
              color: '#fff',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--accent-glow)'
            }}
          >
            Search
          </button>
        </form>
      )}

      {/* Mode 1: PLAY QUEUE */}
      {mode === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flexGrow: 1, paddingRight: '4px' }}>
          {/* Now Playing */}
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              Now Playing
            </span>
            {currentSong ? (
              <div className={`glass-panel ${isPlaying ? 'beat-pulse-border beat-pulse-glow' : ''}`} style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '10px',
                transition: 'border-color 0.12s ease-out, box-shadow 0.12s ease-out'
              }}>
                {currentSong.coverUrl ? (
                  <img src={currentSong.coverUrl} alt={currentSong.title} style={{ width: '42px', height: '42px', borderRadius: '4px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '42px', height: '42px', borderRadius: '4px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={16} color="#fff" />
                  </div>
                )}
                <div style={{ flexGrow: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>{currentSong.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{currentSong.artist}</div>
                </div>
                <Volume2 size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No song active</div>
            )}
          </div>

          {/* Next Up Header & Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Next Up ({upcomingSongs.length})
            </span>
            {upcomingSongs.length > 0 && (
              <button 
                onClick={clearQueue}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                Clear Queue
              </button>
            )}
          </div>

          {/* Queue List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingSongs.length === 0 ? (
              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '40px 10px',
                border: '1px dashed rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.005)'
              }}>
                Queue is empty. Add songs to play next!
              </div>
            ) : (
              upcomingSongs.map((song, idx) => {
                const queueIndex = currentQueueIndex + 1 + idx;
                return (
                  <div 
                    key={`${song.id}-${idx}`}
                    className={`song-row staggered-row ${dragOverIndex === idx ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedIndex(idx);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== idx) {
                        setDragOverIndex(idx);
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== idx) {
                        reorderQueue(currentQueueIndex + 1 + draggedIndex, currentQueueIndex + 1 + idx);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: dragOverIndex === idx 
                        ? 'rgba(6, 182, 212, 0.15)' 
                        : draggedIndex === idx 
                          ? 'rgba(255, 255, 255, 0.02)' 
                          : 'rgba(255, 255, 255, 0.005)',
                      border: dragOverIndex === idx
                        ? '1px dashed var(--accent-primary)'
                        : '1px solid rgba(255, 255, 255, 0.01)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'grab',
                      opacity: draggedIndex === idx ? 0.5 : 1,
                      animationDelay: `${idx * 20}ms`,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => playTrack(song, playQueue.slice(queueIndex))}
                  >
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'rgba(255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={12} color="var(--text-secondary)" />
                      </div>
                    )}
                    <div style={{ flexGrow: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{song.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{song.artist}</div>
                    </div>

                    {/* Actions */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(queueIndex);
                      }}
                      className="icon-btn hover-danger"
                      title="Remove from queue"
                      style={{ padding: '6px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Mode 2: SYNCHRONIZED SCROLLING LYRICS */}
      {mode === 'lyrics' && (
        <>
          {/* Sync Timing Offset controls */}
          {lyrics.length > 0 && !lyricsLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '10px',
              padding: '8px 12px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sync Calibration:</span>
              <button 
                onClick={() => setLyricsOffset(prev => prev - 0.5)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '2px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
                title="Delay lyrics by 0.5s"
              >
                -0.5s
              </button>
              <span style={{ 
                fontSize: '11px', 
                color: lyricsOffset !== 0 ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: 700,
                minWidth: '45px',
                textAlign: 'center'
              }}>
                {lyricsOffset > 0 ? `+${lyricsOffset.toFixed(1)}s` : `${lyricsOffset.toFixed(1)}s`}
              </span>
              <button 
                onClick={() => setLyricsOffset(prev => prev + 0.5)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '2px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
                title="Advance lyrics by 0.5s"
              >
                +0.5s
              </button>
              {lyricsOffset !== 0 && (
                <button 
                  onClick={() => setLyricsOffset(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '50%'
                  }}
                  title="Reset sync offset"
                >
                  <RotateCcw size={11} />
                </button>
              )}
            </div>
          )}

          <div 
            ref={lyricsContainerRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              overflowY: 'auto',
              flexGrow: 1,
              padding: '20px 0',
              scrollBehavior: 'smooth'
            }}
          >
            {lyricsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '60px', flexGrow: 1 }}>
                <div className="spinner" style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '3px solid rgba(255, 255, 255, 0.05)',
                  borderTopColor: 'var(--accent-primary)',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Searching lyrics database...</div>
              </div>
            ) : lyrics.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '60px', padding: '0 20px' }}>
                No lyrics found for this track.
              </div>
            ) : (
              lyrics.map((line, index) => {
                const isActive = index === activeLyricIndex;
                return (
                  <div
                    key={index}
                    id={`lyric-line-${index}`}
                    className="lyric-line-hover"
                    style={{
                      fontSize: isActive ? '18px' : '14px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      textShadow: isActive ? '0 0 10px rgba(6, 182, 212, 0.4)' : 'none',
                      lineHeight: '1.6',
                      textAlign: 'center',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      seek(line.time);
                    }}
                    title={`Jump to ${line.time}s`}
                  >
                    {line.text}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RightDrawer;
