import React, { useState } from 'react';
import { WORLD_PATHS, REGION_CENTERS, AIR_ROUTES, SEA_ROUTES } from '@/lib/plague/mapData';
import { Region, Bubble } from '@/lib/plague/types';
import { THEME } from './styles';
import { InfectionOverlay } from './InfectionOverlay';
import { ParticleCanvas, PEvent } from './ParticleCanvas';

interface WorldMapProps {
    regions: Record<string, Region>;
    bubbles: Bubble[];
    onPop: (id: string) => void;
}

const TransportVehicle = ({ start, end, type, duration = '3s' }: any) => {
    const startPos = REGION_CENTERS[start];
    const endPos = REGION_CENTERS[end];
    if (!startPos || !endPos) return null;

    const midX = (startPos.x + endPos.x) / 2;
    const midY = (startPos.y + endPos.y) / 2 - 30; // Arc up
    const pathD = `M ${startPos.x},${startPos.y} Q ${midX},${midY} ${endPos.x},${endPos.y}`;

    return (
        <g>
            <path d={pathD} stroke="rgba(255,255,255,0.1)" fill="none" strokeDasharray="4 4" />
            <circle r="3" fill={type === 'plane' ? '#63b3ed' : '#f6e05e'}>
                <animateMotion dur={duration} repeatCount="indefinite" path={pathD} />
            </circle>
        </g>
    );
};

export const WorldMap = ({ regions, bubbles, onPop }: WorldMapProps) => {
    const [floatingTexts, setFloatingTexts] = useState<{ id: number, x: number, y: number, text: string }[]>([]);
    const [particleEvents, setParticleEvents] = useState<PEvent[]>([]);

    const handleBubbleClick = (e: React.MouseEvent, b: Bubble, left: number, top: number) => {
        e.stopPropagation();
        onPop(b.id);

        const textId = Date.now();
        setFloatingTexts(prev => [...prev, { id: textId, x: left, y: top, text: '+DNA' }]);

        const px = (left / 100) * 800;
        const py = (top / 100) * 400;

        let color = '#ffff00';
        if (b.type === 'dna') color = '#f5d90a';
        if (b.type === 'cure') color = '#05d9e8';

        setParticleEvents(prev => [...prev, { type: 'trigger_spark', x: px, y: py, color }]);

        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(t => t.id !== textId));
        }, 1000);
    };

    const getRegionColor = (r: Region) => {
        const percentInfected = r.infected / r.population;
        const percentDead = r.dead / r.population;

        // Base Land Color (Satellite Night View)
        if (percentDead > 0.9) return '#101010'; // Dead wasteland
        if (percentInfected === 0 && r.dead === 0) return '#1a2634'; // Clean Land

        // Infection Gradient (Red Neon Overlay)
        const intensity = Math.min(1, percentInfected);
        // We simulate a glowing red mix
        // Base #1a2634 (26, 38, 52) -> Target #ff2a6d (255, 42, 109)
        // Manual mix for performance
        if (r.borderClosed) {
            // Darker red if closed
            return `rgba(150, 20, 50, ${0.5 + intensity * 0.5})`;
        }
        return `rgba(255, 42, 109, ${0.4 + intensity * 0.6})`;
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, #0a1929 0%, #000 90%)', // Deep Ocean with gradient
            border: `1px solid ${THEME.colors.primary}`,
            boxShadow: `inset 0 0 50px rgba(0,0,0,0.8)`, // Vignette
            overflow: 'hidden'
        }}>
            {/* Infection Overlay (Canvas) */}
            <InfectionOverlay regions={regions} />

            {/* Holographic Hex Grid */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(0, 255, 157, 0.1) 0%, transparent 80%),
                    linear-gradient(0deg, transparent 24%, rgba(0, 255, 157, .1) 25%, rgba(0, 255, 157, .1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 157, .1) 75%, rgba(0, 255, 157, .1) 76%, transparent 77%, transparent),
                    linear-gradient(90deg, transparent 24%, rgba(0, 255, 157, .1) 25%, rgba(0, 255, 157, .1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 157, .1) 75%, rgba(0, 255, 157, .1) 76%, transparent 77%, transparent)
                `,
                backgroundSize: '100% 100%, 50px 50px, 50px 50px',
                pointerEvents: 'none',
                zIndex: 5,
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)'
            }} />

            {/* Atmosphere Glow */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(0, 168, 255, 0.2) 100%)',
                zIndex: 6,
                pointerEvents: 'none',
                mixBlendMode: 'screen'
            }} />

            {/* Scanning Line Animation */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'rgba(0, 255, 157, 0.5)',
                boxShadow: '0 0 10px rgba(0, 255, 157, 0.8)',
                zIndex: 7,
                pointerEvents: 'none',
                animation: 'scan 4s linear infinite'
            }} />
            <style jsx>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>

            {/* Rotating Data Rings (Decoration) */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '600px', height: '600px',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'spin 60s linear infinite',
                pointerEvents: 'none',
                zIndex: 4
            }} />
            <style jsx>{`
                @keyframes spin {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
            `}</style>

            {/* Particle Canvas Layer */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 25, pointerEvents: 'none' }}>
                <ParticleCanvas width={800} height={400} events={particleEvents} />
            </div>

            {/* Floating Texts */}
            {floatingTexts.map(t => (
                <div key={t.id} style={{
                    position: 'absolute',
                    top: `${t.y}%`,
                    left: `${t.x}%`,
                    color: THEME.colors.warning,
                    fontFamily: THEME.fonts.mono,
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    pointerEvents: 'none',
                    zIndex: 30,
                    textShadow: `0 0 5px ${THEME.colors.warning}`,
                    animation: 'floatUp 1s forwards'
                }}>
                    {t.text}
                </div>
            ))}

            <svg
                viewBox="0 0 800 400"
                style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10, filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
            >
                <defs>
                    {/* Land Texture Pattern */}
                    <pattern id="land-pattern" width="4" height="4" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.03)" />
                    </pattern>
                </defs>

                {/* Transport Routes */}
                {AIR_ROUTES.map((route, i) => (
                    <TransportVehicle key={`air-${i}`} start={route[0]} end={route[1]} type="plane" duration={`${4 + i}s`} />
                ))}
                {SEA_ROUTES.map((route, i) => (
                    <TransportVehicle key={`sea-${i}`} start={route[0]} end={route[1]} type="ship" duration={`${8 + i}s`} />
                ))}

                {/* Regions */}
                {Object.values(regions).map((r) => {
                    const path = WORLD_PATHS[r.id];
                    if (!path) return null;

                    const color = getRegionColor(r);

                    return (
                        <g key={r.id}>
                            <path
                                d={path}
                                fill={color}
                                stroke={r.borderClosed ? THEME.colors.danger : 'rgba(0, 255, 157, 0.3)'}
                                strokeWidth={r.borderClosed ? "1.5" : "0.5"}
                                strokeOpacity={1}
                                strokeDasharray={r.borderClosed ? "4 2" : "none"}
                                style={{
                                    transition: 'all 0.5s',
                                    cursor: 'pointer'
                                }}
                            >
                                <title>{r.name} {r.borderClosed ? '[国境封鎖]' : ''} (感染: {(r.infected / r.population * 100).toFixed(1)}%)</title>
                            </path>
                            {/* Texture Overlay */}
                            <path d={path} fill="url(#land-pattern)" style={{ pointerEvents: 'none' }} />
                        </g>
                    );
                })}
            </svg>

            {/* Overlay Bubbles */}
            {bubbles.map(b => {
                const center = REGION_CENTERS[b.regionId];
                if (!center) return null;

                const top = (center.y / 400) * 100;
                const left = (center.x / 800) * 100;

                let bgColor = 'rgba(255, 42, 109, 0.2)';
                let borderColor = THEME.colors.danger;
                let icon = '☣️';

                if (b.type === 'dna') {
                    bgColor = 'rgba(245, 217, 10, 0.2)';
                    borderColor = THEME.colors.warning;
                    icon = '🧬';
                } else if (b.type === 'cure') {
                    bgColor = 'rgba(5, 217, 232, 0.2)';
                    borderColor = THEME.colors.info;
                    icon = '🏥';
                }

                return (
                    <div
                        key={b.id}
                        onClick={(e) => handleBubbleClick(e, b, left, top)}
                        style={{
                            position: 'absolute',
                            top: `calc(${top}% - 20px)`,
                            left: `calc(${left}% - 20px)`,
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: bgColor,
                            border: `2px solid ${borderColor}`,
                            boxShadow: `0 0 15px ${borderColor}`,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            zIndex: 20,
                            animation: b.type === 'cure' ? 'pulse 2s infinite' : 'bounce 1s infinite',
                            fontSize: '1.2rem',
                            backdropFilter: 'blur(2px)'
                        }}
                    >
                        {icon}
                    </div>
                );
            })}
            <style jsx>{`
                @keyframes bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(5, 217, 232, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(5, 217, 232, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(5, 217, 232, 0); }
                }
                @keyframes floatUp {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-30px); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
