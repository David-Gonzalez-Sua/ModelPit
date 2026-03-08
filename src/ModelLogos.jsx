import React from 'react';

// ============================================
// AI MODEL SVG IDENTITIES (Fighter Portraits)
// ============================================

export const ClaudeSVG = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1A1A1A"/>
    <path d="M25 50 C25 20, 75 20, 75 50 C75 80, 25 80, 25 50" stroke="#D97757" strokeWidth="8" strokeLinecap="round"/>
    <circle cx="50" cy="50" r="10" fill="#D97757"/>
  </svg>
);

export const ChatGPTSVG = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1A1A1A"/>
    <path d="M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z" stroke="#10A37F" strokeWidth="6" strokeLinejoin="round"/>
    <circle cx="50" cy="50" r="12" fill="#10A37F"/>
    <path d="M50 20 L50 40 M80 65 L60 55 M20 65 L40 55" stroke="#10A37F" strokeWidth="4"/>
  </svg>
);

export const GeminiSVG = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1A1A1A"/>
    <path d="M50 15 C55 35 65 45 85 50 C65 55 55 65 50 85 C45 65 35 55 15 50 C35 45 45 35 50 15 Z" fill="#4285F4"/>
    <path d="M75 15 C77 25 83 31 93 33 C83 35 77 41 75 51 C73 41 67 35 57 33 C67 31 73 25 75 15 Z" fill="#EA4335" transform="scale(0.5) translate(40, -10)"/>
  </svg>
);

export const DeepSeekSVG = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1A1A1A"/>
    <circle cx="50" cy="50" r="30" stroke="#4D6BFE" strokeWidth="8"/>
    <path d="M50 20 L50 80 M20 50 L80 50" stroke="#4D6BFE" strokeWidth="8" opacity="0.5"/>
    <circle cx="50" cy="50" r="10" fill="#4D6BFE"/>
  </svg>
);

export const OllamaSVG = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1A1A1A"/>
    <path d="M30 40 Q50 10 70 40 Q80 70 50 80 Q20 70 30 40" stroke="#FFF" strokeWidth="6" fill="#333"/>
    <circle cx="40" cy="45" r="5" fill="#FFF"/>
    <circle cx="60" cy="45" r="5" fill="#FFF"/>
    <path d="M45 60 Q50 65 55 60" stroke="#FFF" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export const KimiSVG = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1A1A1A"/>
    <path d="M35 30 L65 30 L50 75 Z" fill="#FF5E00"/>
    <circle cx="50" cy="45" r="8" fill="#1A1A1A"/>
  </svg>
);

export const HumanSVG = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#dc2626"/>
    <circle cx="50" cy="40" r="15" fill="#0a0a0a"/>
    <path d="M25 80 C25 60, 75 60, 75 80" stroke="#0a0a0a" strokeWidth="10" strokeLinecap="round"/>
  </svg>
);
