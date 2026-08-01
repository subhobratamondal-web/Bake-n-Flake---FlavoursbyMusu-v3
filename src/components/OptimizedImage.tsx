import React, { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl, convertImageUrl } from '../utils/googleSheetsSync';
import { cn } from '../lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  quality?: number;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  skeletonClassName?: string;
  rootMargin?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 600,
  quality = 80,
  fallbackSrc = 'https://i.ibb.co/Xx2kxrrg/LOGO-1.png',
  className = '',
  containerClassName = '',
  skeletonClassName = '',
  rootMargin = '400px',
  style,
  ...props
}) => {
  const [isInView, setIsInView] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    if (!src) return fallbackSrc;
    return getOptimizedImageUrl(src, width, quality) || src || fallbackSrc;
  });
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin }
      );
      observer.observe(containerRef.current);

      // Fallback timer for iOS Safari / scroll glitches
      const timer = setTimeout(() => setIsInView(true), 500);

      return () => {
        observer.disconnect();
        clearTimeout(timer);
      };
    } else {
      setIsInView(true);
    }
  }, [rootMargin]);

  useEffect(() => {
    if (src) {
      const optimized = getOptimizedImageUrl(src, width, quality) || src || fallbackSrc;
      setCurrentSrc(optimized);
      setHasError(false);
    } else {
      setCurrentSrc(fallbackSrc);
    }
  }, [src, width, quality, fallbackSrc]);

  // Safety fallback for image load state so images never stay hidden/invisible
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const converted = convertImageUrl(src);
      if (currentSrc !== converted && converted) {
        setCurrentSrc(converted);
      } else {
        setCurrentSrc(fallbackSrc);
      }
    } else {
      setCurrentSrc(fallbackSrc);
    }
    setIsLoaded(true);
  };

  const finalSrc = currentSrc || src || fallbackSrc;
  const isGif = finalSrc.toLowerCase().includes('gif') || finalSrc.toLowerCase().includes('ezgif') || finalSrc.toLowerCase().includes('giphy');

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden w-full h-full", containerClassName)}>
      {/* Skeleton overlay while loading */}
      {!isLoaded && !isGif && (
        <div 
          className={cn(
            "absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-slate-200 via-pink-100/50 to-slate-200 dark:from-slate-800 dark:via-pink-900/20 dark:to-slate-800",
            skeletonClassName
          )} 
        />
      )}

      {isInView && finalSrc ? (
        <img
          src={finalSrc}
          alt={alt}
          loading={isGif ? "eager" : "lazy"}
          decoding="async"
          crossOrigin="anonymous"
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          referrerPolicy="no-referrer"
          className={cn(
            "transition-all duration-500 ease-in-out",
            isLoaded || isGif ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-md",
            className
          )}
          style={style}
          {...props}
        />
      ) : null}
    </div>
  );
};

export default OptimizedImage;
