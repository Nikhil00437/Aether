import React, { useEffect, useState } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Heart, Music, SlidersHorizontal, Mic2, ListMusic, Clock, Activity, Maximize2, Keyboard
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import CanvasVisualizer from './CanvasVisualizer';

const WAVEFORM_HEIGHTS = [
  25, 40, 60, 35, 20, 45, 75, 50, 30, 65, 80, 55, 40, 70, 85, 60, 35, 50, 65, 40, 
  30, 55, 75, 45, 60, 80, 50, 35, 70, 85, 60, 40, 55, 65, 30, 45, 50, 35, 20, 30
];

const PlayerBar = ({ onOpenHelp }) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    favorites,
    shuffle,
    repeat,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    adjustVolume,
    toggleMute,
    toggleFavorite,
    toggleShuffle,
    toggleRepeat,
    eqPreset,
    applyEqPreset,
    eqGains,
    setManualEqGain,
    reverbPreset,
    applyReverbPreset,
    crossfadeDuration,
    setCrossfadeDuration,
    sleepTimer,
    startSleepTimer,
    theme,
    setTheme,
    visualizerMode,
    cycleVisualizerMode,
    activeAudioRef,
    showQueue,
    toggleQueue,
    showLyrics,
    toggleLyrics,
    isNormalized,
    toggleNormalization,
    isKaraokeMode,
    setIsKaraokeMode,
    autoMoodRing,
    setAutoMoodRing
  } = useAudio();

  const [localSeekTime, setLocalSeekTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEqDropdownOpen, setIsEqDropdownOpen] = useState(false);
  const [isSleepDropdownOpen, setIsSleepDropdownOpen] = useState(false);
  const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
  
  // Waveform seek tooltip hover states
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);

  const waveformRef = React.useRef(null);

  // 60fps RequestAnimationFrame progress tracker
  useEffect(() => {
    let animId;
    const updateProgress = () => {
      const audio = activeAudioRef.current;
      if (audio && isPlaying && !isDragging && duration > 0) {
        const percent = (audio.currentTime / duration) * 100;
        if (waveformRef.current) {
          waveformRef.current.style.setProperty('--seek-progress', `${percent.toFixed(3)}%`);
        }
      }
      animId = requestAnimationFrame(updateProgress);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(updateProgress);
    } else {
      const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
      if (waveformRef.current) {
        waveformRef.current.style.setProperty('--seek-progress', `${percent.toFixed(3)}%`);
      }
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isDragging, duration, currentTime, activeAudioRef]);

  // Sync static seek updates (track swaps, clicks)
  useEffect(() => {
    if (!isDragging && duration > 0 && waveformRef.current) {
      const percent = (currentTime / duration) * 100;
      waveformRef.current.style.setProperty('--seek-progress', `${percent.toFixed(3)}%`);
    }
  }, [currentTime, duration, isDragging]);

  // Keep track of seek bar changes
  useEffect(() => {
    if (!isDragging) {
      setLocalSeekTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e) => {
    const val = parseFloat(e.target.value);
    setLocalSeekTime(val);
    if (duration > 0 && waveformRef.current) {
      const percent = (val / duration) * 100;
      waveformRef.current.style.setProperty('--seek-progress', `${percent.toFixed(3)}%`);
    }
  };

  const handleSeekMouseUp = () => {
    setIsDragging(false);
    seek(localSeekTime);
  };

  const handleSeekMouseDown = () => {
    setIsDragging(true);
  };

  const handleSeekMouseMove = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(pct * duration);
    setHoverX(x);
  };

  const handleSeekMouseLeave = () => {
    setHoverTime(null);
  };

  const handleVolumeChange = (e) => {
    adjustVolume(parseFloat(e.target.value));
  };

  // Magnetic hover offset calculations
  const handleMagneticMouseMove = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    const pullX = Math.max(-8, Math.min(8, x * 0.35));
    const pullY = Math.max(-8, Math.min(8, y * 0.35));
    
    if (btn.classList.contains('player-play-btn')) {
      btn.style.transform = `translate3d(${pullX}px, ${pullY}px, 0) scale(1.08)`;
    } else {
      btn.style.transform = `translate3d(${pullX}px, ${pullY}px, 0) scale(1.06)`;
    }
  };

  const handleMagneticMouseLeave = (e) => {
    const btn = e.currentTarget;
    btn.style.transform = 'translate3d(0, 0, 0) scale(1)';
  };

  const isFavorited = currentSong && favorites.includes(currentSong.id);
  const progressPercent = duration > 0 ? (localSeekTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  // Choose volume icon based on level
  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={18} />;
    if (volume < 0.4) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <div className="player-bar">
      {/* Current Song Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {currentSong ? (
          <>
            <div style={{ position: 'relative', width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {/* Circular Visualizer Halo */}
              {(visualizerMode === 'orbit' || visualizerMode === 'both') && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                  <CanvasVisualizer type="orbit" />
                </div>
              )}
              {/* Cover Art Box */}
              <div 
                className={isPlaying ? "beat-pulse-scale beat-pulse-glow" : ""} 
                style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '50%', 
                  flexShrink: 0, 
                  overflow: 'hidden',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
                  zIndex: 2,
                  border: '2px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {currentSong.coverUrl ? (
                  <img 
                    src={currentSong.coverUrl} 
                    alt={currentSong.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                    <Music size={18} color="#fff" />
                  </div>
                )}
              </div>
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '160px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{currentSong.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{currentSong.artist}</div>
            </div>
            <button 
              onClick={() => toggleFavorite(currentSong.id)}
              className={`icon-btn ${isFavorited ? 'active' : ''}`}
              style={{ padding: '6px' }}
              onMouseMove={handleMagneticMouseMove}
              onMouseLeave={handleMagneticMouseLeave}
            >
              <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          </>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No track selected</div>
        )}
      </div>

      {/* Playback Controls & Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={toggleShuffle} 
            className={`icon-btn ${shuffle ? 'active' : ''}`}
            title="Shuffle"
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <Shuffle size={16} />
          </button>
          
          <button 
            onClick={prevTrack} 
            className="icon-btn" 
            title="Previous"
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <SkipBack size={18} fill="currentColor" />
          </button>
          
          <button 
            onClick={togglePlay} 
            className="player-play-btn"
            title={isPlaying ? 'Pause' : 'Play'}
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: '2px' }} />}
          </button>
          
          <button 
            onClick={nextTrack} 
            className="icon-btn" 
            title="Next"
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
          
          <button 
            onClick={toggleRepeat} 
            className={`icon-btn ${repeat !== 'none' ? 'active' : ''}`}
            title={`Repeat Mode: ${repeat === 'none' ? 'Off' : repeat === 'all' ? 'Repeat All' : 'Repeat One'}`}
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Progress Bar (Waveform Seek Bar & Tooltip) */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', minWidth: '30px', textAlign: 'right' }}>
            {formatTime(localSeekTime)}
          </span>
          <div 
            ref={waveformRef}
            className="slider-fill-wrapper waveform-container"
            onMouseMove={handleSeekMouseMove}
            onMouseLeave={handleSeekMouseLeave}
            onWheel={(e) => {
              if (duration > 0) {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 5 : -5;
                seek(Math.min(duration, Math.max(0, currentTime + delta)));
              }
            }}
            style={{ position: 'relative', flexGrow: 1, height: '24px', display: 'flex', alignItems: 'center' }}
          >
            {/* Waveform Bars Container */}
            <div style={{ position: 'relative', width: '100%', height: '18px', pointerEvents: 'none' }}>
              {/* Inactive Background Waveform Bars */}
              <div className="waveform-bars background-bars" style={{ display: 'flex', alignItems: 'end', gap: '2px', width: '100%', height: '100%', opacity: 0.15 }}>
                {WAVEFORM_HEIGHTS.map((h, idx) => (
                  <div 
                    key={idx} 
                    className="waveform-bar"
                    style={{ 
                      height: `${h}%`, 
                      flexGrow: 1, 
                      backgroundColor: '#fff',
                      borderRadius: '1px'
                    }} 
                  />
                ))}
              </div>

              {/* Active Foreground Waveform Bars (Clipped) */}
              <div 
                className="waveform-bars active-bars" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'end', 
                  gap: '2px', 
                  width: '100%', 
                  height: '100%', 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  clipPath: 'inset(0 calc(100% - var(--seek-progress, 0%)) 0 0)',
                  transition: 'clip-path 0.05s linear'
                }}
              >
                {WAVEFORM_HEIGHTS.map((h, idx) => (
                  <div 
                    key={idx} 
                    className="waveform-bar active"
                    style={{ 
                      height: `${h}%`, 
                      flexGrow: 1, 
                      background: 'var(--accent-gradient)',
                      borderRadius: '1px',
                      boxShadow: '0 0 6px rgba(var(--accent-primary-rgb), 0.5)'
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Native range input overlayed on top, styled to be invisible */}
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={localSeekTime}
              onChange={handleSeekChange}
              onMouseDown={handleSeekMouseDown}
              onMouseUp={handleSeekMouseUp}
              className="custom-slider waveform-slider-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                margin: 0,
                cursor: 'pointer',
                zIndex: 5
              }}
            />

            {/* Hover Tooltip */}
            {hoverTime !== null && (
              <div 
                className="waveform-tooltip glass-panel"
                style={{
                  position: 'absolute',
                  bottom: '28px',
                  left: `${hoverX}px`,
                  transform: 'translateX(-50%)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  pointerEvents: 'none',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), var(--accent-glow)'
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', minWidth: '30px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Extra Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', position: 'relative', width: '100%' }}>
        
        {/* GROUP 1: Audio Enhancements */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {/* EQ Custom Dropdown Panel (Sound Lab) */}
          <div 
            style={{ position: 'relative', flexShrink: 0 }}
            onMouseLeave={() => setIsEqDropdownOpen(false)}
          >
            <button
              onClick={() => setIsEqDropdownOpen(!isEqDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '4px 10px 4px 8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              title="Sound Lab (EQ, Reverb & Crossfade)"
            >
              <SlidersHorizontal size={12} style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 2px var(--accent-primary))' }} />
              <span>Sound Lab</span>
            </button>

            {isEqDropdownOpen && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%) translateY(-8px)',
                background: 'rgba(18, 18, 22, 0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                width: '260px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6), var(--accent-glow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                zIndex: 1000,
                animation: 'slideUpToast 0.2s ease forwards'
              }}>
                {/* EQ Presets */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    EQ Presets ({eqPreset})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {['Flat', 'Bass Boost', 'Treble Boost', 'Vocal', 'Acoustic', 'Chill'].map((preset) => {
                      const isActive = eqPreset === preset;
                      return (
                        <button
                          key={preset}
                          onClick={() => applyEqPreset(preset)}
                          style={{
                            background: isActive ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.03)',
                            border: 'none',
                            color: '#fff',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'var(--transition-smooth)',
                            boxShadow: isActive ? 'var(--accent-glow)' : 'none'
                          }}
                        >
                          {preset.replace(' Boost', '')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Manual EQ Sliders */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Manual EQ Calibration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['bass', 'mid', 'treble'].map((band) => (
                      <div key={band} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'capitalize', width: '40px' }}>
                          {band}
                        </span>
                        <div className="slider-fill-wrapper" style={{ flexGrow: 1 }}>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="1"
                            value={eqGains[band]}
                            onChange={(e) => setManualEqGain(band, parseInt(e.target.value, 10))}
                            className="custom-slider"
                            style={{ height: '3px' }}
                          />
                          <div 
                            className="slider-track-fill" 
                            style={{ 
                              left: '50%', 
                              width: `${Math.abs(eqGains[band]) / 24 * 100}%`,
                              transform: eqGains[band] < 0 ? 'translateX(-100%)' : 'none',
                              height: '3px'
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', width: '25px', textAlign: 'right' }}>
                          {eqGains[band] > 0 ? `+${eqGains[band]}` : eqGains[band]}dB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reverb Presets */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Spatial Reverb
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                    {['Off', 'Room', 'Hall', 'Cathedral'].map((preset) => {
                      const isActive = reverbPreset === preset;
                      return (
                        <button
                          key={preset}
                          onClick={() => applyReverbPreset(preset)}
                          style={{
                            background: isActive ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.03)',
                            border: 'none',
                            color: '#fff',
                            padding: '5px 2px',
                            borderRadius: '6px',
                            fontSize: '9px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'var(--transition-smooth)',
                            boxShadow: isActive ? 'var(--accent-glow)' : 'none'
                          }}
                        >
                          {preset === 'Concert Hall' ? 'Hall' : preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Crossfade Duration */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Crossfade Transition
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {crossfadeDuration}s
                    </span>
                  </div>
                  <div className="slider-fill-wrapper">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={crossfadeDuration}
                      onChange={(e) => setCrossfadeDuration(parseInt(e.target.value, 10))}
                      className="custom-slider"
                      style={{ height: '3px' }}
                    />
                    <div 
                      className="slider-track-fill" 
                      style={{ width: `${crossfadeDuration / 5 * 100}%`, height: '3px' }} 
                    />
                  </div>
                </div>

                {/* Volume Normalization */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Volume Normalizer
                  </span>
                  <label className="switch-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isNormalized}
                      onChange={(e) => toggleNormalization(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '28px',
                      height: '16px',
                      background: isNormalized ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      position: 'relative',
                      transition: 'background-color 0.2s ease',
                      boxShadow: isNormalized ? 'var(--accent-glow)' : 'none'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        background: '#fff',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: isNormalized ? '14px' : '2px',
                        transition: 'left 0.2s ease'
                      }} />
                    </div>
                  </label>
                </div>

                {/* Interface Theme Accent */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Interface Theme Accent
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[
                      { name: 'Aether Dynamic', color: 'conic-gradient(#06b6d4, #ec4899, #10b981, #f59e0b, #06b6d4)', isDynamic: true },
                      { name: 'Aether Cyan', color: '#06b6d4' },
                      { name: 'Cyberpunk Magenta', color: '#ec4899' },
                      { name: 'Auroral Green', color: '#10b981' },
                      { name: 'Sunset Amber', color: '#f59e0b' }
                    ].map((t) => (
                      <button
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        style={{
                          flexGrow: 1,
                          height: '18px',
                          borderRadius: '9px',
                          background: t.color,
                          border: theme === t.name ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.15)',
                          cursor: 'pointer',
                          padding: 0,
                          boxShadow: theme === t.name ? `0 0 8px ${t.isDynamic ? '#06b6d4' : t.color}` : 'none',
                          transition: 'var(--transition-smooth)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={t.name}
                      >
                        {theme === t.name && (
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Smart Mood Ring Auto-Theme Switch */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Smart Mood Ring
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      Auto-theme shifts on music energy
                    </span>
                  </div>
                  <label className="switch-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={autoMoodRing}
                      onChange={(e) => setAutoMoodRing(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '28px',
                      height: '16px',
                      background: autoMoodRing ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      position: 'relative',
                      transition: 'background-color 0.2s ease',
                      boxShadow: autoMoodRing ? 'var(--accent-glow)' : 'none'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        background: '#fff',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: autoMoodRing ? '14px' : '2px',
                        transition: 'left 0.2s ease'
                      }} />
                    </div>
                  </label>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 }} />

        {/* GROUP 2: Canvas Visualizer (Dynamic module) */}
        {(visualizerMode === 'linear' || visualizerMode === 'both') && (
          <>
            <div style={{ flexShrink: 0, padding: '0 4px' }}>
              <CanvasVisualizer type="linear" />
            </div>
            {/* Divider */}
            <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 }} />
          </>
        )}

        {/* GROUP 3: Playback Utilities & Overlays */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Visualizer Mode Toggle */}
          <button 
            onClick={cycleVisualizerMode} 
            className={`icon-btn ${visualizerMode !== 'linear' ? 'active' : ''}`}
            title={`Visualizer Mode: ${visualizerMode === 'linear' ? 'Linear Bar' : visualizerMode === 'orbit' ? 'Radial Halo' : 'Double Spectrum'}`}
            style={{ padding: '6px', flexShrink: 0 }}
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <Activity size={16} />
          </button>

          {/* Keyboard Shortcuts Help */}
          <button 
            onClick={onOpenHelp} 
            className="icon-btn"
            title="Keyboard Shortcuts Cheat Sheet"
            style={{ padding: '6px', flexShrink: 0 }}
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <Keyboard size={16} />
          </button>

          {/* Sleep Timer */}
          <div 
            style={{ position: 'relative', flexShrink: 0 }}
            onMouseLeave={() => setIsSleepDropdownOpen(false)}
          >
            <button
              onClick={() => setIsSleepDropdownOpen(!isSleepDropdownOpen)}
              className={`icon-btn ${sleepTimer !== null ? 'active' : ''}`}
              title={sleepTimer !== null ? `Sleep Timer: ${Math.floor(sleepTimer / 60)}m ${sleepTimer % 60}s remaining` : "Sleep Timer"}
              style={{ padding: '6px' }}
              onMouseMove={handleMagneticMouseMove}
              onMouseLeave={handleMagneticMouseLeave}
            >
              <Clock size={16} />
              {sleepTimer !== null && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  fontSize: '8px',
                  background: 'var(--accent-primary)',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: '6px',
                  padding: '1px 3px',
                  boxShadow: '0 0 5px var(--accent-primary)'
                }}>
                  {Math.ceil(sleepTimer / 60)}m
                </span>
              )}
            </button>

            {isSleepDropdownOpen && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%) translateY(-8px)',
                background: 'rgba(18, 18, 22, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '6px',
                width: '120px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5), var(--accent-glow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 1000,
                animation: 'slideUpToast 0.2s ease forwards'
              }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase' }}>
                  Stop Music In
                </div>
                {[
                  { label: 'Off', value: 0 },
                  { label: '5 Minutes', value: 5 },
                  { label: '15 Minutes', value: 15 },
                  { label: '30 Minutes', value: 30 },
                  { label: '45 Minutes', value: 45 },
                  { label: '60 Minutes', value: 60 }
                ].map((opt) => {
                  const isActive = (opt.value === 0 && sleepTimer === null) || (opt.value !== 0 && sleepTimer !== null && Math.round(sleepTimer / 60) === opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        startSleepTimer(opt.value);
                        setIsSleepDropdownOpen(false);
                      }}
                      style={{
                        background: isActive ? 'var(--accent-gradient)' : 'transparent',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Karaoke Mode Toggle */}
          <button 
            onClick={() => setIsKaraokeMode(!isKaraokeMode)} 
            className={`icon-btn ${isKaraokeMode ? 'active' : ''}`}
            title="Karaoke Mode (Fullscreen Cinematic)"
            style={{ padding: '6px', flexShrink: 0 }}
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <Maximize2 size={16} style={{ color: isKaraokeMode ? 'var(--accent-primary)' : 'inherit' }} />
          </button>

          {/* Lyrics Toggle */}
          <button 
            onClick={toggleLyrics} 
            className={`icon-btn ${showLyrics ? 'active' : ''}`}
            title="Synced Lyrics"
            style={{ padding: '6px', flexShrink: 0 }}
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <Mic2 size={16} />
          </button>

          {/* Queue Toggle */}
          <button 
            onClick={toggleQueue} 
            className={`icon-btn ${showQueue ? 'active' : ''}`}
            title="Play Queue"
            style={{ padding: '6px', flexShrink: 0 }}
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <ListMusic size={16} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 }} />

        {/* GROUP 4: Volume Controls */}
        <div 
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.05 : -0.05;
            adjustVolume(Math.min(1, Math.max(0, volume + delta)));
          }}
          onMouseEnter={() => setShowVolumeTooltip(true)}
          onMouseLeave={() => setShowVolumeTooltip(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '130px', flexShrink: 0, position: 'relative' }}
        >
          {showVolumeTooltip && (
            <div 
              style={{
                position: 'absolute',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(18, 18, 22, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), var(--accent-glow)'
              }}
            >
              {Math.round(volumePercent)}%
            </div>
          )}
          <button 
            onClick={toggleMute} 
            className="icon-btn" 
            style={{ padding: '6px', flexShrink: 0 }} 
            title="Mute/Unmute"
            onMouseMove={handleMagneticMouseMove}
            onMouseLeave={handleMagneticMouseLeave}
          >
            <VolumeIcon />
          </button>
          <div className="slider-fill-wrapper" style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="custom-slider"
              style={{ width: '100%' }}
            />
            <div className="slider-track-fill" style={{ width: `${volumePercent}%` }} />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PlayerBar;
