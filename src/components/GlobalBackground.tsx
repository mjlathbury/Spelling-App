/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function GlobalBackground() {
  const { activeTheme } = useTheme();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="stars-layer" />
      <div className="nebula-aura" />
      <style>{`
        .stars-layer {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 50px 160px, #fff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 160px 120px, #fff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 200px 200px;
          opacity: 0.3;
          animation: twinkle 4s infinite alternate ease-in-out;
        }
        
        @keyframes twinkle {
          from { opacity: 0.2; transform: scale(1); }
          to { opacity: 0.5; transform: scale(1.05); }
        }

        .nebula-aura {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, var(--theme-nebula) 0%, transparent 70%);
          transition: background 0.5s ease;
        }
      `}</style>
    </div>
  );
}
