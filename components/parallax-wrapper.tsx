"use client"

import { useEffect, useRef } from "react";

interface ParallaxWrapperProps {
  children: React.ReactNode;
  className?: string;
  parallaxType?: 'hero' | 'section' | 'cards' | 'carousel';
}

export function ParallaxWrapper({ children, className = '', parallaxType = 'section' }: ParallaxWrapperProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parallaxType !== 'hero') return; // Only apply parallax for hero
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (elementRef.current) {
          const heroImage = elementRef.current.querySelector('.hero-bg') as HTMLElement;
          if (heroImage) {
            heroImage.style.transform = `translateY(${scrollY * 0.1}px)`;
          }
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [parallaxType]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
} 