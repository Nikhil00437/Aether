import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';

const ChibiCompanion = ({ activeTab }) => {
  const [position, setPosition] = useState({ top: 0, opacity: 0 });
  const [chibiState, setChibiState] = useState('idle'); // 'idle', 'teleport-out', 'teleport-in'
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const audioContext = useAudio();
  const activeAccessories = audioContext?.activeAccessories || { wizardHat: false, cyberVisor: false, synthDeck: false };

  const prevTabRef = useRef(activeTab);
  const isInitialLoad = useRef(true);

  const updatePosition = (tabId, immediate = false) => {
    const activeEl = document.getElementById(`nav-item-${tabId}`);
    const sidebarEl = document.querySelector('.sidebar');
    
    if (activeEl && sidebarEl) {
      const activeRect = activeEl.getBoundingClientRect();
      const sidebarRect = sidebarEl.getBoundingClientRect();
      
      // Calculate relative Y inside the scrollable sidebar container
      const relativeY = activeRect.top - sidebarRect.top + sidebarEl.scrollTop;
      
      // Align vertically: active button height is activeRect.height, chibi is ~36px tall
      const targetY = relativeY + (activeRect.height / 2) - 18;
      
      if (immediate) {
        setPosition({ top: targetY, opacity: 1 });
      } else {
        setChibiState('teleport-out');
        
        setTimeout(() => {
          setPosition({ top: targetY, opacity: 1 });
          setChibiState('teleport-in');
          
          setTimeout(() => {
            setChibiState('idle');
          }, 450);
        }, 450);
      }
    }
  };

  useEffect(() => {
    // Initial mount position calculation
    const timer = setTimeout(() => {
      updatePosition(activeTab, true);
      isInitialLoad.current = false;
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialLoad.current && prevTabRef.current !== activeTab) {
      updatePosition(activeTab);
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const handleScrollOrResize = () => {
      // Re-align instantly on scroll/resize to prevent lag
      updatePosition(activeTab, true);
    };

    window.addEventListener('resize', handleScrollOrResize);
    const sidebarEl = document.querySelector('.sidebar');
    if (sidebarEl) {
      sidebarEl.addEventListener('scroll', handleScrollOrResize);
    }

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      if (sidebarEl) {
        sidebarEl.removeEventListener('scroll', handleScrollOrResize);
      }
    };
  }, [activeTab]);

  const renderPortal = () => {
    if (chibiState === 'idle') return null;
    
    const animationName = chibiState === 'teleport-out' ? 'portal-spin-out' : 'portal-spin-in';
    
    return (
      <svg
        width="48"
        height="18"
        viewBox="0 0 48 18"
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '-8px',
          pointerEvents: 'none',
          zIndex: 5,
          animation: `${animationName} 0.45s ease forwards`
        }}
      >
        <ellipse
          cx="24"
          cy="9"
          rx="18"
          ry="6"
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2.5"
          style={{
            filter: 'drop-shadow(0 0 8px var(--accent-primary))',
            strokeDasharray: '40, 15',
          }}
        />
        <ellipse
          cx="24"
          cy="9"
          rx="12"
          ry="4"
          fill="none"
          stroke="var(--accent-secondary)"
          strokeWidth="1.5"
          style={{
            filter: 'drop-shadow(0 0 4px var(--accent-secondary))'
          }}
        />
      </svg>
    );
  };

  const renderChibi = () => {
    let animationName = 'chibi-idle';
    let animationDuration = '2.2s';
    
    if (chibiState === 'teleport-out') {
      animationName = 'chibi-suck-in';
      animationDuration = '0.45s';
    } else if (chibiState === 'teleport-in') {
      animationName = 'chibi-spit-out';
      animationDuration = '0.45s';
    } else if (isClicked) {
      animationName = 'chibi-click-spin';
      animationDuration = '0.65s';
    }

    return (
      <svg
        width="32"
        height="36"
        viewBox="0 0 32 36"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (chibiState === 'idle' && !isClicked) {
            setIsClicked(true);
            setTimeout(() => setIsClicked(false), 650);
          }
        }}
        style={{
          width: '32px',
          height: '36px',
          cursor: 'pointer',
          transformOrigin: 'bottom center',
          animation: `${animationName} ${animationDuration} ${chibiState === 'idle' ? 'infinite' : '1'} ease-in-out forwards`,
          filter: isHovered ? 'drop-shadow(0 0 6px var(--accent-primary))' : 'none',
          transition: 'filter 0.2s ease',
          zIndex: 10,
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {/* Custom Styles */}
        <style>{`
          @keyframes portal-spin-out {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            30% { transform: scale(1.15) rotate(180deg); opacity: 1; }
            70% { transform: scale(1) rotate(360deg); opacity: 1; }
            100% { transform: scale(0) rotate(540deg); opacity: 0; }
          }
          @keyframes portal-spin-in {
            0% { transform: scale(0) rotate(540deg); opacity: 0; }
            30% { transform: scale(1.15) rotate(360deg); opacity: 1; }
            70% { transform: scale(1) rotate(180deg); opacity: 1; }
            100% { transform: scale(0) rotate(0deg); opacity: 0; }
          }
          @keyframes chibi-idle {
            0%, 100% { transform: translateY(0px) scaleY(1); }
            50% { transform: translateY(-3.5px) scaleY(0.96); }
          }
          @keyframes chibi-suck-in {
            0% { transform: scale(1) rotate(0deg) translateY(0); opacity: 1; filter: blur(0px); }
            100% { transform: scale(0) rotate(-360deg) translateY(4px); opacity: 0; filter: blur(2px); }
          }
          @keyframes chibi-spit-out {
            0% { transform: scale(0) rotate(360deg) translateY(4px); opacity: 0; filter: blur(2px); }
            65% { transform: scale(1.15) rotate(-15deg) translateY(-2px); opacity: 1; filter: blur(0px); }
            100% { transform: scale(1) rotate(0deg) translateY(0); opacity: 1; }
          }
          @keyframes chibi-click-spin {
            0% { transform: scale(1) rotate(0deg) translateY(0); }
            30% { transform: scale(1.1) rotate(90deg) translateY(-5px); }
            50% { transform: scale(1) rotate(180deg) translateY(-7px); }
            75% { transform: scale(1.05) rotate(270deg) translateY(-3px); }
            100% { transform: scale(1) rotate(360deg) translateY(0); }
          }
          @keyframes chibi-blink {
            0%, 95%, 100% { transform: scaleY(1); }
            97.5% { transform: scaleY(0.1); }
          }
          @keyframes chibi-wave-left {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-45deg) translateY(-1.5px); }
          }
          .chibi-hand-left {
            transform-origin: 9px 24px;
            animation: ${isHovered && chibiState === 'idle' ? 'chibi-wave-left 0.4s ease-in-out infinite' : 'none'};
          }
          .chibi-eyes-group {
            transform-origin: 16px 16.5px;
            animation: chibi-blink 3.8s infinite;
          }
        `}</style>

        {/* Hoodie Body (with Accent Color Gradient) */}
        <path 
          d="M 10 24 C 7 28, 7 34, 10 34 C 11 34, 21 34, 22 34 C 25 34, 25 28, 22 24 Z" 
          fill="var(--accent-primary)" 
        />
        {/* Hoodie Pocket */}
        <path 
          d="M 12 28.5 L 20 28.5 C 19 31.5, 13 31.5, 12 28.5" 
          fill="rgba(255, 255, 255, 0.12)" 
        />
        {/* Cute Heart Logo on Pocket */}
        <path 
          d="M 16 30.5 L 15.3 29.8 C 14.5 29, 13.8 28.5, 14.8 27.5 C 15.3 27, 16 27.5, 16 27.5 C 16 27.5, 16.7 27, 17.2 27.5 C 18.2 28.5, 17.5 29, 16.7 29.8 Z" 
          fill="rgba(255, 255, 255, 0.4)" 
        />

        {/* Outer Hood */}
        <path 
          d="M 16 7 C 9.5 7, 7.5 12.5, 7.5 17 C 7.5 23.5, 24.5 23.5, 24.5 17 C 24.5 12.5, 22.5 7, 16 7 Z" 
          fill="#121316" 
          stroke="rgba(255, 255, 255, 0.05)" 
          strokeWidth="0.5" 
        />
        {/* Inner Hood Screen */}
        <path 
          d="M 16 9 C 11.2 9.2, 8.8 12.8, 8.8 17 C 8.8 21.8, 23.2 21.8, 23.2 17 C 23.2 12.8, 20.8 9.2, 16 9 Z" 
          fill="#0a0a0d" 
        />

        {/* Cyber headphones */}
        {/* Headband */}
        <path 
          d="M 8 17 C 8 8, 24 8, 24 17" 
          fill="none" 
          stroke="#26272c" 
          strokeWidth="2.5" 
        />
        <path 
          d="M 8 17 C 8 8, 24 8, 24 17" 
          fill="none" 
          stroke="var(--accent-secondary)" 
          strokeWidth="0.8" 
          style={{ opacity: 0.8 }}
        />
        {/* Left Pad */}
        <circle 
          cx="7.5" 
          cy="17" 
          r="2.8" 
          fill="var(--accent-primary)" 
          style={{ filter: 'drop-shadow(0 0 3px var(--accent-primary))' }} 
        />
        {/* Right Pad */}
        <circle 
          cx="24.5" 
          cy="17" 
          r="2.8" 
          fill="var(--accent-primary)" 
          style={{ filter: 'drop-shadow(0 0 3px var(--accent-primary))' }} 
        />

        {/* Cat Ears on Hood */}
        {/* Left Ear */}
        <polygon points="9,9.5 5.5,5 11,8" fill="#121316" />
        <polygon points="9.2,9.2 6.5,5.8 10.5,8" fill="var(--accent-secondary)" />
        {/* Right Ear */}
        <polygon points="23,9.5 26.5,5 21,8" fill="#121316" />
        <polygon points="22.8,9.2 25.5,5.8 21.5,8" fill="var(--accent-secondary)" />

        {/* Wizard Hat Accessory */}
        {activeAccessories.wizardHat && (
          <g id="accessory-wizard-hat">
            {/* Cone */}
            <path d="M 8 8 L 24 8 L 19 -4 Z" fill="#6d28d9" stroke="#7c3aed" strokeWidth="0.5" />
            {/* Brim */}
            <ellipse cx="16" cy="8.5" rx="10" ry="2.2" fill="#5b21b6" />
            {/* Star */}
            <path d="M 18 -1 L 18.5 0.5 L 20 0.5 L 18.8 1.5 L 19.2 3 L 18 2.1 L 16.8 3 L 17.2 1.5 L 16 0.5 L 17.5 0.5 Z" fill="#fbbf24" />
          </g>
        )}

        {/* Neon Digital Face Details */}
        {/* Eyes (Blinking Group) */}
        <g className="chibi-eyes-group">
          <ellipse cx="12.5" cy="15.5" rx="1.6" ry="2.4" fill="var(--accent-primary)" />
          <ellipse cx="19.5" cy="15.5" rx="1.6" ry="2.4" fill="var(--accent-primary)" />
          {/* Sparkles */}
          <circle cx="13" cy="14.8" r="0.6" fill="#fff" />
          <circle cx="20" cy="14.8" r="0.6" fill="#fff" />
        </g>

        {/* Cyber Visor Accessory */}
        {activeAccessories.cyberVisor && (
          <g id="accessory-cyber-visor">
            <path d="M 6.5 13.5 L 25.5 13.5 L 24.2 19 L 7.8 19 Z" fill="rgba(244, 63, 94, 0.68)" stroke="#f43f5e" strokeWidth="1.2" style={{ filter: 'drop-shadow(0 0 4px #f43f5e)' }} />
            <path d="M 8 15 L 24 15" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.8" />
          </g>
        )}

        {/* Blushing cheeks */}
        <ellipse cx="10.8" cy="18" rx="1.3" ry="0.6" fill="rgba(236, 72, 153, 0.45)" style={{ filter: 'drop-shadow(0 0 2px rgba(236, 72, 153, 0.3))' }} />
        <ellipse cx="21.2" cy="18" rx="1.3" ry="0.6" fill="rgba(236, 72, 153, 0.45)" style={{ filter: 'drop-shadow(0 0 2px rgba(236, 72, 153, 0.3))' }} />
        {/* Smile */}
        <path 
          d="M 14.5 18 Q 16 19.4 17.5 18" 
          fill="none" 
          stroke="var(--accent-primary)" 
          strokeWidth="1" 
          strokeLinecap="round" 
        />

        {/* Hands */}
        {/* Left Hand (Waves on Hover) */}
        <circle 
          cx="6" 
          cy="26.5" 
          r="1.8" 
          fill="var(--accent-primary)" 
          className="chibi-hand-left" 
        />
        {/* Right Hand */}
        <circle 
          cx="26" 
          cy="26.5" 
          r="1.8" 
          fill="var(--accent-primary)" 
        />

        {/* Synth Deck Accessory */}
        {activeAccessories.synthDeck && (
          <g id="accessory-synth-deck">
            {/* Deck body */}
            <rect x="2" y="34.5" width="28" height="6.5" rx="1.5" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 4px #818cf8)' }} />
            {/* Neon keys */}
            <line x1="5" y1="36.5" x2="5" y2="39" stroke="#34d399" strokeWidth="1" />
            <line x1="8" y1="36.5" x2="8" y2="39" stroke="#34d399" strokeWidth="1" />
            <line x1="11" y1="36.5" x2="11" y2="39" stroke="#34d399" strokeWidth="1" />
            <line x1="14" y1="36.5" x2="14" y2="39" stroke="#34d399" strokeWidth="1" />
            <line x1="17" y1="36.5" x2="17" y2="39" stroke="#34d399" strokeWidth="1" />
            <line x1="20" y1="36.5" x2="20" y2="39" stroke="#34d399" strokeWidth="1" />
            <line x1="23" y1="36.5" x2="23" y2="39" stroke="#34d399" strokeWidth="1" />
            <line x1="26" y1="36.5" x2="26" y2="39" stroke="#34d399" strokeWidth="1" />
            {/* Float animation */}
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-1.5; 0,0"
              dur="2s"
              repeatCount="indefinite"
            />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '8px',
        top: `${position.top}px`,
        opacity: position.opacity,
        pointerEvents: chibiState === 'idle' ? 'auto' : 'none',
        transition: chibiState === 'idle' ? 'top 0.1s linear, opacity 0.2s ease' : 'opacity 0.2s ease',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '36px'
      }}
      title="Aethy, your music spirit!"
    >
      {renderPortal()}
      {renderChibi()}
    </div>
  );
};

export default ChibiCompanion;
