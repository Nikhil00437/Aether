import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Play, Pause, Heart, Music, Sparkles, ListMusic, Trash2, ListPlus, Shuffle, RotateCcw, Flame, X, Plus, ArrowUpDown } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import PlaylistCover from './PlaylistCover';

const VinylDeck = () => {
  const { currentSong, isPlaying, currentTime, duration, seek } = useAudio();
  const vinylRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const dragStartAngle = useRef(0);
  const dragStartTime = useRef(0);
  const baseRotation = useRef(0);

  // We want to update baseRotation automatically while playing normally
  useEffect(() => {
    if (isPlaying && !isScratching) {
      const interval = setInterval(() => {
        baseRotation.current = (baseRotation.current + 3) % 360;
        if (vinylRef.current) {
          vinylRef.current.style.transform = `rotate(${baseRotation.current}deg)`;
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isPlaying, isScratching]);

  const handleMouseDown = (e) => {
    if (!currentSong) return;
    setIsScratching(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    dragStartAngle.current = Math.atan2(dy, dx) * (180 / Math.PI);
    dragStartTime.current = currentTime;
  };

  const handleMouseMove = (e) => {
    if (!isScratching || !currentSong) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    let deltaAngle = currentAngle - dragStartAngle.current;
    // Handle wrap-around
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    // 360 degrees = 24 seconds seek time
    const timeDelta = (deltaAngle / 360) * 24;
    let targetTime = dragStartTime.current + timeDelta;
    if (targetTime < 0) targetTime = 0;
    if (targetTime > duration) targetTime = duration;

    seek(targetTime);

    // Apply rotation visually
    const visualRotation = (baseRotation.current + deltaAngle) % 360;
    if (vinylRef.current) {
      vinylRef.current.style.transform = `rotate(${visualRotation}deg)`;
    }
  };

  const handleMouseUp = () => {
    if (isScratching) {
      setIsScratching(false);
      // Read current rotation from style to update baseRotation
      if (vinylRef.current) {
        const matrix = window.getComputedStyle(vinylRef.current).transform;
        if (matrix && matrix !== 'none') {
          const values = matrix.split('(')[1].split(')')[0].split(',');
          const a = parseFloat(values[0]);
          const b = parseFloat(values[1]);
          const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
          baseRotation.current = angle >= 0 ? angle : angle + 360;
        }
      }
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      minHeight: '320px',
      overflow: 'hidden'
    }}>
      {/* Turntable Platter Base */}
      <div style={{
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: '#18181b',
        border: '6px solid #27272a',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.5), var(--accent-glow)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}>
        {/* Vinyl Record */}
        <div
          ref={vinylRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: '210px',
            height: '210px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #2d3748 0%, #1a202c 40%, #0d0d0d 100%)',
            boxShadow: '0 0 10px rgba(0,0,0,0.6)',
            cursor: currentSong ? (isScratching ? 'grabbing' : 'grab') : 'not-allowed',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isScratching ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Groove Rings */}
          <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'absolute', inset: '25px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'absolute', inset: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'absolute', inset: '55px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'absolute', inset: '70px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)' }} />

          {/* Center Record Label */}
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: '#fff',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '2px solid #000',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)'
          }}>
            {currentSong && currentSong.coverUrl ? (
              <img
                src={currentSong.coverUrl}
                alt="Record Label"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable="false"
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Music size={24} color="#fff" />
              </div>
            )}
            
            {/* Center Spindle Hole */}
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#090a0f',
              border: '1px solid #718096',
              position: 'absolute'
            }} />
          </div>
        </div>

        {/* Tone Arm Base */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: '#4a5568',
          border: '3px solid #718096',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          zIndex: 20
        }} />

        {/* Tone Arm Stylus Needle */}
        <svg
          style={{
            position: 'absolute',
            top: '32px',
            right: '32px',
            width: '100px',
            height: '150px',
            pointerEvents: 'none',
            zIndex: 15,
            transformOrigin: 'top right',
            transform: isPlaying ? 'rotate(24deg)' : 'rotate(0deg)',
            transition: isScratching ? 'none' : 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
          viewBox="0 0 100 150"
        >
          {/* Metallic arm path */}
          <path
            d="M 90 10 L 70 80 L 25 110 L 20 125"
            fill="none"
            stroke="#a0aec0"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 90 10 L 70 80 L 25 110 L 20 125"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Needle cartridge */}
          <rect
            x="12"
            y="120"
            width="12"
            height="18"
            rx="1"
            fill="#e53e3e"
            transform="rotate(15, 18, 129)"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />
          {/* Accent light on cartridge */}
          <circle cx="18" cy="125" r="1.5" fill="#319795" />
        </svg>
      </div>

      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', textAlign: 'center' }}>
        {currentSong ? '🖱️ Drag/spin the vinyl record to scratch & seek!' : 'No track loaded'}
      </span>
    </div>
  );
};

const CompanionHabitat = () => {
  const { currentSong, isPlaying, activeAccessories, setActiveAccessories, streak, totalMinutes } = useAudio();

  const isHatUnlocked = streak >= 1;
  const isVisorUnlocked = totalMinutes >= 5;
  const isSynthUnlocked = totalMinutes >= 15;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="title-large">Aethy's Habitat</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Hang out with Aethy, customize their look, and watch them vibe to your music!
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Virtual Room Card */}
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          minHeight: '360px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Room Neon Outlines */}
          <div style={{
            position: 'absolute',
            inset: '12px',
            border: '1px dashed rgba(6, 182, 212, 0.15)',
            borderRadius: '12px',
            pointerEvents: 'none'
          }} />
          
          {/* Window Scene */}
          <div style={{
            position: 'absolute',
            top: '40px',
            width: '120px',
            height: '80px',
            borderRadius: '6px',
            background: 'linear-gradient(to bottom, #1e1b4b, #311042)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Stars inside window */}
            <div style={{ fontSize: '8px', color: '#fff', opacity: 0.5, animation: 'pulse 3s infinite' }}>✦ ✦  ✦</div>
          </div>

          {/* Table/Stand for Chibi */}
          <div style={{
            position: 'absolute',
            bottom: '60px',
            width: '180px',
            height: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderTop: '2px solid var(--accent-primary)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }} />

          {/* Large Chibi Rendering */}
          <div style={{
            zIndex: 10,
            transform: 'scale(3.2) translateY(-14px)',
            transformOrigin: 'bottom center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80px',
            width: '80px'
          }}>
            <svg
              width="32"
              height="36"
              viewBox="0 0 32 36"
              style={{
                width: '32px',
                height: '36px',
                overflow: 'visible',
                transformOrigin: 'bottom center',
                animation: isPlaying 
                  ? 'chibi-headbang 0.6s ease-in-out infinite' 
                  : 'chibi-room-idle 3s ease-in-out infinite'
              }}
            >
              <style>{`
                @keyframes chibi-headbang {
                  0%, 100% { transform: translateY(0) scaleY(1) rotate(0); }
                  25% { transform: translateY(1px) scaleY(0.95) rotate(-2deg); }
                  50% { transform: translateY(-4px) scaleY(1.02) rotate(0); }
                  75% { transform: translateY(1px) scaleY(0.95) rotate(2deg); }
                }
                @keyframes chibi-room-idle {
                  0%, 100% { transform: translateY(0px) scaleY(1); }
                  50% { transform: translateY(-2px) scaleY(0.98); }
                }
                @keyframes text-sleep {
                  0% { transform: translate(0, 0) scale(0.7); opacity: 0; }
                  50% { transform: translate(10px, -15px) scale(1.1); opacity: 0.8; }
                  100% { transform: translate(15px, -30px) scale(0.8); opacity: 0; }
                }
              `}</style>
              
              {/* Hoodie Body */}
              <path d="M 10 24 C 7 28, 7 34, 10 34 C 11 34, 21 34, 22 34 C 25 34, 25 28, 22 24 Z" fill="var(--accent-primary)" />
              {/* Pocket */}
              <path d="M 12 28.5 L 20 28.5 C 19 31.5, 13 31.5, 12 28.5" fill="rgba(255, 255, 255, 0.12)" />
              {/* Cute Heart Logo */}
              <path d="M 16 30.5 L 15.3 29.8 C 14.5 29, 13.8 28.5, 14.8 27.5 C 15.3 27, 16 27.5, 16 27.5 C 16 27.5, 16.7 27, 17.2 27.5 C 18.2 28.5, 17.5 29, 16.7 29.8 Z" fill="rgba(255, 255, 255, 0.4)" />

              {/* Outer Hood */}
              <path d="M 16 7 C 9.5 7, 7.5 12.5, 7.5 17 C 7.5 23.5, 24.5 23.5, 24.5 17 C 24.5 12.5, 22.5 7, 16 7 Z" fill="#121316" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
              {/* Inner Hood Screen */}
              <path d="M 16 9 C 11.2 9.2, 8.8 12.8, 8.8 17 C 8.8 21.8, 23.2 21.8, 23.2 17 C 23.2 12.8, 20.8 9.2, 16 9 Z" fill="#0a0a0d" />

              {/* Cyber headphones */}
              <path d="M 8 17 C 8 8, 24 8, 24 17" fill="none" stroke="#26272c" strokeWidth="2.5" />
              <path d="M 8 17 C 8 8, 24 8, 24 17" fill="none" stroke="var(--accent-secondary)" strokeWidth="0.8" style={{ opacity: 0.8 }} />
              <circle cx="7.5" cy="17" r="2.8" fill="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 3px var(--accent-primary))' }} />
              <circle cx="24.5" cy="17" r="2.8" fill="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 3px var(--accent-primary))' }} />

              {/* Cat Ears */}
              <polygon points="9,9.5 5.5,5 11,8" fill="#121316" />
              <polygon points="9.2,9.2 6.5,5.8 10.5,8" fill="var(--accent-secondary)" />
              <polygon points="23,9.5 26.5,5 21,8" fill="#121316" />
              <polygon points="22.8,9.2 25.5,5.8 21.5,8" fill="var(--accent-secondary)" />

              {/* Wizard Hat Accessory */}
              {activeAccessories.wizardHat && (
                <g id="room-wizard-hat">
                  <path d="M 8 8 L 24 8 L 19 -4 Z" fill="#6d28d9" stroke="#7c3aed" strokeWidth="0.5" />
                  <ellipse cx="16" cy="8.5" rx="10" ry="2.2" fill="#5b21b6" />
                  <path d="M 18 -1 L 18.5 0.5 L 20 0.5 L 18.8 1.5 L 19.2 3 L 18 2.1 L 16.8 3 L 17.2 1.5 L 16 0.5 L 17.5 0.5 Z" fill="#fbbf24" />
                </g>
              )}

              {/* Digital Face */}
              {isPlaying ? (
                <g>
                  <path d="M 11 15 Q 12.5 13.5 14 15" fill="none" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M 18 15 Q 19.5 13.5 21 15" fill="none" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  <line x1="11" y1="16" x2="14" y2="16" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="18" y1="16" x2="21" y2="16" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round" />
                </g>
              )}

              {/* Cyber Visor */}
              {activeAccessories.cyberVisor && (
                <g id="room-cyber-visor">
                  <path d="M 6.5 13.5 L 25.5 13.5 L 24.2 19 L 7.8 19 Z" fill="rgba(244, 63, 94, 0.68)" stroke="#f43f5e" strokeWidth="1.2" style={{ filter: 'drop-shadow(0 0 4px #f43f5e)' }} />
                  <path d="M 8 15 L 24 15" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.8" />
                </g>
              )}

              <ellipse cx="10.8" cy="18" rx="1.3" ry="0.6" fill="rgba(236, 72, 153, 0.45)" />
              <ellipse cx="21.2" cy="18" rx="1.3" ry="0.6" fill="rgba(236, 72, 153, 0.45)" />
              
              <path d="M 14.5 18 Q 16 19.4 17.5 18" fill="none" stroke="var(--accent-primary)" strokeWidth="1" strokeLinecap="round" />

              {/* Hands */}
              <circle cx="6" cy="26.5" r="1.8" fill="var(--accent-primary)" />
              <circle cx="26" cy="26.5" r="1.8" fill="var(--accent-primary)" />

              {/* Synth Deck */}
              {activeAccessories.synthDeck && (
                <g id="room-synth-deck">
                  <rect x="2" y="34.5" width="28" height="6.5" rx="1.5" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
                  <line x1="5" y1="36.5" x2="5" y2="39" stroke="#34d399" strokeWidth="1" />
                  <line x1="8" y1="36.5" x2="8" y2="39" stroke="#34d399" strokeWidth="1" />
                  <line x1="11" y1="36.5" x2="11" y2="39" stroke="#34d399" strokeWidth="1" />
                  <line x1="14" y1="36.5" x2="14" y2="39" stroke="#34d399" strokeWidth="1" />
                  <line x1="17" y1="36.5" x2="17" y2="39" stroke="#34d399" strokeWidth="1" />
                  <line x1="20" y1="36.5" x2="20" y2="39" stroke="#34d399" strokeWidth="1" />
                  <line x1="23" y1="36.5" x2="23" y2="39" stroke="#34d399" strokeWidth="1" />
                  <line x1="26" y1="36.5" x2="26" y2="39" stroke="#34d399" strokeWidth="1" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-1.5; 0,0" dur="2s" repeatCount="indefinite" />
                </g>
              )}
            </svg>
          </div>

          {/* Snooze/Music bubbles */}
          {!isPlaying ? (
            <>
              <div style={{ position: 'absolute', bottom: '130px', left: '170px', fontSize: '14px', fontWeight: 800, color: 'var(--accent-primary)', animation: 'text-sleep 3s infinite', animationDelay: '0s' }}>Z</div>
              <div style={{ position: 'absolute', bottom: '140px', left: '175px', fontSize: '11px', fontWeight: 800, color: 'var(--accent-secondary)', animation: 'text-sleep 3s infinite', animationDelay: '1.2s' }}>z</div>
              <div style={{ position: 'absolute', bottom: '150px', left: '170px', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', animation: 'text-sleep 3s infinite', animationDelay: '2.4s' }}>z</div>
            </>
          ) : (
            <>
              <div style={{ position: 'absolute', bottom: '140px', left: '180px', fontSize: '16px', color: 'var(--accent-primary)', animation: 'text-sleep 2s infinite', animationDelay: '0s' }}>♪</div>
              <div style={{ position: 'absolute', bottom: '130px', left: '130px', fontSize: '16px', color: 'var(--accent-secondary)', animation: 'text-sleep 2.5s infinite', animationDelay: '0.8s' }}>♫</div>
            </>
          )}

          {/* Vibe Status Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isPlaying ? '#10b981' : '#f59e0b',
              display: 'inline-block',
              boxShadow: isPlaying ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
            }} />
            <span>{isPlaying ? `Vibing to: ${currentSong ? currentSong.title : 'Music'}` : 'Sleeping (Idle)'}</span>
          </div>
        </div>

        {/* Wardrobe customization Card */}
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 className="title-medium" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Wardrobe Customization</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* 1. Wizard Hat */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>Wizard Hat</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isHatUnlocked ? '✓ Unlocked!' : 'Requires a Listening Streak of 1 day'}
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isHatUnlocked}
                checked={activeAccessories.wizardHat}
                onChange={(e) => setActiveAccessories(prev => ({ ...prev, wizardHat: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: isHatUnlocked ? 'pointer' : 'not-allowed'
                }}
              />
            </div>

            {/* 2. Cyber Visor */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>Cyber Visor</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isVisorUnlocked ? '✓ Unlocked!' : `Requires 5 minutes total listening time (current: ${totalMinutes}m)`}
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isVisorUnlocked}
                checked={activeAccessories.cyberVisor}
                onChange={(e) => setActiveAccessories(prev => ({ ...prev, cyberVisor: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: isVisorUnlocked ? 'pointer' : 'not-allowed'
                }}
              />
            </div>

            {/* 3. Synth Deck */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>Floating Synth Deck</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isSynthUnlocked ? '✓ Unlocked!' : `Requires 15 minutes total listening time (current: ${totalMinutes}m)`}
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isSynthUnlocked}
                checked={activeAccessories.synthDeck}
                onChange={(e) => setActiveAccessories(prev => ({ ...prev, synthDeck: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: isSynthUnlocked ? 'pointer' : 'not-allowed'
                }}
              />
            </div>

          </div>

          <div style={{
            marginTop: 'auto',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            lineHeight: '1.5'
          }}>
            🌟 <strong>Streak & Listening Tips:</strong> Keep listening to tracks to increase your total listening time and maintain your streak! Your stats update automatically in the background.
          </div>
        </div>
      </div>
    </div>
  );
};

const MainContent = ({ activeTab, setActiveTab }) => {
  const {
    songs,
    isDemoMode,
    currentSong,
    isPlaying,
    favorites,
    playCounts,
    recentlyPlayed,
    playlists,
    deletePlaylist,
    removeSongFromPlaylist,
    addToQueue,
    createPlaylist,
    addSongToPlaylist,
    showToast,
    shuffle,
    toggleShuffle,
    playTrack,
    togglePlay,
    toggleFavorite,
    activeAccessories,
    setActiveAccessories,
    currentTime,
    duration,
    seek
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [localFilterQuery, setLocalFilterQuery] = useState('');
  const [sortField, setSortField] = useState(null); // 'title', 'album', 'duration'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'
  const [playlistDropdown, setPlaylistDropdown] = useState(null); // { x, y, song }

  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('aether-listening-streak');
    if (saved) return parseInt(saved, 10);
    return Object.values(playCounts).some(count => count > 0) ? 1 : 0;
  });

  useEffect(() => {
    localStorage.setItem('aether-listening-streak', streak.toString());
  }, [streak]);

  useEffect(() => {
    if (recentlyPlayed.length > 0 && streak === 0) {
      setStreak(1);
    }
  }, [recentlyPlayed, streak]);

  useEffect(() => {
    setLocalFilterQuery('');
    setSortField(null);
    setSortDirection('asc');
    setPlaylistDropdown(null);
  }, [activeTab]);

  useEffect(() => {
    const closeMenus = () => {
      setContextMenu(null);
      setPlaylistDropdown(null);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  const handleContextMenu = (e, song) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      song: song
    });
  };

  // Calculate listening stats
  const totalSeconds = Object.keys(playCounts).reduce((acc, id) => {
    const song = songs.find(s => s.id === id);
    return acc + (playCounts[id] || 0) * (song ? song.duration : 180);
  }, 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const artistCounts = {};
  Object.keys(playCounts).forEach(id => {
    const song = songs.find(s => s.id === id);
    if (song && song.artist) {
      artistCounts[song.artist] = (artistCounts[song.artist] || 0) + playCounts[id];
    }
  });
  let topArtist = 'None yet';
  let maxArtistCount = 0;
  Object.keys(artistCounts).forEach(artist => {
    if (artistCounts[artist] > maxArtistCount) {
      maxArtistCount = artistCounts[artist];
      topArtist = artist;
    }
  });

  let topSong = 'None yet';
  let maxSongCount = 0;
  Object.keys(playCounts).forEach(id => {
    if (playCounts[id] > maxSongCount) {
      maxSongCount = playCounts[id];
      const song = songs.find(s => s.id === id);
      if (song) {
        topSong = song.title;
      }
    }
  });
  
  const CHUNK_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [activeTab]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (visibleCount < displaySongs.length) {
        setVisibleCount(prev => Math.min(prev + CHUNK_SIZE, displaySongs.length));
      }
    }
  };

  // Time-of-day greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter songs based on search query
  const filteredSongs = songs.filter(song => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album.toLowerCase().includes(query)
    );
  });

  // Get favorites list
  const favoriteSongs = songs.filter(song => favorites.includes(song.id));

  // Determine which list to display
  let displaySongs = [];
  let viewTitle = '';
  let showHeaderImage = false;
  let activePlaylist = null;

  if (activeTab === 'library') {
    displaySongs = songs;
    viewTitle = 'All Songs';
  } else if (activeTab === 'favorites') {
    displaySongs = favoriteSongs;
    viewTitle = 'Your Favorites';
    showHeaderImage = true;
  } else if (activeTab === 'recent') {
    displaySongs = recentlyPlayed;
    viewTitle = 'Recently Played';
    showHeaderImage = true;
  } else if (activeTab === 'repeat') {
    displaySongs = [...songs]
      .filter(s => (playCounts[s.id] || 0) > 0)
      .sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
      .slice(0, 10);
    viewTitle = 'On Repeat';
    showHeaderImage = true;
  } else if (activeTab === 'search') {
    displaySongs = searchQuery ? filteredSongs : songs.slice(0, 8);
    viewTitle = searchQuery ? `Search Results for "${searchQuery}"` : 'Recommended Tracks';
  } else if (activeTab.startsWith('playlist-')) {
    activePlaylist = playlists.find(p => p.id === activeTab);
    if (activePlaylist) {
      displaySongs = activePlaylist.songIds
        .map(id => songs.find(s => s.id === id))
        .filter(Boolean);
      viewTitle = activePlaylist.name;
      showHeaderImage = true;
    }
  }

  // Apply local filtering to the display songs
  let filteredDisplaySongs = displaySongs;
  if (localFilterQuery && activeTab !== 'search' && activeTab !== 'home') {
    const query = localFilterQuery.toLowerCase();
    filteredDisplaySongs = displaySongs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      (song.album || '').toLowerCase().includes(query)
    );
  }

  // Apply column sorting to the filtered display songs
  if (sortField) {
    filteredDisplaySongs = [...filteredDisplaySongs].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (typeof aVal === 'string') {
        const strCompare = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? strCompare : -strCompare;
      } else {
        // numeric comparison
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
  }

  // Handle playing a song from the list
  const handlePlayClick = (song, list) => {
    if (currentSong && currentSong.id === song.id) {
      togglePlay();
    } else {
      playTrack(song, list);
    }
  };

  const handleHeaderSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render Song Table
  const renderSongTable = (songsList) => {
    if (songsList.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '15px' }}>
            {activeTab === 'favorites' 
              ? "No favorite tracks yet. Click the heart icon on any song to save it here!" 
              : activeTab.startsWith('playlist-')
                ? "This playlist is empty. Drag and drop songs from 'All Songs' in the sidebar here!"
                : "No songs match your search."}
          </div>
        </div>
      );
    }

    const renderSortIcon = (field) => {
      if (sortField !== field) return <ArrowUpDown size={11} style={{ marginLeft: '4px', opacity: 0.35 }} />;
      return sortDirection === 'asc' 
        ? <span style={{ color: 'var(--accent-primary)', fontSize: '10px', marginLeft: '4px' }}>▲</span>
        : <span style={{ color: 'var(--accent-primary)', fontSize: '10px', marginLeft: '4px' }}>▼</span>;
    };

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <th style={{ padding: '8px 12px', width: '50px', fontWeight: 500 }}>#</th>
            <th 
              onClick={() => handleHeaderSort('title')} 
              style={{ padding: '8px 12px', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Title {renderSortIcon('title')}
              </div>
            </th>
            <th 
              onClick={() => handleHeaderSort('album')} 
              style={{ padding: '8px 12px', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Album {renderSortIcon('album')}
              </div>
            </th>
            <th 
              onClick={() => handleHeaderSort('duration')} 
              style={{ padding: '8px 12px', width: '70px', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Clock size={16} /> {renderSortIcon('duration')}
              </div>
            </th>
            <th style={{ padding: '8px 12px', width: '110px' }}></th>
          </tr>
        </thead>
        <tbody>
          {songsList.map((song, index) => {
            const isCurrent = currentSong && currentSong.id === song.id;
            const isFav = favorites.includes(song.id);
            return (
              <tr 
                key={song.id} 
                className="song-row staggered-row-3d"
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', song.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onContextMenu={(e) => handleContextMenu(e, song)}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  transition: 'var(--transition-smooth)',
                  cursor: 'grab',
                  borderRadius: '6px',
                  animationDelay: `${Math.min(index * 30, 300)}ms`
                }}
                onClick={() => handlePlayClick(song, songsList)}
              >
                {/* Index / Play Hover */}
                <td className="row-index" style={{ padding: '14px 12px', color: isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '14px', position: 'relative' }}>
                  <span className="index-number">{index + 1}</span>
                  <span className="row-play-btn" style={{ display: 'none', position: 'absolute', left: '10px', top: '14px' }}>
                    {isCurrent && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </span>
                </td>
                
                {/* Title & Artist */}
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '4px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={16} color="#fff" style={{ margin: 'auto' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {song.title}
                      </span>
                      <span className="text-small" style={{ marginTop: '2px' }}>{song.artist}</span>
                    </div>
                  </div>
                </td>

                {/* Album */}
                <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {song.album}
                </td>

                {/* Duration */}
                <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {formatDuration(song.duration)}
                </td>

                {/* Action Buttons */}
                <td style={{ padding: '10px 12px' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={() => toggleFavorite(song.id)}
                      className={`icon-btn ${isFav ? 'active' : ''}`}
                      style={{ opacity: isFav ? 1 : 0 }}
                      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPlaylistDropdown({
                          x: rect.left,
                          y: rect.bottom + window.scrollY,
                          song: song
                        });
                      }}
                      className="icon-btn"
                      style={{ opacity: 0 }}
                      title="Add to Playlist"
                    >
                      <Plus size={15} />
                    </button>
                    <button 
                      onClick={() => addToQueue(song)}
                      className="icon-btn"
                      style={{ opacity: 0 }}
                      title="Play Next"
                    >
                      <ListPlus size={15} />
                    </button>
                    {activePlaylist && (
                      <button 
                        onClick={() => removeSongFromPlaylist(activePlaylist.id, song.id)}
                        className="icon-btn hover-danger"
                        title="Remove from Playlist"
                        style={{ opacity: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // Search Actions: Play and Save Playlist
  const handlePlaySearchResults = () => {
    if (filteredSongs.length === 0) return;
    const isPlayingFromSearch = currentSong && filteredSongs.some(s => s.id === currentSong.id);
    if (isPlayingFromSearch) {
      togglePlay();
    } else {
      playTrack(filteredSongs[0], filteredSongs);
    }
  };

  const handleSaveSearchAsPlaylist = () => {
    if (!searchQuery || filteredSongs.length === 0) return;
    const cleanName = searchQuery
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    const newPlaylist = createPlaylist(cleanName);
    if (newPlaylist) {
      filteredSongs.forEach(song => {
        addSongToPlaylist(newPlaylist.id, song.id);
      });
      showToast(`Saved ${filteredSongs.length} songs to "${cleanName}"`);
      setActiveTab(newPlaylist.id);
    }
  };

  // Playlist/Library Actions: Play List and Shuffle List
  const isPlayingFromCurrentList = currentSong && displaySongs.some(s => s.id === currentSong.id);

  const handlePlayListClick = () => {
    if (displaySongs.length === 0) return;
    if (isPlayingFromCurrentList) {
      togglePlay();
    } else {
      playTrack(displaySongs[0], displaySongs);
    }
  };

  const handleShufflePlayClick = () => {
    if (displaySongs.length === 0) return;
    if (!shuffle) {
      toggleShuffle();
    }
    const randomIndex = Math.floor(Math.random() * displaySongs.length);
    playTrack(displaySongs[randomIndex], displaySongs);
  };



  return (
    <main className="main-view main-view-animate" key={activeTab} onScroll={handleScroll}>
      
      {/* 1. HOME VIEW */}
      {activeTab === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Main Grid Wrapper */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
            
            {/* Left Column: Greeting, Stats, Welcome */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Greeting */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="title-large">{getGreeting()}</h2>
                {isDemoMode && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    color: 'var(--accent-primary)',
                    fontWeight: 600
                  }}>
                    <Sparkles size={14} />
                    <span>Demo Mode Active</span>
                  </div>
                )}
              </div>

              {/* Listening Stats Dashboard (Wrapped) */}
              <div className="wrapped-panel glass-panel" style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                  <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#fff' }}>
                    Aether Wrapped • Listening Stats
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', zIndex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>TIME LISTENED</span>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-primary)' }}>{totalMinutes} min</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>TOP SONG</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={topSong}>
                      {topSong}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>TOP ARTIST</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={topArtist}>
                      {topArtist}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE STREAK</span>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-secondary)' }}>{streak} {streak === 1 ? 'Day' : 'Days'} 🔥</span>
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  filter: 'blur(60px)',
                  opacity: 0.15,
                  pointerEvents: 'none'
                }} />
              </div>

              {/* Welcome Banner for Demo Mode */}
              {isDemoMode && (
                <div className="welcome-card" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div className="welcome-card-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Welcome to Aether Music! 🌌</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.6' }}>
                      We've populated some beautiful, royalty-free demo tracks so you can test the play, volume, seek, and favorites features immediately. 
                      When you are ready to stream your own songs, check out the guide in the sidebar panel.
                    </p>
                  </div>
                  <div style={{
                    position: 'absolute',
                    right: '-20px',
                    bottom: '-20px',
                    opacity: 0.05,
                    transform: 'rotate(-15deg)',
                    zIndex: 0
                  }}>
                    <Music size={180} />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Retro Vinyl Scratch Deck */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className="title-medium" style={{ margin: 0 }}>Retro Vinyl Deck</h3>
              <VinylDeck />
            </div>

          </div>

          {/* Quick Play Grid (Recently Played or Recommended) */}
          <div>
            <h3 className="title-medium" style={{ marginBottom: '16px' }}>
              {recentlyPlayed.length > 0 ? "Recently Played" : "Recommended for You"}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {(recentlyPlayed.length > 0 ? recentlyPlayed.slice(0, 6) : songs.slice(0, 6)).map((song, index) => {
                const isCurrent = currentSong && currentSong.id === song.id;
                const playCount = playCounts[song.id] || 0;
                return (
                  <div 
                    key={song.id} 
                    onClick={() => handlePlayClick(song, recentlyPlayed.length > 0 ? recentlyPlayed : songs)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                      animationDelay: `${index * 40}ms`
                    }}
                    className="quick-card staggered-row-3d"
                  >
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} style={{ width: '64px', height: '64px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={24} color="#fff" />
                      </div>
                    )}
                    <div style={{ padding: '0 16px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {song.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="text-small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</span>
                        {playCount > 0 && (
                          <span style={{ fontSize: '10px', color: 'var(--accent-primary)', background: 'rgba(6, 182, 212, 0.08)', padding: '1px 5px', borderRadius: '4px', fontWeight: 500 }}>
                            {playCount} {playCount === 1 ? 'play' : 'plays'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button style={{
                      marginRight: '16px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      opacity: 0,
                      transition: 'var(--transition-smooth)'
                    }} className="quick-card-play">
                      {isCurrent && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '1px' }} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggestions Shelf (Sorted by Play Count Descending) */}
          <div>
            <h3 className="title-medium" style={{ marginBottom: '16px' }}>
              {Object.values(playCounts).some(count => count > 0) ? "Your Heavy Rotation" : "Suggestions for You"}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
              {[...songs]
                .sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
                .slice(0, 4)
                .map((song, index) => {
                  const playCount = playCounts[song.id] || 0;
                  return (
                    <div key={song.id} className="song-card staggered-row-3d" onClick={() => handlePlayClick(song, songs)} style={{ animationDelay: `${index * 50}ms` }}>
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} className="song-card-image" />
                      ) : (
                        <div style={{
                          aspectRatio: 1,
                          borderRadius: '6px',
                          background: 'var(--accent-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                          marginBottom: '14px'
                        }}>
                          <Music size={40} color="#fff" />
                        </div>
                      )}
                      <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {song.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
                        <p className="text-small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {song.artist}
                        </p>
                        {playCount > 0 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                            {playCount}x
                          </span>
                        )}
                      </div>
                      <button className="song-card-play-btn">
                        {currentSong && currentSong.id === song.id && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* COMPANION VIEW */}
      {activeTab === 'companion' && <CompanionHabitat />}

      {/* 2. SEARCH VIEW */}
      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 className="title-large">Search</h2>
          
          {/* Search Bar Input */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Search size={20} />
            </span>
            <input 
              type="text" 
              placeholder="What do you want to listen to?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 14px 14px 48px',
                fontSize: '15px',
                borderRadius: '30px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                outline: 'none',
                transition: 'var(--transition-smooth)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', marginBottom: '16px' }}>
              <h3 className="title-medium" style={{ margin: 0 }}>{viewTitle}</h3>
              {searchQuery && filteredSongs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Play Results Button */}
                  <button
                    onClick={handlePlaySearchResults}
                    style={{
                      padding: '8px 18px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '20px',
                      border: 'none',
                      background: 'var(--accent-gradient)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'var(--transition-smooth)',
                      boxShadow: 'var(--accent-glow)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {currentSong && filteredSongs.some(s => s.id === currentSong.id) && isPlaying ? (
                      <>
                        <Pause size={14} fill="currentColor" />
                        <span>Pause Results</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" style={{ marginLeft: '1px' }} />
                        <span>Play Results</span>
                      </>
                    )}
                  </button>

                  {/* Save as Playlist Button */}
                  <button
                    onClick={handleSaveSearchAsPlaylist}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '20px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                  >
                    <ListMusic size={14} />
                    <span>Save as Playlist</span>
                  </button>
                </div>
              )}
            </div>
            {renderSongTable(displaySongs.slice(0, visibleCount))}
          </div>
        </div>
      )}

      {/* 3. ALL SONGS (LIBRARY), FAVORITES, OR CUSTOM PLAYLIST VIEW */}
      {(activeTab === 'library' || activeTab === 'favorites' || activeTab === 'recent' || activeTab === 'repeat' || activeTab.startsWith('playlist-')) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Jumbotron Style */}
          {showHeaderImage ? (
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '24px',
              padding: '24px 0',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {activePlaylist ? (
                    <PlaylistCover playlist={activePlaylist} size={120} songs={songs} />
                  ) : activeTab === 'favorites' ? (
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
                    }}>
                      <Heart size={54} color="#fff" fill="#fff" />
                    </div>
                  ) : activeTab === 'recent' ? (
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '12px',
                      background: 'var(--accent-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--accent-glow)'
                    }}>
                      <RotateCcw size={54} color="#fff" />
                    </div>
                  ) : activeTab === 'repeat' ? (
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '12px',
                      background: 'var(--accent-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--accent-glow)'
                    }}>
                      <Flame size={54} color="#fff" />
                    </div>
                  ) : null}
                </div>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    {activePlaylist ? 'Playlist' : 'System Playlist'}
                  </span>
                  <h2 style={{ fontSize: '48px', fontWeight: 800, margin: '4px 0' }}>{viewTitle}</h2>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {displaySongs.length} {displaySongs.length === 1 ? 'song' : 'songs'}
                  </span>
                </div>
              </div>

              {activePlaylist && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete the playlist "${activePlaylist.name}"?`)) {
                      deletePlaylist(activePlaylist.id);
                      setActiveTab('home');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  Delete Playlist
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="title-large">{viewTitle}</h2>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {songs.length} {songs.length === 1 ? 'song' : 'songs'} total
              </span>
            </div>
          )}

          {/* Action Bar with Play & Shuffle Buttons + Inline Search */}
          {displaySongs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 0', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Play / Pause Playlist */}
                <button
                  onClick={handlePlayListClick}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: 'var(--accent-glow)',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Play"
                >
                  {isPlayingFromCurrentList && isPlaying ? (
                    <Pause size={24} fill="currentColor" />
                  ) : (
                    <Play size={24} fill="currentColor" style={{ marginLeft: '2px' }} />
                  )}
                </button>

                {/* Shuffle Play Playlist */}
                <button
                  onClick={handleShufflePlayClick}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: shuffle ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: shuffle ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: shuffle ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    if (!shuffle) e.currentTarget.style.borderColor = 'var(--border-color-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    if (!shuffle) e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                  title="Shuffle Play"
                >
                  <Shuffle size={18} />
                </button>
              </div>

              {/* Inline Search Filter Input */}
              <div style={{ position: 'relative', width: '220px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Filter songs..."
                  value={localFilterQuery}
                  onChange={(e) => setLocalFilterQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 30px',
                    fontSize: '13px',
                    borderRadius: '18px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#fff',
                    outline: 'none',
                    transition: 'var(--transition-smooth)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                {localFilterQuery && (
                  <button
                    onClick={() => setLocalFilterQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {renderSongTable(filteredDisplaySongs.slice(0, visibleCount))}
        </div>
      )}

      {/* Right-Click Custom Context Menu */}
      {contextMenu && (
        <div 
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            background: 'rgba(23, 23, 23, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '4px',
            zIndex: 9999,
            width: '200px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), var(--accent-glow)',
            animation: 'scale-up-context-menu 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="context-menu-item"
            onClick={() => {
              playTrack(contextMenu.song, songs);
              setContextMenu(null);
            }}
          >
            <Play size={14} style={{ marginRight: '8px' }} />
            Play Song
          </button>
          <button 
            className="context-menu-item"
            onClick={() => {
              addToQueue(contextMenu.song);
              setContextMenu(null);
            }}
          >
            <ListPlus size={14} style={{ marginRight: '8px' }} />
            Play Next
          </button>
          <button 
            className="context-menu-item"
            onClick={() => {
              toggleFavorite(contextMenu.song.id);
              setContextMenu(null);
            }}
          >
            <Heart size={14} style={{ marginRight: '8px' }} />
            {favorites.includes(contextMenu.song.id) ? 'Remove Favorite' : 'Add Favorite'}
          </button>
          
          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '4px 0' }} />
          
          <div className="context-menu-submenu-trigger" style={{ position: 'relative' }}>
            <button className="context-menu-item" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ListMusic size={14} style={{ marginRight: '8px' }} />
                Add to Playlist
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▶</span>
            </button>
            
            <div className="context-menu-submenu">
              {playlists.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No playlists. Create one in the sidebar!
                </div>
              ) : (
                playlists.map(pl => (
                  <button
                    key={pl.id}
                    className="context-menu-item"
                    onClick={() => {
                      addSongToPlaylist(pl.id, contextMenu.song.id);
                      setContextMenu(null);
                    }}
                  >
                    {pl.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Playlist Selector Dropdown */}
      {playlistDropdown && (
        <div 
          style={{
            position: 'absolute',
            top: `${playlistDropdown.y}px`,
            left: `${playlistDropdown.x}px`,
            background: 'rgba(23, 23, 23, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '4px',
            zIndex: 9999,
            width: '180px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), var(--accent-glow)',
            animation: 'scale-up-context-menu 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, padding: '6px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '4px' }}>
            Add to Playlist
          </div>
          {playlists.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No playlists found.
            </div>
          ) : (
            playlists.map(pl => (
              <button
                key={pl.id}
                className="context-menu-item"
                onClick={() => {
                  addSongToPlaylist(pl.id, playlistDropdown.song.id);
                  setPlaylistDropdown(null);
                }}
              >
                {pl.name}
              </button>
            ))
          )}
        </div>
      )}

      {/* CSS overrides for song row hover features */}
      <style>{`
        .song-row:hover {
          background-color: rgba(255, 255, 255, 0.04);
        }
        .song-row:hover .index-number {
          display: none;
        }
        .song-row:hover .row-play-btn {
          display: inline !important;
        }
        .song-row:hover .icon-btn {
          opacity: 1 !important;
        }
        .quick-card:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          border-color: var(--border-color-hover) !important;
        }
        .quick-card:hover .quick-card-play {
          opacity: 1 !important;
          transform: scale(1.05);
        }
        .song-row:active {
          cursor: grabbing;
        }
        .hover-danger:hover {
          color: #ef4444 !important;
        }
        .context-menu-item {
          width: 100%;
          background: none;
          border: none;
          color: var(--text-primary);
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          transition: background-color 0.15s ease;
        }
        .context-menu-item:hover {
          background-color: var(--accent-primary);
          color: #fff;
        }
        .context-menu-submenu-trigger:hover .context-menu-submenu {
          display: block !important;
        }
        .context-menu-submenu {
          display: none;
          position: absolute;
          left: 100%;
          top: 0;
          background: rgba(23, 23, 23, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 4px;
          min-width: 150px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        @keyframes scale-up-context-menu {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </main>
  );
};

export default MainContent;
