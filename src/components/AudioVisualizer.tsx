/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  mode: 'listening' | 'speaking' | 'idle';
  className?: string;
}

export default function AudioVisualizer({ isActive, mode, className = '' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 80);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 80;
      }
    };
    
    window.addEventListener('resize', handleResize);

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Create beautiful dark backing glow
      ctx.fillStyle = 'rgba(10, 10, 10, 0.4)';
      ctx.fillRect(0, 0, width, height);

      // Set waves color depending on states
      let strokeColor = 'rgba(255, 212, 0, 0.8)'; // default bright yellow
      let waveCount = 4;
      let amplitude = 12;
      let frequency = 0.015;

      if (mode === 'listening') {
        strokeColor = 'rgba(255, 212, 0, 0.9)'; // High contrast yellow
        amplitude = Math.sin(phase * 4) * 8 + 18;
        frequency = 0.025;
        waveCount = 5;
      } else if (mode === 'speaking') {
        strokeColor = 'rgba(255, 255, 255, 0.85)'; // Clean soft white
        amplitude = Math.cos(phase * 3.5) * 6 + 14;
        frequency = 0.018;
        waveCount = 4;
      } else {
        strokeColor = 'rgba(255, 212, 0, 0.25)'; // low ambient yellow opacity
        amplitude = 2;
        frequency = 0.01;
        waveCount = 2;
      }

      // Draw multi-layered waves
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        ctx.lineWidth = w === 0 ? 2 : 1;
        
        // Multi-layered opacity
        ctx.strokeStyle = w === 0 
          ? strokeColor 
          : strokeColor.replace('0.9', `${0.65 / w}`).replace('0.85', `${0.6 / w}`).replace('0.8', `${0.5 / w}`).replace('0.25', '0.08');

        // Draw sine path
        for (let x = 0; x < width; x++) {
          const shift = phase + (w * Math.PI / 4);
          // Attenuate waves toward edges (Gaussian-like multiplier)
          const mid = width / 2;
          const distFromCenter = Math.abs(x - mid);
          const filterMultiplier = Math.max(0, 1 - (distFromCenter / mid) ** 2);
          
          const y = height / 2 + Math.sin(x * frequency + shift) * amplitude * filterMultiplier;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Increment wave progression
      phase += mode === 'listening' ? 0.08 : mode === 'speaking' ? 0.06 : 0.02;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, mode]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-white/10 ${className}`} id="visualizer-wrapper">
      {/* Background Micro Dots representing Nothing signature styling */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
      <canvas ref={canvasRef} className="block w-full h-[80px]" id="visualizer-canvas" />
    </div>
  );
}
