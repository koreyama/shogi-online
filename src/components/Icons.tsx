import React from 'react';

type IconProps = {
    size?: number;
    color?: string;
    className?: string;
};

export const IconBack: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

export const IconDice: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="8" cy="8" r="1.5" fill={color} stroke="none" />
        <circle cx="16" cy="16" r="1.5" fill={color} stroke="none" />
        <circle cx="8" cy="16" r="1.5" fill={color} stroke="none" />
        <circle cx="16" cy="8" r="1.5" fill={color} stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
    </svg>
);

export const IconKey: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
);

export const IconRobot: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
);

export const IconHourglass: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 17.29A1 1 0 0 0 5 19h14a1 1 0 0 0 1-1.71L14 11.12a1 1 0 0 0 0-1.24l6-6.17A1 1 0 0 0 19 2H5a1 1 0 0 0-1 1.71l6 6.17a1 1 0 0 0 0 1.24l-6 6.17z" />
        <line x1="2" y1="2" x2="22" y2="2" />
        <line x1="2" y1="22" x2="22" y2="22" />
    </svg>
);

export const IconSend: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export const IconChat: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

export const IconUndo: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
);

export const IconGrid: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);

export const IconShogi: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
        <path d="M12 6v4" />
        <path d="M10 10h4" />
        <path d="M9 14l3 3 3-3" />
    </svg>
);

export const IconReversi: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" fill={color} />
    </svg>
);

export const IconGomoku: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
        <circle cx="9" cy="9" r="2" fill={color} stroke="none" />
        <circle cx="15" cy="15" r="2" fill={color} stroke="none" />
        <circle cx="15" cy="9" r="2" fill={color} stroke="none" />
        <circle cx="9" cy="15" r="2" fill={color} stroke="none" />
        <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
    </svg>
);

export const IconMancala: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="6" width="20" height="12" rx="6" />
        <circle cx="6" cy="12" r="1.5" fill={color} stroke="none" />
        <circle cx="10" cy="12" r="1.5" fill={color} stroke="none" />
        <circle cx="14" cy="12" r="1.5" fill={color} stroke="none" />
        <circle cx="18" cy="12" r="1.5" fill={color} stroke="none" />
    </svg>
);

export const IconChess: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L12 22" />
        <path d="M7 22L17 22" />
        <path d="M7 18L17 18" />
        <path d="M8 10L16 10" />
        <path d="M9 6L15 6" />
        <path d="M10 2L14 2" />
    </svg>
);

export const IconCards: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="6" y="2" width="12" height="16" rx="2" transform="rotate(-10 12 10)" />
        <rect x="6" y="6" width="12" height="16" rx="2" transform="rotate(10 12 14)" fill={color} fillOpacity="0.1" />
    </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export const IconPen: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
);

export const IconPalette: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="13.5" cy="6.5" r="1.5" fill={color} stroke="none" />
        <circle cx="17.5" cy="10.5" r="1.5" fill={color} stroke="none" />
        <circle cx="8.5" cy="7.5" r="1.5" fill={color} stroke="none" />
        <circle cx="6.5" cy="12.5" r="1.5" fill={color} stroke="none" />
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.25 0 5.5-2 5.5-4 0-1-1-2-2-2h-1c-1.1 0-2-.9-2-2 0-.37.1-.7.29-1C13.2 13.15 14.08 13 15 13c3.31 0 6-2.69 6-6 0-2.76-2.24-5-5-5z" />
    </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export const IconCheckers: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" fill={color} stroke="none" />
    </svg>
);

export const IconX: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const IconTrash: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

export const IconEraser: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z" />
        <path d="M17 17L7 7" />
    </svg>
);

export const IconConnect4: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" fill={color} fillOpacity="0.2" stroke={color} />
        <circle cx="8" cy="8" r="2" fill={color} />
        <circle cx="16" cy="8" r="2" fill={color} />
        <circle cx="8" cy="16" r="2" fill={color} />
        <circle cx="16" cy="16" r="2" fill={color} />
    </svg>
);

export const IconSwords: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
        <path d="M16 16l4 4" />
        <path d="M19 21l2-2" />
    </svg>
);

export const IconShield: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

export const IconStaff: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 4.5l3 3" />
        <path d="M18.5 4.5l-3 3" />
        <path d="M12 8l-6 12" />
        <path d="M12 2l2 2" />
        <circle cx="16.5" cy="7.5" r=".5" fill={color} stroke="none" />
    </svg>
);

export const IconPotion: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21H5a2 2 0 0 1-2-2V11l4-6h10l4 6v8a2 2 0 0 1-2 2z" />
        <path d="M12 3v4" />
        <path d="M12 13v.01" />
        <path d="M9 16v.01" />
        <path d="M15 16v.01" />
    </svg>
);

export const IconStar: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

export const IconBow: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10" />
        <path d="M12 2v20" />
        <path d="M22 12h-4" />
        <path d="M18 12l-3-3" />
        <path d="M18 12l-3 3" />
    </svg>
);

export const IconAxe: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 12l-8.5 8.5a2.121 2.121 0 0 1-3-3L11 9" />
        <path d="M15 13l5.5-5.5" />
        <path d="M9 7l5 5 5-5a5 5 0 0 0-10 0z" />
    </svg>
);

export const IconHammer: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M13 13l6 6" />
        <path d="M13 21l6-6" />
        <path d="M3 3l10 10" />
        <path d="M2 8l6-6 4 4-6 6z" />
    </svg>
);

export const IconSpear: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 3l-6 6" />
        <path d="M3 21l12-12" />
        <path d="M15 9l6-6" />
        <path d="M15 3l6 6" />
    </svg>
);

export const IconDagger: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
    </svg>
);

export const IconFire: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.7 1.9 1.9 2.8 2.9 3.3z" />
    </svg>
);

export const IconWater: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
);

export const IconWind: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
);

export const IconEarth: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" />
        <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" />
        <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />
        <circle cx="12" cy="12" r="10" />
    </svg>
);

export const IconHoly: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

export const IconDark: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

export const IconScroll: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

export const IconRing: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 5v-2" />
        <path d="M12 21v-2" />
        <path d="M5 12h-2" />
        <path d="M21 12h-2" />
    </svg>
);

export const IconBoot: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
        <path d="M14 2v6h6" />
        <path d="M10 22v-8" />
    </svg>
);
