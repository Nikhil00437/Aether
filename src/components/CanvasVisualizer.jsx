import React, { useRef, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';

const CanvasVisualizer = ({ type = 'linear' }) => {
  const { analyserRef, isPlaying } = useAudio();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      animId = requestAnimationFrame(render);
      const analyser = analyserRef.current;
      if (!analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      if (type === 'orbit') {
        const width = 74;
        const height = 74;
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const innerRadius = 25; // 50px cover diameter -> 25px radius

        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#06b6d4';

        const barsCount = 32;
        for (let i = 0; i < barsCount; i++) {
          const dataIndex = Math.floor((i / barsCount) * bufferLength * 0.45);
          const value = dataArray[dataIndex] || 0;
          const percent = value / 255;
          const barHeight = Math.max(1, percent * 10); // up to 10px extension

          const angle = (i / barsCount) * 2 * Math.PI;
          const x1 = cx + innerRadius * Math.cos(angle);
          const y1 = cy + innerRadius * Math.sin(angle);
          const x2 = cx + (innerRadius + barHeight) * Math.cos(angle);
          const y2 = cy + (innerRadius + barHeight) * Math.sin(angle);

          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      } else {
        const width = 120;
        const height = 32;
        ctx.clearRect(0, 0, width, height);

        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#06b6d4';

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, width, height);

        const barsCount = 16;
        const spacing = 2;
        const barWidth = (width / barsCount) - spacing;
        let x = 0;

        for (let i = 0; i < barsCount; i++) {
          const dataIndex = Math.floor((i / barsCount) * bufferLength * 0.5);
          const value = dataArray[dataIndex] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * height * 0.95);

          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, accentColor);
          grad.addColorStop(1, '#6366f1');

          ctx.fillStyle = grad;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
          } else {
            ctx.rect(x, height - barHeight, barWidth, barHeight);
          }
          ctx.fill();

          x += barWidth + spacing;
        }
      }
    };

    if (isPlaying) {
      render();
    } else {
      // Draw resting state
      if (type === 'orbit') {
        const width = 74;
        const height = 74;
        ctx.clearRect(0, 0, width, height);
        
        const cx = width / 2;
        const cy = height / 2;
        const innerRadius = 25;
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#06b6d4';

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius + 1.5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else {
        const width = 120;
        const height = 32;
        ctx.clearRect(0, 0, width, height);
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#06b6d4';
        ctx.fillStyle = accentColor;
        const barsCount = 16;
        const spacing = 2;
        const barWidth = (width / barsCount) - spacing;
        let x = 0;
        for (let i = 0; i < barsCount; i++) {
          ctx.fillRect(x, height - 3, barWidth, 3);
          x += barWidth + spacing;
        }
      }
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, analyserRef, type]);

  const width = type === 'orbit' ? 74 : 120;
  const height = type === 'orbit' ? 74 : 32;

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ 
        display: 'block', 
        opacity: 0.85, 
        filter: `drop-shadow(0 0 5px var(--accent-primary))` 
      }}
      title={`${type === 'orbit' ? 'Orbit Halo' : 'Linear Wave'} Visualizer`}
    />
  );
};

export default CanvasVisualizer;
