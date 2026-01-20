
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { container: 'w-10 h-10', inner: 'w-5 h-5', border: 'border-2' },
    md: { container: 'w-14 h-14', inner: 'w-7 h-7', border: 'border-4' },
    lg: { container: 'w-24 h-24', inner: 'w-12 h-12', border: 'border-[6px]' },
    xl: { container: 'w-32 h-32', inner: 'w-16 h-16', border: 'border-[8px]' },
  };

  const dims = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center ${dims.container} bg-brand rounded-[30%] ${className} shadow-neon`}>
      <div className={`${dims.inner} ${dims.border} border-black rounded-sm rotate-[15deg] transition-transform hover:rotate-45 duration-500`}></div>
      <div className="absolute w-1 h-1 bg-black rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
    </div>
  );
};

export default Logo;
