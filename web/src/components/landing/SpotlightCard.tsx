'use client';

import React, { useRef, useState, useCallback } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setOpacity(1);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOpacity(0);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] overflow-hidden transition-colors duration-200 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(231, 208, 200, 0.07), transparent 60%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px rounded-xl transition-opacity duration-300 z-0 border border-[var(--border-accent)]"
        style={{
          opacity,
          maskImage: `radial-gradient(180px circle at ${position.x}px ${position.y}px, black, transparent 70%)`,
          WebkitMaskImage: `radial-gradient(180px circle at ${position.x}px ${position.y}px, black, transparent 70%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-7">
        {children}
      </div>
    </div>
  );
};
