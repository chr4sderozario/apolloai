/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function Logo({ size = 48, className = '', animate = false }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      id="apollo-logo-container"
    >
      {/* Nothing/Apple Inspired Sleek Orbit Wireframe SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-current"
        id="apollo-logo-svg"
      >
        {/* Outer Dot Matrix Circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="1 4"
          className="opacity-40"
        />

        {/* Inner concentric fine ring */}
        <circle
          cx="50"
          cy="50"
          r="32"
          stroke="currentColor"
          strokeWidth="0.75"
          className="opacity-20"
        />

        {/* Animated Main Apollo Solar corona path */}
        <circle
          cx="50"
          cy="50"
          r="20"
          stroke="#FFD400"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="80 40"
          className={`${animate ? 'animate-spin' : ''}`}
          style={{ 
            animationDuration: '10s',
            transformOrigin: '50px 50px'
          }}
        />

        {/* Central Core Element (The Nothing-style focal point) */}
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="currentColor"
        />

        {/* Eclipse/Corona Accent dot */}
        <circle
          cx="50"
          cy="30"
          r="2.5"
          fill="#FFD400"
          className={`${animate ? 'animate-ping' : ''}`}
          style={{ animationDuration: '3s' }}
        />
        
        {/* Subtle grid indicators in the four corners */}
        <path d="M 50 10 L 50 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="opacity-55" />
        <path d="M 50 86 L 50 90" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="opacity-55" />
        <path d="M 10 50 L 14 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="opacity-55" />
        <path d="M 86 50 L 90 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="opacity-55" />
      </svg>
    </div>
  );
}
