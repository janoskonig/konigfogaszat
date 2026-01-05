'use client';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 60, height = 69, className = '' }: LogoProps) {
  // Calculate font sizes based on width
  const isSmall = width < 80;
  const mainFontSize = isSmall ? `${Math.max(10, width * 0.25)}px` : `${Math.max(12, width * 0.22)}px`;
  const subFontSize = isSmall ? `${Math.max(7, width * 0.12)}px` : `${Math.max(9, width * 0.14)}px`;
  
  return (
    <div 
      className={`flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-md ${className}`}
      style={{ width, height, minWidth: width, minHeight: height, padding: '4px' }}
    >
      <div className="text-center leading-tight">
        {isSmall ? (
          <>
            <div style={{ fontSize: mainFontSize, lineHeight: '1.1' }}>König</div>
            <div style={{ fontSize: subFontSize, lineHeight: '1.1', fontWeight: '600' }}>Fogászat</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: mainFontSize, lineHeight: '1.2' }}>König</div>
            <div style={{ fontSize: subFontSize, lineHeight: '1.2', fontWeight: '600' }}>Fogászat</div>
          </>
        )}
      </div>
    </div>
  );
}

