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

export const IconOthello: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
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
        <circle cx="13.5" cy="6.5" r=".5" fill={color} stroke="none" />
        <circle cx="17.5" cy="10.5" r=".5" fill={color} stroke="none" />
        <circle cx="8.5" cy="7.5" r=".5" fill={color} stroke="none" />
        <circle cx="6.5" cy="12.5" r=".5" fill={color} stroke="none" />
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.25 0 5.5-2 5.5-4 0-1-1-2-2-2h-1c-1.1 0-2-.9-2-2 0-.37.1-.7.29-1C13.2 13.15 14.08 13 15 13c3.31 0 6-2.69 6-6 0-2.76-2.24-5-5-5z" />
    </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
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
