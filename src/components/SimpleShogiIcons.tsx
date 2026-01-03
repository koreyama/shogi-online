import React from 'react';

// King (Lion) -> Demon Lord (Crown/Helm)
export const IconKing = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        <path d="M12 6v4" />
        <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
);

// Rook (Giraffe) -> Warrior (Crossed Swords)
export const IconRook = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
        <path d="M16 16l4 4" />
        <path d="M19 21l2-2" />
        {/* Second Sword */}
        <path d="M9.5 17.5L21 6V3h-3L6.5 11.5" />
        <path d="M11 19l-6-6" />
        <path d="M8 16l-4 4" />
        <path d="M5 21l-2-2" />
    </svg>
);

// Bishop (Elephant) -> Mage (Magic Staff)
export const IconBishop = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2l-2.5 5h-4L6 2" />
        <path d="M10 7v10" />
        <path d="M8 17h4l-2 5-2-5z" />
        {/* Magic Aura */}
        <path d="M19 5l-2 2" />
        <path d="M21 9l-2-1" />
        <path d="M16 3l1 2" />
        <circle cx="10" cy="4" r="1" fill="currentColor" />
    </svg>
);

// Gold (Hen/Promoted) -> Hero (Shield)
export const IconGold = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
    </svg>
);

// Pawn (Chick) -> Slime
export const IconPawn = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 5 6 5 12c0 5 3 9 7 9s7-4 7-9c0-6-3-10-7-10z" />
        {/* Face */}
        <circle cx="9" cy="11" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11" r="1.5" fill="currentColor" stroke="none" />
        <path d="M10 15a2 2 0 0 0 4 0" />
    </svg>
);

// Silver (Unused in Dobutsu but kept for compatibility)
export const IconSilver = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8l-4 4 4 4 4-4-4-4z" />
    </svg>
);

export const IconDragon = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const IconHorse = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l5 9h-10l5-9z" />
        <path d="M12 11l-3 11h6l-3-11z" />
        <path d="M2 11h20" />
    </svg>
);

export const IconPromotedSilver = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l-5 9h10l-5-9z" />
        <rect x="7" y="11" width="10" height="11" />
    </svg>
);

export const IconPromotedPawn = ({ size = 24, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v10" />
        <path d="M7 12h10" />
    </svg>
);
