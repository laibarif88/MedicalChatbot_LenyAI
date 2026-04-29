
import React from 'react';

export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="16" cy="16" r="16" fill="#D98D4F"/>
    <circle cx="16" cy="16" r="8" fill="white"/>
  </svg>
);
