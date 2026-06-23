
import React, { useEffect, useRef, useState } from 'react';

interface WaveformViewProps {
  buffer: AudioBuffer;
  color?: string;
}

const WaveformView: React.FC<WaveformViewProps> = ({ buffer, color = '#22d3ee' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Using state to trigger re-renders only when dimensions truly change
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Simple debounce to prevent excessive calculations during window resizing
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (canvasRef.current) {
          setDimensions({
            width: canvasRef.current.offsetWidth,
            height: canvasRef.current.offsetHeight
          });
        }
      }, 200);
    };

    // Initial size
    setDimensions({
      width: canvas.offsetWidth,
      height: canvas.offsetHeight
    });

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support High DPI displays
    const dpr = window.devicePixelRatio || 1;
    const padding = 15;
    const width = dimensions.width * dpr;
    const height = dimensions.height * dpr;
    
    // Set actual drawing resolution
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = (height / 2) - padding;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, dpr * 0.6); // Adjust thickness for DPI

    // Fast bounds calculation for each pixel column
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      const start = i * step;
      
      for (let j = 0; j < step; j++) {
        const idx = start + j;
        if (idx >= data.length) break;
        const val = data[idx];
        if (val < min) min = val;
        if (val > max) max = val;
      }

      // Draw vertical line from min to max for this slice
      const x = i;
      const yMin = (1 + min) * amp + padding;
      const yMax = (1 + max) * amp + padding;
      
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }

    ctx.stroke();
  }, [buffer, color, dimensions]);

  return (
    <div className="w-full bg-slate-900/50 rounded-xl border border-slate-700 p-2 overflow-hidden shadow-inner">
      <canvas 
        ref={canvasRef} 
        className="w-full h-24 block transition-opacity duration-300" 
        style={{ opacity: dimensions.width > 0 ? 1 : 0 }}
      />
    </div>
  );
};

export default WaveformView;
