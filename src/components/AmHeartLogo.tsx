import React from 'react';

interface AmHeartLogoProps {
  className?: string;
  sizeClassName?: string;
}

export const AmHeartLogo: React.FC<AmHeartLogoProps> = ({ 
  className = '', 
  sizeClassName = 'w-9 h-9' 
}) => {
  return (
    <div 
      className={`rounded-full bg-pink-100 flex items-center justify-center shadow-xs border border-pink-200/50 relative overflow-hidden shrink-0 group ${sizeClassName} ${className}`}
      title="Capture Booth (AM Logo)"
    >
      {/* Soft inner radial gradient for a high-end designer tactile finish */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,244,245,0.7)_0%,transparent_100%)] pointer-events-none" />
      
      <svg 
        viewBox="0 0 100 120" 
        className="w-[74%] h-[74%] text-[#b448ec] group-hover:scale-110 transition-transform duration-300 relative z-10" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Slanted Cursive Calligraphy paths mimicking the neon "AM" & Heart symbol in the uploaded image */}
        {/* Left base flourish and upward sloping stroke of 'A' */}
        <path 
         d="M 38,32 C 34,48 24,80 15,86 C 8,90 4,82 7,72 C 12,56 25,32 44,28 C 47,27 44,48 42,88" 
          stroke="currentColor" 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Heart shaped cursive loop forming 'M' */}
        <path 
          d="M 44,58 C 47,44 52,41 57,43 C 62,45 54,68 64,82 C 70,91 75,52 76,43 C 77,34 71,38 66,51 C 63,59 65,68 67,78" 
          stroke="currentColor" 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Sweeping calligraphic crossbar flowing from the A's loop */}
        <path 
          d="M 12,70 C 22,64 45,55 83,48" 
          stroke="currentColor" 
          strokeWidth="4.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default AmHeartLogo;
