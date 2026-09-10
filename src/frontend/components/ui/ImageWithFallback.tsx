// src/components/ui/ImageWithFallback.tsx
import { useState, useEffect } from 'react';
import { FaImage } from 'react-icons/fa';

// Bellek içi görsel önbelleği: Zaten yüklenmiş görsellerde skeleton flaşlamasını ve gecikmeyi tamamen engeller
const loadedImagesCache = new Set<string>();

/**
 * Verilen görsel URL'lerini arka planda tarayıcı önbelleğine önceden yükler (pre-warm)
 */
export function preloadImages(urls: (string | undefined | null)[], limit: number = 30) {
  if (typeof window === 'undefined') return;
  const validUrls = urls
    .filter((u): u is string => typeof u === 'string' && u.trim() !== '' && u !== 'N/A' && !loadedImagesCache.has(u))
    .slice(0, limit);

  validUrls.forEach(url => {
    const img = new Image();
    img.src = url;
    img.onload = () => loadedImagesCache.add(url);
  });
}

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackClassName?: string;
  wrapperClassName?: string;
  loading?: 'lazy' | 'eager';
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon,
  fallbackClassName = '',
  wrapperClassName = '',
  loading = 'lazy',
}: ImageWithFallbackProps) {
  const isAlreadyLoaded = Boolean(src && loadedImagesCache.has(src));
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!isAlreadyLoaded);

  // src değiştiğinde hata ve yüklenme durumunu güncelle
  useEffect(() => {
    if (!src || src === 'N/A' || (typeof src === 'string' && src.trim() === '')) {
      setHasError(false);
      setIsLoading(false);
      return;
    }

    if (loadedImagesCache.has(src)) {
      setHasError(false);
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);
  }, [src]);

  // Eğer src yoksa veya 'N/A' ise veya hata varsa fallback göster
  const shouldShowFallback = !src || src === 'N/A' || (typeof src === 'string' && src.trim() === '') || hasError;

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    if (src) loadedImagesCache.add(src);
    setIsLoading(false);
    setHasError(false);
  };

  if (shouldShowFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-200 dark:bg-zinc-800 ${className} ${fallbackClassName}`}
      >
        {fallbackIcon || (
          <FaImage className="text-stone-400 dark:text-zinc-500 text-2xl" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      {isLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-stone-200 dark:bg-zinc-800 animate-pulse ${className}`}
        >
          {fallbackIcon || (
            <FaImage className="text-stone-400 dark:text-zinc-500 text-2xl" />
          )}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        decoding="async"
      />
    </div>
  );
}
