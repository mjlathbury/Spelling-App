/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { storageService } from '../services/storageService';

export default function CelestialPath() {
  const [stars, setStars] = useState(0);
  const maxStars = 150;

  useEffect(() => {
    const updateStars = () => {
      setStars(storageService.getDailyStars());
    };

    updateStars();
    const interval = setInterval(updateStars, 2000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const progress = (stars / maxStars) * 100;

  return (
    <div className="w-full h-1.5 bg-[var(--theme-color)]/20 relative overflow-hidden">
      {/* Shimmering Golden Gradient Fill */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        className="h-full bg-gradient-to-r from-gold via-amber-300 to-gold shadow-[0_0_10px_rgba(255,215,0,0.5)] relative"
      >
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer" />
      </motion.div>

      {/* Golden Star Icon Slider */}
      <motion.div
        initial={{ left: 0 }}
        animate={{ left: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
      >
        <div className="text-sm drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]">⭐</div>
      </motion.div>
    </div>
  );
}
