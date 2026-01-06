import React, { useState } from 'react';
import styles from './page.module.css';
import { GoBoard as GoBoardType, StoneColor } from '@/lib/go/types';

interface GoBoardProps {
    board: GoBoardType;
    myColor: StoneColor | 'spectator';
    isMyTurn: boolean;
    onMove: (x: number, y: number) => void;
}

export function GoBoard({ board, myColor, isMyTurn, onMove }: GoBoardProps) {
    const { size, grid } = board;
    const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

    // Dynamic grid template
    const gridStyle = {
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
        width: 'min(90vw, 600px)',
        height: 'min(90vw, 600px)',
    };

    const handleMouseEnter = (x: number, y: number) => {
        if (!isMyTurn || myColor === 'spectator') return;
        setHoverPos({ x, y });
    };

    const handleMouseLeave = () => {
        setHoverPos(null);
    };

    const handleClick = (x: number, y: number) => {
        if (!isMyTurn || myColor === 'spectator') return;
        onMove(x, y);
    };

    // Determine star points based on board size
    const getStarPoints = (sz: number) => {
        if (sz === 19) return [
            { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
            { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
            { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
        ];
        if (sz === 13) return [
            { x: 3, y: 3 }, { x: 9, y: 3 },
            { x: 6, y: 6 },
            { x: 3, y: 9 }, { x: 9, y: 9 }
        ];
        if (sz === 9) return [
            { x: 4, y: 4 },
            { x: 2, y: 2 }, { x: 6, y: 2 },
            { x: 2, y: 6 }, { x: 6, y: 6 }
        ];
        return [];
    };
    const stars = getStarPoints(size);
    const isStar = (x: number, y: number) => stars.some(s => s.x === x && s.y === y);

    return (
        <div className={styles.goban} style={gridStyle} onMouseLeave={handleMouseLeave}>
            {grid.map((row, y) => (
                row.map((cell, x) => {
                    const isTop = y === 0;
                    const isBottom = y === size - 1;
                    const isLeft = x === 0;
                    const isRight = x === size - 1;

                    let classes = styles.cell;
                    if (isTop) classes += ` ${styles.top}`;
                    if (isBottom) classes += ` ${styles.bottom}`;
                    if (isLeft) classes += ` ${styles.left}`;
                    if (isRight) classes += ` ${styles.right}`;

                    const showGhost = hoverPos?.x === x && hoverPos?.y === y && !cell && isMyTurn && myColor !== 'spectator';

                    return (
                        <div
                            key={`${x}-${y}`}
                            className={classes}
                            onClick={() => handleClick(x, y)}
                            onMouseEnter={() => handleMouseEnter(x, y)}
                        >
                            {/* Star point */}
                            {isStar(x, y) && <div className={styles.starPoint} />}

                            {/* Stone */}
                            {cell === 'black' && <div className={`${styles.stone} ${styles.black}`} />}
                            {cell === 'white' && <div className={`${styles.stone} ${styles.white}`} />}

                            {/* Ghost Stone */}
                            {showGhost && (
                                <div className={`${styles.stoneGhost} ${styles[myColor]}`} />
                            )}
                        </div>
                    );
                })
            ))}
        </div>
    );
}
