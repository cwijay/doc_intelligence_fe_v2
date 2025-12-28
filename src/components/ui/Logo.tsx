'use client';

import { clsx } from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { image: 24, text: 'text-sm' },
  md: { image: 32, text: 'text-lg' },
  lg: { image: 48, text: 'text-xl' },
  xl: { image: 64, text: 'text-2xl' },
};

export default function Logo({ size = 'md', showText = false, className }: LogoProps) {
  const { image: imageSize, text: textSize } = sizeMap[size];

  return (
    <div className={clsx('flex items-center', showText && 'space-x-3', className)}>
      <div
        className={clsx(
          'relative rounded-lg overflow-hidden',
          'group-hover:scale-105 transition-transform duration-200',
          'shadow-sm'
        )}
        style={{ width: imageSize, height: imageSize }}
      >
        <img
          src="/logo.jpg"
          alt="biz2Bricks.ai logo"
          width={imageSize}
          height={imageSize}
          className="object-cover w-full h-full"
        />
      </div>
      {showText && (
        <span
          className={clsx(
            'font-poppins font-bold',
            textSize,
            'text-secondary-900 dark:text-secondary-100',
            'group-hover:text-brand-cyan-500 dark:group-hover:text-brand-cyan-400',
            'transition-colors duration-200'
          )}
        >
          biz2Bricks.ai
        </span>
      )}
    </div>
  );
}
