// src/components/ui/ImageWithFallback.tsx
import { useState, useEffect } from 'react';
import { FaImage } from 'react-icons/fa';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackClassName?: string;
  wrapperClassName?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon,
  fallbackClassName = '',
  wrapperClassName = '',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // src değiştiğinde state'i resetle
  useEffect(() => {
    if (!src || src === 'N/A' || (typeof src === 'string' && src.trim() === '')) {
      setHasError(false);
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);

    // Resmin zaten yüklenmiş olup olmadığını kontrol et (cache'den geliyorsa)
    const img = new Image();
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  // Eğer src yoksa veya 'N/A' ise veya hata varsa fallback göster
  const shouldShowFallback = !src || src === 'N/A' || (typeof src === 'string' && src.trim() === '') || hasError;

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (shouldShowFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className} ${fallbackClassName}`}
      >
        {fallbackIcon || (
          <FaImage className="text-gray-400 dark:text-gray-500 text-2xl" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      {isLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        >
          {fallbackIcon || (
            <FaImage className="text-gray-400 dark:text-gray-500 text-2xl" />
          )}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
}

