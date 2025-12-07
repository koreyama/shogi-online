import React, { useMemo } from 'react';
import { GameState } from '@/lib/plague/types';
import { THEME } from './styles';

export const InfectionGraph = ({ gameState }: { gameState: GameState }) => {
    const { history } = gameState;

    if (history.length < 2) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
                COLLECTING DATA...
            </div>
        );
    }

    // Graph Dimensions
    const width = 800;
    const height = 400;
    const padding = 40;

    // Scales
    const maxVal = useMemo(() => {
        return Math.max(
            ...history.map(h => h.infected + h.dead), // Total Population involved
            100 // Min scale
        );
    }, [history]);

    const minDate = history[0].date;
    const maxDate = history[history.length - 1].date;
    const timeRange = maxDate - minDate;

    // Helper to plot points
    const getX = (date: number) => padding + ((date - minDate) / timeRange) * (width - padding * 2);
    const getY = (val: number) => height - padding - (val / maxVal) * (height - padding * 2);

    // SVG Paths
    const infectedPath = useMemo(() => {
        return history.map((h, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(h.date)} ${getY(h.infected)}`
        ).join(' ');
    }, [history, maxVal]);

    const deadPath = useMemo(() => {
        return history.map((h, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(h.date)} ${getY(h.dead)}`
        ).join(' ');
    }, [history, maxVal]);

    const curePath = useMemo(() => {
        // Cure is 0-100, so we scale it to separate axis or simple overlay?
        // Let's overlay at 20% height for full cure
        return history.map((h, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(h.date)} ${height - padding - (h.cure / 100) * (height - padding * 2)}`
        ).join(' ');
    }, [history]);

    return (
        <div style={{ width: '100%', height: '100%', background: '#111', padding: '20px', overflow: 'hidden' }}>
            <h2 style={{ color: THEME.colors.primary, margin: '0 0 10px 0', fontSize: '1.2rem', fontFamily: THEME.fonts.mono }}>
                INFECTION ANALYSIS
            </h2>
            <div style={{ width: '100%', height: 'calc(100% - 40px)', position: 'relative' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(p => (
                        <line
                            key={p}
                            x1={padding}
                            y1={height - padding - p * (height - padding * 2)}
                            x2={width - padding}
                            y2={height - padding - p * (height - padding * 2)}
                            stroke="#333"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Paths */}
                    <path d={infectedPath} fill="none" stroke={THEME.colors.danger} strokeWidth="2" />
                    <path d={deadPath} fill="none" stroke="#666" strokeWidth="2" />
                    <path d={curePath} fill="none" stroke={THEME.colors.info} strokeWidth="2" strokeDasharray="2 2" />

                    {/* Legend */}
                    <g transform={`translate(${padding + 10}, ${padding + 10})`}>
                        <rect width="10" height="10" fill={THEME.colors.danger} />
                        <text x="15" y="10" fill="#fff" fontSize="10">INFECTED</text>

                        <rect y="20" width="10" height="10" fill="#666" />
                        <text x="15" y="30" fill="#fff" fontSize="10">DEAD</text>

                        <rect y="40" width="10" height="10" fill="none" stroke={THEME.colors.info} strokeWidth="2" />
                        <text x="15" y="50" fill="#fff" fontSize="10">CURE %</text>
                    </g>
                </svg>
            </div>

        </div>
    );
};
