import React, { useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';

const AmbientBackground = () => {
  const { analyserRef, isPlaying } = useAudio();
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const currentBassIntensityRef = useRef(0);
  
  const particlesRef = useRef([]);
  const shockwavesRef = useRef([]);
  const lastShockwaveRef = useRef(0);

  // Initialize particles once on mount
  useEffect(() => {
    const pCount = 100;
    const particles = [];
    for (let i = 0; i < pCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseSize: Math.random() * 2 + 1.2,
        size: 0,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.02 + 0.005,
        colorFactor: Math.random(),
      });
    }
    particlesRef.current = particles;
  }, []);

  // Set up canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reposition particles that fell off-screen
      particlesRef.current.forEach(p => {
        if (p.x > canvas.width) p.x = Math.random() * canvas.width;
        if (p.y > canvas.height) p.y = Math.random() * canvas.height;
      });
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const updateAmbientGlow = () => {
      let bassIntensity = 0;
      const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 0;
      const dataArray = new Uint8Array(bufferLength);

      if (analyserRef.current && isPlaying) {
        const analyser = analyserRef.current;
        analyser.getByteFrequencyData(dataArray);

        // Bass frequencies are in the first few bins (e.g. 0 to 5)
        let bassSum = 0;
        const bassCount = 6;
        for (let i = 0; i < bassCount; i++) {
          bassSum += dataArray[i];
        }
        const avgBass = bassSum / bassCount;
        
        // Normalize between 0 and 1
        bassIntensity = avgBass / 255;
      }

      // Smooth interpolation for fluid transitions
      if (bassIntensity > currentBassIntensityRef.current) {
        currentBassIntensityRef.current = currentBassIntensityRef.current * 0.4 + bassIntensity * 0.6;
      } else {
        currentBassIntensityRef.current = currentBassIntensityRef.current * 0.88 + bassIntensity * 0.12;
      }

      const intensity = currentBassIntensityRef.current;
      document.documentElement.style.setProperty('--beat-intensity', intensity.toFixed(3));

      // Direct DOM manipulation for blob scaling
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `scale(${0.95 + intensity * 0.35}) rotate(${intensity * 45}deg)`;
        blob1Ref.current.style.opacity = `${0.04 + intensity * 0.22}`;
      }

      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `scale(${0.9 + intensity * 0.35}) rotate(${-intensity * 45}deg)`;
        blob2Ref.current.style.opacity = `${0.03 + intensity * 0.22}`;
      }

      // Canvas drawing
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Get current theme colors from styles
          const rootStyle = getComputedStyle(document.documentElement);
          const accentPrimary = rootStyle.getPropertyValue('--accent-primary').trim() || 'rgb(6, 182, 212)';
          const accentSecondary = rootStyle.getPropertyValue('--accent-secondary').trim() || 'rgb(99, 102, 241)';

          const parseRGB = (str) => {
            const match = str.match(/\d+/g);
            return match ? match.map(Number) : [6, 182, 212];
          };

          const primaryRGB = parseRGB(accentPrimary);
          const secondaryRGB = parseRGB(accentSecondary);

          const nowTime = Date.now();

          // Trigger bass shockwave if intensity is high enough
          if (intensity > 0.62 && nowTime - lastShockwaveRef.current > 750) {
            shockwavesRef.current.push({
              x: canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.4),
              y: canvas.height / 2 + (Math.random() - 0.5) * (canvas.height * 0.4),
              radius: 0,
              maxRadius: Math.min(canvas.width, canvas.height) * 0.45,
              opacity: 0.36,
              colorFactor: Math.random()
            });
            lastShockwaveRef.current = nowTime;
          }

          // Draw and update shockwaves
          shockwavesRef.current = shockwavesRef.current.filter(wave => {
            wave.radius += 4.5;
            wave.opacity -= 0.008;
            if (wave.opacity <= 0 || wave.radius >= wave.maxRadius) return false;

            const r = Math.round(primaryRGB[0] + (secondaryRGB[0] - primaryRGB[0]) * wave.colorFactor);
            const g = Math.round(primaryRGB[1] + (secondaryRGB[1] - primaryRGB[1]) * wave.colorFactor);
            const b = Math.round(primaryRGB[2] + (secondaryRGB[2] - primaryRGB[2]) * wave.colorFactor);

            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${wave.opacity})`;
            ctx.lineWidth = 1.5 + (1 - wave.opacity) * 3;
            ctx.stroke();
            return true;
          });

          // Draw and update particles
          const speedScale = 1 + intensity * 3.5;
          const particles = particlesRef.current;
          
          particles.forEach(p => {
            // Index of frequency buffer mapping
            const binIndex = Math.min(bufferLength - 1, Math.floor(p.colorFactor * bufferLength));
            const freqVal = bufferLength > 0 ? dataArray[binIndex] : 0;
            const audioBonus = (freqVal / 255) * 5;

            p.x += p.vx * speedScale + Math.sin(p.phase) * (intensity * 0.8);
            p.y += p.vy * speedScale + Math.cos(p.phase) * (intensity * 0.8);
            p.phase += p.phaseSpeed;
            p.size = p.baseSize + audioBonus;

            // Screen boundary wrapping
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = canvas.height + 10;
            if (p.y > canvas.height + 10) p.y = -10;

            const r = Math.round(primaryRGB[0] + (secondaryRGB[0] - primaryRGB[0]) * p.colorFactor);
            const g = Math.round(primaryRGB[1] + (secondaryRGB[1] - primaryRGB[1]) * p.colorFactor);
            const b = Math.round(primaryRGB[2] + (secondaryRGB[2] - primaryRGB[2]) * p.colorFactor);

            const opacity = 0.12 + (freqVal / 255) * 0.38;

            // Draw core particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.fill();

            // Draw ambient halo if audio is active
            if (freqVal > 100) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.25})`;
              ctx.fill();
            }
          });
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(updateAmbientGlow);
    };

    animationFrameIdRef.current = requestAnimationFrame(updateAmbientGlow);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [analyserRef, isPlaying, canvasRef]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.45
        }}
      />
      <div ref={blob1Ref} className="ambient-blob blob-1" />
      <div ref={blob2Ref} className="ambient-blob blob-2" />
    </>
  );
};

export default AmbientBackground;
