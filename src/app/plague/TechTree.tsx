import React, { useRef, useEffect, useState } from 'react';
import { GameState } from '@/lib/plague/types';
import { TRAITS } from '@/lib/plague/data';
import { TECH_TREE_LAYOUT } from '@/lib/plague/techTreeLayout';
import { THEME } from './styles';
import { soundManager } from '@/lib/plague/SoundManager';

interface TechTreeProps {
    gameState: GameState;
    evolveTrait: (id: string) => void;
}

export const TechTree = ({ gameState, evolveTrait }: TechTreeProps) => {
    // Pan/Zoom state
    const [transform, setTransform] = useState({ x: 400, y: 300, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        const newScale = Math.max(0.5, Math.min(2, transform.scale - e.deltaY * 0.001));
        setTransform(prev => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastPos.x;
        const dy = e.clientY - lastPos.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    // Filter traits that have positions
    const traitsWithPos = TRAITS.filter(t => TECH_TREE_LAYOUT[t.id]);

    return (
        <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: `radial-gradient(circle at center, #1a202c 0%, #000 100%)`,
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                border: `1px solid ${THEME.colors.border}`,
                borderRadius: '2px'
            }}
        >
            {/* Grid Background */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.2,
                pointerEvents: 'none',
                transform: `translate(${transform.x % 40}px, ${transform.y % 40}px) scale(${transform.scale})`, // Parallax-ish
                transformOrigin: '0 0'
            }} />

            <div style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: '0 0',
                position: 'absolute',
                top: 0, left: 0
            }}>
                <svg style={{ overflow: 'visible', pointerEvents: 'none' }}>
                    {/* Connections */}
                    {traitsWithPos.map(trait => {
                        if (!trait.reqTraits) return null;
                        return trait.reqTraits.map(reqId => {
                            const start = TECH_TREE_LAYOUT[reqId];
                            const end = TECH_TREE_LAYOUT[trait.id];
                            if (!start || !end) return null;

                            // Curve
                            const midY = (start.y + end.y) / 2;
                            const d = `M ${start.x},${start.y} C ${start.x},${midY} ${end.x},${midY} ${end.x},${end.y}`;

                            const isUnlocked = gameState.traits[trait.id] && gameState.traits[reqId];

                            return (
                                <path
                                    key={`${reqId}-${trait.id}`}
                                    d={d}
                                    stroke={isUnlocked ? THEME.colors.primary : '#555'}
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                        });
                    })}
                </svg>

                {/* Nodes */}
                {traitsWithPos.map(trait => {
                    const pos = TECH_TREE_LAYOUT[trait.id];
                    const isUnlocked = gameState.traits[trait.id];
                    const canAfford = gameState.dnaPoints >= trait.cost;
                    const isLockedByDep = trait.reqTraits && trait.reqTraits.some(req => !gameState.traits[req]);

                    let color = THEME.colors.textMuted;
                    if (trait.type === 'transmission') color = THEME.colors.primary;
                    if (trait.type === 'symptom') color = THEME.colors.danger;
                    if (trait.type === 'ability') color = THEME.colors.info;

                    if (!isUnlocked && !canAfford) color = '#555';

                    return (
                        <div
                            key={trait.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isUnlocked && !isLockedByDep && canAfford) {
                                    evolveTrait(trait.id);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                left: pos.x,
                                top: pos.y,
                                transform: 'translate(-50%, -50%)',
                                width: '100px',
                                height: '100px',
                                background: isUnlocked ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
                                border: `2px solid ${isUnlocked ? color : (isLockedByDep ? '#333' : (canAfford ? color : '#555'))}`,
                                borderRadius: '50%', // Hexagon ideally, but circle is easy
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '10px',
                                textAlign: 'center',
                                cursor: (isUnlocked || isLockedByDep) ? 'default' : (canAfford ? 'pointer' : 'not-allowed'),
                                boxShadow: isUnlocked ? `0 0 20px ${color}66` : 'none',
                                transition: 'all 0.3s',
                                zIndex: 10,
                                opacity: isLockedByDep ? 0.5 : 1
                            }}
                        >
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isUnlocked ? color : '#ccc', marginBottom: '4px' }}>
                                {trait.name}
                            </div>
                            {!isUnlocked && (
                                <div style={{ fontSize: '0.7rem', color: canAfford ? THEME.colors.warning : '#777' }}>
                                    {trait.cost} DNA
                                </div>
                            )}
                            {isUnlocked && <div style={{ color: color }}>✓</div>}
                        </div>
                    );
                })}
            </div>

            {/* UI overlay for hints */}
            <div style={{ position: 'absolute', bottom: 10, right: 10, color: '#555', fontSize: '0.8rem', pointerEvents: 'none' }}>
                [スクロール] 拡大・縮小 • [ドラッグ] 移動
            </div>
        </div>
    );
};
