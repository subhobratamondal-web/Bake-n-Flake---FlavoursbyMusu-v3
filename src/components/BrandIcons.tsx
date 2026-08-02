import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const getDim = (props: IconProps, defaultSize = 28) => {
  const size = props.size || props.width || props.height || defaultSize;
  return { width: size, height: size };
};

export const BrandIcons = {
  // 3D Official Facebook Logo
  Facebook: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(24, 119, 242, 0.4))', ...props.style }}
        {...props}
      >
        <defs>
          <linearGradient id="fb-3d-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1877F2" />
            <stop offset="60%" stopColor="#0B63D6" />
            <stop offset="100%" stopColor="#034EA2" />
          </linearGradient>
          <linearGradient id="fb-3d-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="fb-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#002D6B" floodOpacity="0.5" />
          </filter>
        </defs>
        {/* Outer squircle frame with 3D gradient */}
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#fb-3d-bg)" />
        {/* Top gloss highlight */}
        <rect x="2" y="2" width="44" height="22" rx="14" fill="url(#fb-3d-gloss)" />
        {/* Crisp official 3D 'f' emblem */}
        <path
          d="M29.5 25.5L30.5 19H24.2V14.8C24.2 13 25.1 11.2 28 11.2H31V5.6S28.3 5 25.7 5C20.3 5 16.8 8.3 16.8 14.2V19H11V25.5H16.8V46H24.2V25.5H29.5Z"
          fill="#FFFFFF"
          filter="url(#fb-shadow)"
        />
      </svg>
    );
  },

  // 3D Official Instagram Logo
  Instagram: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(225, 48, 108, 0.45))', ...props.style }}
        {...props}
      >
        <defs>
          <radialGradient id="ig-3d-bg" cx="30%" cy="100%" r="110%">
            <stop offset="0%" stopColor="#FFD600" />
            <stop offset="20%" stopColor="#FF7A00" />
            <stop offset="45%" stopColor="#FF0069" />
            <stop offset="75%" stopColor="#D300C5" />
            <stop offset="100%" stopColor="#7638FA" />
          </radialGradient>
          <linearGradient id="ig-3d-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="ig-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#500030" floodOpacity="0.4" />
          </filter>
        </defs>
        {/* Background squircle */}
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#ig-3d-bg)" />
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#ig-3d-sheen)" />
        {/* Camera outer box */}
        <rect
          x="12"
          y="12"
          width="24"
          height="24"
          rx="7"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          filter="url(#ig-glow)"
        />
        {/* Camera lens ring */}
        <circle
          cx="24"
          cy="24"
          r="6.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          filter="url(#ig-glow)"
        />
        {/* Camera flash dot */}
        <circle cx="31" cy="17" r="1.8" fill="#FFFFFF" filter="url(#ig-glow)" />
      </svg>
    );
  },

  // 3D Official YouTube Logo
  YouTube: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(255, 0, 0, 0.45))', ...props.style }}
        {...props}
      >
        <defs>
          <linearGradient id="yt-3d-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF2E2E" />
            <stop offset="50%" stopColor="#FF0000" />
            <stop offset="100%" stopColor="#C40000" />
          </linearGradient>
          <linearGradient id="yt-3d-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="yt-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#660000" floodOpacity="0.5" />
          </filter>
        </defs>
        {/* Main 3D Squircle Frame */}
        <rect x="2" y="8" width="44" height="32" rx="10" fill="url(#yt-3d-bg)" />
        <rect x="2" y="8" width="44" height="16" rx="10" fill="url(#yt-3d-sheen)" />
        {/* 3D White Play Button */}
        <polygon points="20,16 32,24 20,32" fill="#FFFFFF" filter="url(#yt-shadow)" />
      </svg>
    );
  },

  // 3D Official Pinterest Logo
  Pinterest: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(230, 0, 35, 0.45))', ...props.style }}
        {...props}
      >
        <defs>
          <linearGradient id="pin-3d-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF1F3A" />
            <stop offset="60%" stopColor="#E60023" />
            <stop offset="100%" stopColor="#9E0016" />
          </linearGradient>
          <linearGradient id="pin-3d-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="pin-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#5E000E" floodOpacity="0.5" />
          </filter>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#pin-3d-bg)" />
        <rect x="2" y="2" width="44" height="22" rx="14" fill="url(#pin-3d-gloss)" />
        <path
          d="M24 8C15.2 8 8 15.2 8 24C8 30.8 12.2 36.6 18.2 38.9C18.1 37.6 18 35.6 18.3 34.2C18.6 32.9 20.3 25.6 20.3 25.6C20.3 25.6 19.8 24.6 19.8 23.1C19.8 20.8 21.1 19.1 22.8 19.1C24.2 19.1 24.9 20.2 24.9 21.4C24.9 22.8 24 25 23.5 27.1C23.1 28.8 24.4 30.2 26.1 30.2C29.2 30.2 31.6 26.9 31.6 22.1C31.6 17.8 28.6 14.8 24 14.8C18.7 14.8 15.6 18.8 15.6 23.5C15.6 25.1 16.2 26.8 17 27.7C17.2 28 17.2 28.2 17.1 28.6C17 29.1 16.7 30.4 16.6 30.8C16.5 31.2 16.2 31.3 15.8 31.1C13.2 29.9 11.6 26.1 11.6 23.1C11.6 17.3 15.8 12 24.4 12C31.3 12 36.6 16.9 36.6 23C36.6 29.8 32.3 35.3 26.4 35.3C24.4 35.3 22.5 34.2 21.8 33C21.8 33 20.6 37.7 20.3 38.9C19.8 40.8 18.5 43.2 17.5 44.7C19.6 45.5 21.8 46 24.1 46C36.2 46 46 36.2 46 24.1C46 11.9 36.2 8 24 8Z"
          fill="#FFFFFF"
          filter="url(#pin-shadow)"
        />
      </svg>
    );
  },

  // 3D Official WhatsApp Logo
  WhatsApp: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(37, 211, 102, 0.45))', ...props.style }}
        {...props}
      >
        <defs>
          <linearGradient id="wa-3d-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#30E875" />
            <stop offset="60%" stopColor="#25D366" />
            <stop offset="100%" stopColor="#10A24A" />
          </linearGradient>
          <linearGradient id="wa-3d-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="wa-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#065825" floodOpacity="0.5" />
          </filter>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#wa-3d-bg)" />
        <rect x="2" y="2" width="44" height="22" rx="14" fill="url(#wa-3d-gloss)" />
        <path
          d="M34.8 13.2C32 10.4 28.2 8.8 24.2 8.8C16.1 8.8 9.5 15.4 9.5 23.5C9.5 26.1 10.2 28.6 11.5 30.9L9 40L18.3 37.6C20.5 38.8 22.3 39.4 24.2 39.4C32.3 39.4 38.9 32.8 38.9 24.7C38.9 20.7 37.6 16 34.8 13.2ZM24.2 36.8C22.4 36.8 20.7 36.3 19.1 35.4L18.6 35.1L13.1 36.5L14.6 31.1L14.2 30.5C13.2 28.9 12.1 26.8 12.1 24.7C12.1 18.1 17.5 12.7 24.1 12.7C27.3 12.7 30.3 14 32.6 16.2C34.9 18.5 36.2 21.5 36.2 24.7C36.2 31.3 30.8 36.8 24.2 36.8ZM30.7 28.1C30.3 27.9 28.3 26.9 28 26.7C27.7 26.6 27.4 26.5 27.2 26.9C27 27.3 26.3 28.1 26 28.4C25.8 28.7 25.5 28.7 25.1 28.5C24.7 28.3 23.4 27.9 21.9 26.5C20.7 25.4 19.9 24 19.7 23.6C19.5 23.2 19.7 23 19.9 22.8C20.1 22.6 20.3 22.3 20.5 22.1C20.7 21.9 20.8 21.7 20.9 21.4C21 21.1 20.9 20.9 20.8 20.7C20.7 20.5 20 18.8 19.7 18.1C19.4 17.4 19.1 17.5 18.9 17.5C18.7 17.5 18.4 17.5 18.1 17.5C17.8 17.5 17.4 17.6 17 18C16.6 18.4 15.5 19.4 15.5 21.5C15.5 23.6 17 25.6 17.2 25.9C17.4 26.2 20.2 30.5 24.5 32.4C25.5 32.8 26.3 33.1 27 33.3C28 33.6 28.9 33.6 29.6 33.5C30.4 33.4 32.1 32.5 32.5 31.4C32.9 30.3 32.9 29.4 32.8 29.2C32.6 29 32.2 28.9 31.8 28.7L30.7 28.1Z"
          fill="#FFFFFF"
          filter="url(#wa-shadow)"
        />
      </svg>
    );
  },

  // 3D Official Messenger Logo
  Messenger: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(0, 132, 255, 0.45))', ...props.style }}
        {...props}
      >
        <defs>
          <radialGradient id="msg-3d-bg" cx="15%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#00C6FF" />
            <stop offset="40%" stopColor="#0072FF" />
            <stop offset="75%" stopColor="#8A2399" />
            <stop offset="100%" stopColor="#FF5E00" />
          </radialGradient>
          <linearGradient id="msg-3d-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="msg-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#002D6B" floodOpacity="0.5" />
          </filter>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#msg-3d-bg)" />
        <rect x="2" y="2" width="44" height="22" rx="14" fill="url(#msg-3d-gloss)" />
        <path
          d="M24 8C15.2 8 8 14.6 8 22.8C8 27.4 10.3 31.4 14 34.1V40L19.5 37C20.9 37.4 22.4 37.6 24 37.6C32.8 37.6 40 31 40 22.8C40 14.6 32.8 8 24 8ZM25.4 28.2L21 23.5L12.4 28.2L21.8 18.2L26.2 22.9L34.8 18.2L25.4 28.2Z"
          fill="#FFFFFF"
          filter="url(#msg-shadow)"
        />
      </svg>
    );
  },

  // 3D Official Google Logo
  Google: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(66, 133, 244, 0.35))', ...props.style }}
        {...props}
      >
        <defs>
          <filter id="g-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
          </filter>
          <linearGradient id="g-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5252" />
            <stop offset="100%" stopColor="#EA4335" />
          </linearGradient>
          <linearGradient id="g-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5397FE" />
            <stop offset="100%" stopColor="#4285F4" />
          </linearGradient>
          <linearGradient id="g-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#34A853" />
          </linearGradient>
          <linearGradient id="g-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFCA28" />
            <stop offset="100%" stopColor="#FBBC05" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="#FFFFFF" filter="url(#g-shadow)" />
        <path
          d="M34.8 24.5C34.8 23.8 34.7 23.1 34.6 22.5H24V26.8H30.1C29.8 28.3 28.9 29.6 27.5 30.5V33.6H31.5C33.9 31.4 34.8 28.2 34.8 24.5Z"
          fill="url(#g-blue)"
        />
        <path
          d="M24 35.5C27.1 35.5 29.7 34.5 31.5 33.6L27.5 30.5C26.5 31.2 25.4 31.6 24 31.6C21 31.6 18.5 29.6 17.6 26.8H13.5V30H13.4C15.3 33.8 19.3 35.5 24 35.5Z"
          fill="url(#g-green)"
        />
        <path
          d="M17.6 26.8C17.3 26 17.2 25 17.2 24C17.2 23 17.4 22 17.6 21.2V18H13.5C12.7 19.6 12.3 21.8 12.3 24C12.3 26.2 12.7 28.4 13.5 30L17.6 26.8Z"
          fill="url(#g-yellow)"
        />
        <path
          d="M24 16.4C25.7 16.4 27.2 17 28.4 18.1L31.6 14.9C29.7 13.1 27.1 12.5 24 12.5C19.3 12.5 15.3 14.2 13.4 18L17.6 21.2C18.5 18.4 21 16.4 24 16.4Z"
          fill="url(#g-red)"
        />
      </svg>
    );
  },

  // 3D Owner Royalty Crown & Heart Emblem
  Owner: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(236, 72, 153, 0.45))', ...props.style }}
        {...props}
      >
        <defs>
          <linearGradient id="owner-3d-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF65B2" />
            <stop offset="60%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#BE185D" />
          </linearGradient>
          <linearGradient id="owner-3d-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="owner-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#700030" floodOpacity="0.5" />
          </filter>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#owner-3d-bg)" />
        <rect x="2" y="2" width="44" height="22" rx="14" fill="url(#owner-3d-gloss)" />
        <path
          d="M24 36.5L21.8 34.5C14 27.4 8.8 22.7 8.8 16.8C8.8 12 12.6 8.2 17.4 8.2C20.1 8.2 22.7 9.5 24 11.5C25.3 9.5 27.9 8.2 30.6 8.2C35.4 8.2 39.2 12 39.2 16.8C39.2 22.7 34 27.4 26.2 34.5L24 36.5Z"
          fill="#FFFFFF"
          filter="url(#owner-shadow)"
        />
      </svg>
    );
  },

  // 3D Email Envelope
  Email: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(255, 122, 0, 0.45))', ...props.style }}
        {...props}
      >
        <defs>
          <linearGradient id="email-3d-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9F2E" />
            <stop offset="60%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#C44800" />
          </linearGradient>
          <linearGradient id="email-3d-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="email-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#662000" floodOpacity="0.5" />
          </filter>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#email-3d-bg)" />
        <rect x="2" y="2" width="44" height="22" rx="14" fill="url(#email-3d-gloss)" />
        <path
          d="M36 14H12C9.8 14 8 15.8 8 18V30C8 32.2 9.8 34 12 34H36C38.2 34 40 32.2 40 30V18C40 15.8 38.2 14 36 14ZM36 18L24 25.5L12 18H36ZM36 30H12V20.5L24 28L36 20.5V30Z"
          fill="#FFFFFF"
          filter="url(#email-shadow)"
        />
      </svg>
    );
  },

  // 3D Emerald Call Phone
  Call: (props: IconProps) => {
    const { width, height } = getDim(props);
    return (
      <svg
        viewBox="0 0 48 48"
        width={width}
        height={height}
        className={props.className}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(16, 185, 129, 0.45))', ...props.style }}
        {...props}
      >
        <defs>
          <linearGradient id="call-3d-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="call-3d-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="call-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#01402E" floodOpacity="0.5" />
          </filter>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#call-3d-bg)" />
        <rect x="2" y="2" width="44" height="22" rx="14" fill="url(#call-3d-gloss)" />
        <path
          d="M15.2 21.6C17.4 25.9 20.9 29.4 25.2 31.6L28.5 28.3C28.9 27.9 29.5 27.8 30 28C31.7 28.6 33.5 28.9 35.4 28.9C36.3 28.9 37 29.6 37 30.5V35.4C37 36.3 36.3 37 35.4 37C20.8 37 9 25.2 9 10.6C9 9.7 9.7 9 10.6 9H15.5C16.4 9 17.1 9.7 17.1 10.6C17.1 12.5 17.4 14.3 18 16C18.1 16.5 18 17.1 17.6 17.5L15.2 21.6Z"
          fill="#FFFFFF"
          filter="url(#call-shadow)"
        />
      </svg>
    );
  }
};

export default BrandIcons;
