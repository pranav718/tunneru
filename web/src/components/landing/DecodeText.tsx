'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DecodeTextProps {
  text: string;
  className?: string;
  triggerOnHover?: boolean;
}

const GLYPHS = '0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*~_+-=[]{}|;:<>?,./';

export const DecodeText: React.FC<DecodeTextProps> = ({
  text,
  className = '',
  triggerOnHover = true,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const containerRef = useRef<HTMLSpanElement>(null);
  const isDecodingRef = useRef(false);

  const triggerDecode = useCallback(() => {
    if (isDecodingRef.current) return;
    isDecodingRef.current = true;

    let iteration = 0;
    const maxIterations = text.length;

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('')
      );

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        isDecodingRef.current = false;
      }

      iteration += 1 / 3;
    }, 28);
  }, [text]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerDecode();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerDecode]);

  const handleMouseEnter = () => {
    if (triggerOnHover) {
      triggerDecode();
    }
  };

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      className={`font-mono inline-block cursor-default select-none ${className}`}
    >
      {displayText}
    </span>
  );
};
