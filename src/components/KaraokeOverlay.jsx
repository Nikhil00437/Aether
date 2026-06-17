import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, Minimize2, Music, RotateCcw } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

const ActiveLyricLine = ({ line, nextLine, currentTime, lyricsOffset }) => {
  const words = line.text.split(' ');
  const wordRefs = useRef([]);
  const [ballPosition, setBallPosition] = useState({ left: 0, top: 0, opacity: 0 });
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  const lineDuration = nextLine ? (nextLine.time - line.time) : 4.5;
  const lineElapsedTime = currentTime - (line.time + lyricsOffset);
  const wordDuration = Math.max(0.1, lineDuration / words.length);

  useEffect(() => {
    wordRefs.current = wordRefs.current.slice(0, words.length);
  }, [words]);

  useEffect(() => {
    const currentIdx = Math.max(0, Math.min(words.length - 1, Math.floor(lineElapsedTime / wordDuration)));
    setActiveWordIndex(currentIdx);

    const activeSpan = wordRefs.current[currentIdx];
    if (activeSpan) {
      const parent = activeSpan.parentElement;
      if (parent) {
        const spanRect = activeSpan.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        
        const targetLeft = spanRect.left - parentRect.left + spanRect.width / 2;
        const wordProgress = Math.max(0, Math.min(1, (lineElapsedTime % wordDuration) / wordDuration));
        const bounceHeight = -16 * wordProgress * (1 - wordProgress);

        setBallPosition({
          left: targetLeft,
          top: bounceHeight - 8,
          opacity: 1
        });
      }
    }
  }, [currentTime, lineElapsedTime, wordDuration, words.length]);

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'center',
      padding: '8px 16px',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.03)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        position: 'absolute',
        left: `${ballPosition.left}px`,
        top: `${ballPosition.top}px`,
        transform: 'translateX(-50%)',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--accent-secondary)',
        boxShadow: 'var(--accent-glow)',
        opacity: ballPosition.opacity,
        transition: 'left 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)',
        pointerEvents: 'none',
        zIndex: 5
      }} />

      {words.map((word, idx) => {
        const isActive = idx === activeWordIndex;
        return (
          <span
            key={idx}
            ref={el => wordRefs.current[idx] = el}
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.35)',
              textShadow: isActive ? '0 0 15px rgba(6, 182, 212, 0.6)' : 'none',
              transition: 'color 0.2s ease',
              display: 'inline-block'
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const KaraokeOverlayContent = ({ audioContext }) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    favorites = [],
    togglePlay,
    nextTrack,
    prevTrack,
    toggleFavorite,
    setIsKaraokeMode,
    lyrics = [],
    lyricsLoading = false,
    seek,
    lyricsOffset = 0,
    setLyricsOffset,
    analyserRef
  } = audioContext;

  const canvasRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const [hoverLine, setHoverLine] = useState(null);

  const safeLyrics = lyrics || [];
  const safeFavorites = favorites || [];

  // Active lyric index calculation
  const activeLyricIndex = safeLyrics.findIndex((line, index) => {
    if (!line) return false;
    const nextLine = safeLyrics[index + 1];
    const currentLineTime = (line.time || 0) + lyricsOffset;
    const nextLineTime = nextLine ? (nextLine.time || 0) + lyricsOffset : null;
    return currentTime >= currentLineTime && (!nextLineTime || currentTime < nextLineTime);
  });

  // Scroll active lyric smoothly into view
  useEffect(() => {
    if (activeLyricIndex !== -1 && lyricsContainerRef.current) {
      const activeEl = document.getElementById(`karaoke-lyric-${activeLyricIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex]);

  // Audio Reactive Orbital Halo Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId;

    const render = () => {
      animId = requestAnimationFrame(render);
      const analyser = analyserRef?.current;
      if (!analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const innerRadius = 130; // 260px cover art diameter

      // Extract colors dynamically from CSS variables
      const accentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#06b6d4';
      const accentSecondary = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#6366f1';

      const barsCount = 64;
      for (let i = 0; i < barsCount; i++) {
        const dataIndex = Math.floor((i / barsCount) * bufferLength * 0.5);
        const value = dataArray[dataIndex] || 0;
        const percent = value / 255;
        const barHeight = Math.max(2, percent * 50); // Up to 50px bars

        const angle = (i / barsCount) * 2 * Math.PI;
        const x1 = cx + innerRadius * Math.cos(angle);
        const y1 = cy + innerRadius * Math.sin(angle);
        const x2 = cx + (innerRadius + barHeight) * Math.cos(angle);
        const y2 = cy + (innerRadius + barHeight) * Math.sin(angle);

        // Gradient for bars
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, accentPrimary);
        grad.addColorStop(1, accentSecondary);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    if (isPlaying) {
      render();
    } else {
      // Resting visualizer state (gentle circle glow)
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const innerRadius = 130;
      const accentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#06b6d4';

      ctx.strokeStyle = accentPrimary;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius + 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, analyserRef]);

  const isFavorited = currentSong && safeFavorites.includes(currentSong.id);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(10, 10, 12, 0.96)',
      backdropFilter: 'blur(20px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      opacity: 1,
      animation: 'fadeInContentLocal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      {/* Blurred Backdrop Cover */}
      {currentSong && currentSong.coverUrl && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${currentSong.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(100px) saturate(1.8)',
          opacity: 0.18,
          zIndex: 0,
          pointerEvents: 'none'
        }} />
      )}

      {/* Top Header controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 32px',
        zIndex: 2,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-primary)' }}>
            Cinematic Karaoke View
          </span>
          {currentSong && (
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Now Playing: {currentSong.title}
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsKaraokeMode(false)}
          className="icon-btn"
          style={{
            padding: '10px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          title="Exit Fullscreen"
        >
          <Minimize2 size={20} />
        </button>
      </div>

      {/* Main Grid View */}
      <div className="karaoke-layout" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        padding: '0 48px 48px 48px',
        overflow: 'hidden',
        zIndex: 1,
        gap: '48px',
        height: 'calc(100vh - 200px)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Left Side: Artwork and Halo Visualizer */}
        <div className="karaoke-left-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          height: '100%',
          minWidth: '380px'
        }}>
          {/* Orbital Spectrum Canvas */}
          <canvas 
            ref={canvasRef} 
            width={380} 
            height={380} 
            style={{
              position: 'absolute',
              zIndex: 0,
              filter: 'drop-shadow(0 0 15px var(--accent-primary))'
            }}
          />

          {/* Spinning artwork */}
          <div style={{
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6), var(--accent-glow)',
            zIndex: 1,
            animation: isPlaying ? 'spin-artwork 20s linear infinite' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {currentSong && currentSong.coverUrl ? (
              <img 
                src={currentSong.coverUrl} 
                alt="" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={80} color="#fff" />
              </div>
            )}
          </div>

          {/* Metadata Display Below Card */}
          {currentSong && (
            <div style={{ marginTop: '36px', textAlign: 'center', zIndex: 1 }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>{currentSong.title}</h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>{currentSong.artist}</p>
            </div>
          )}
        </div>

        {/* Right Side: Centered scrolling lyrics */}
        <div 
          ref={lyricsContainerRef}
          className="karaoke-right-panel hide-scrollbar"
          style={{
            flex: 1.2,
            height: '100%',
            overflowY: 'auto',
            paddingRight: '12px',
            scrollBehavior: 'smooth',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)'
          }}
        >
          <div style={{ height: '35%' }} />
          
          {lyricsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', height: '100%' }}>
              <div className="spinner" style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '4px solid rgba(255, 255, 255, 0.05)',
                borderTopColor: 'var(--accent-primary)',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading synchronized lyrics...</div>
            </div>
          ) : safeLyrics.length === 0 ? (
            <div style={{ fontSize: '18px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 20px', lineHeight: '1.6' }}>
              No synced lyrics available for this song. 
              <br />
              Open the Lyrics sidebar panel to search or import lyrics.
            </div>
          ) : (
            safeLyrics.map((line, index) => {
              if (!line) return null;
              const isActive = index === activeLyricIndex;
              const isHovered = hoverLine === index;

              if (isActive) {
                return (
                  <div
                    key={index}
                    id={`karaoke-lyric-${index}`}
                    onClick={() => seek(line.time)}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    <ActiveLyricLine
                      line={line}
                      nextLine={safeLyrics[index + 1]}
                      currentTime={currentTime}
                      lyricsOffset={lyricsOffset}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  id={`karaoke-lyric-${index}`}
                  onMouseEnter={() => setHoverLine(index)}
                  onMouseLeave={() => setHoverLine(null)}
                  onClick={() => seek(line.time)}
                  style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    color: isHovered 
                      ? '#fff' 
                      : 'rgba(255, 255, 255, 0.35)',
                    lineHeight: '1.4',
                    textAlign: 'left',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  title={`Jump to ${line.time}s`}
                >
                  {line.text}
                </div>
              );
            })
          )}
          
          <div style={{ height: '35%' }} />
        </div>
      </div>

      {/* Floating HUD Playback Controls at Bottom */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 32px 32px 32px',
        zIndex: 2,
        flexShrink: 0,
        gap: '12px'
      }}>
        {/* Sync Calibration Controls */}
        {safeLyrics.length > 0 && !lyricsLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'rgba(23, 23, 23, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            animation: 'fadeInContentLocal 0.3s ease forwards'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sync Calibration:</span>
            <button 
              onClick={() => setLyricsOffset(prev => prev - 0.5)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
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
                border: '1px solid rgba(255,255,255,0.1)',
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
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '12px 28px',
          borderRadius: '30px',
          background: 'rgba(23, 23, 23, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}>
          <button 
            onClick={prevTrack} 
            className="icon-btn" 
            style={{ padding: '8px' }}
            title="Previous Track"
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            onClick={togglePlay} 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: 'var(--accent-glow)'
            }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
          </button>

          <button 
            onClick={nextTrack} 
            className="icon-btn" 
            style={{ padding: '8px' }}
            title="Next Track"
          >
            <SkipForward size={20} />
          </button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

          <button 
            onClick={() => currentSong && toggleFavorite(currentSong.id)} 
            className={`icon-btn ${isFavorited ? 'active' : ''}`}
            style={{ padding: '8px' }}
            title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Styles for visualizer and spinners */}
      <style>{`
        @keyframes spin-artwork {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInContentLocal {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .karaoke-layout {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
          padding: 0 48px 48px 48px;
          overflow: hidden;
          z-index: 1;
          gap: 48px;
          height: calc(100vh - 200px);
          width: 100%;
          box-sizing: border-box;
        }
        .karaoke-left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          height: 100%;
          min-width: 380px;
        }
        .karaoke-right-panel {
          flex: 1.2;
          height: 100%;
          overflow-y: auto;
          padding-right: 12px;
          scroll-behavior: smooth;
          display: flex;
          flex-direction: column;
          gap: 24px;
          mask-image: linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 768px) {
          .karaoke-layout {
            flex-direction: column;
            overflow-y: auto;
            height: calc(100vh - 220px);
            gap: 24px;
            padding: 16px;
          }
          .karaoke-left-panel {
            min-width: 100% !important;
            height: auto !important;
            flex-shrink: 0;
          }
          .karaoke-right-panel {
            height: 300px !important;
            flex-shrink: 0;
            mask-image: none !important;
            -webkit-mask-image: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const KaraokeOverlay = () => {
  const audioContext = useAudio();
  if (!audioContext) return null;

  const { isKaraokeMode } = audioContext;
  if (!isKaraokeMode) return null;

  try {
    return <KaraokeOverlayContent audioContext={audioContext} />;
  } catch (err) {
    console.error("Error in KaraokeOverlay rendering:", err);
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        color: '#ff4d4d',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Karaoke Mode Error</h2>
        <p>{err.message}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
          Reload Page
        </button>
      </div>
    );
  }
};

export default KaraokeOverlay;
