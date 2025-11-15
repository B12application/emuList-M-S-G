
import React from 'react';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M4 4 V 20 M4 4 L12 16 L20 4 M20 4 V 20" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}