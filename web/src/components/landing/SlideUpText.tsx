'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SlideUpTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

export const SlideUpText: React.FC<SlideUpTextProps> = ({
  text,
  className = '',
  delay = 0,
  stagger = 35,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const words = text.split(' ');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={containerRef} className={`inline-block ${className}`}>
      {words.map((word, wordIdx) => (
        <span key={wordIdx} className="inline-block overflow-hidden mr-[0.25em] align-bottom">
          <span
            className="inline-block transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transform: isVisible ? 'translateY(0%)' : 'translateY(110%)',
              transitionDelay: `${delay + wordIdx * stagger}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};
