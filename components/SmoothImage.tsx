'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SmoothImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export function SmoothImage({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.png',
  fill,
  sizes,
  priority,
  ...props
}: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const finalSrc = hasError || !src ? fallbackSrc : src;

  return (
    <Image
      src={finalSrc}
      alt={alt || ''}
      fill={fill}
      sizes={sizes}
      priority={priority}
      referrerPolicy="no-referrer"
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      className={`transition-all duration-700 ease-out ${
        isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-[1.03]'
      } ${className}`}
      {...props}
    />
  );
}
