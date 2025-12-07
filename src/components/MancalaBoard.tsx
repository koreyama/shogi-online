import React, { useEffect, useState, useRef } from 'react';
import styles from './MancalaBoard.module.css';
import { BoardState, Player, FIRST_STORE, SECOND_STORE } from '@/lib/mancala/types';

interface MancalaBoardProps {
    board: BoardState;
    onPitClick: (index: number) => void;
    turn: Player;
    isMyTurn: boolean;
    winner: Player | 'draw' | null;
    myRole: Player | null;
}

// Sub-component for individual Pits/Stores to handle animations
const Pit = ({
    index,
    seeds,
    isStore,
    isActive,
    onClick
}: {
    index: number;
    seeds: number;
    isStore: boolean;
    isActive: boolean;
    onClick: () => void;
}) => {
    const [animateClass, setAnimateClass] = useState('');
    const prevSeeds = useRef(seeds);

    useEffect(() => {
        if (seeds > prevSeeds.current) {
            setAnimateClass(styles.popIn);
            const timer = setTimeout(() => setAnimateClass(''), 300);
            return () => clearTimeout(timer);
        } else if (seeds < prevSeeds.current) {
            setAnimateClass(styles.popOut);
            const timer = setTimeout(() => setAnimateClass(''), 300);
            return () => clearTimeout(timer);
        }
        prevSeeds.current = seeds;
    }, [seeds]);

    // Generate seeds for visualization
    const seedElements = [];
    for (let i = 0; i < seeds; i++) {
        // Deterministic random based on index and seed index
        // Use a slightly different seed calculation to avoid pattern artifacts
        const seedId = index * 1000 + i;
        // Box-Mullerish or just distributed random
        const randomX = ((seedId * 9301 + 49297) % 233280) / 233280 * 60 + 20;
        const randomY = ((seedId * 49297 + 9301) % 233280) / 233280 * 60 + 20;
        const hue = ((seedId * 12345) % 360);

        seedElements.push(
            <div
                key={i}
                className={styles.seed}
                style={{
                    left: `${randomX}%`,
                    top: `${randomY}%`,
                    backgroundColor: `hsl(${hue}, 75%, 60%)`,
                    transform: `translate(-50%, -50%) rotate(${seedId % 360}deg)`
                }}
            />
        );
    }

    return (
        <div
            className={`
                ${isStore ? styles.store : styles.pit} 
                ${isActive ? styles.active : styles.disabled}
                ${animateClass}
            `}
            onClick={isActive ? onClick : undefined}
        >
            {seeds > 0 && (
                <div className={`${styles.seedCount} ${animateClass ? styles.bump : ''}`}>
                    {seeds}
                </div>
            )}
            <div className={styles.seedsContainer}>
                {seedElements}
            </div>
            {isStore && <span className={styles.storeLabel}>STORE</span>}
        </div>
    );
};

const MancalaBoard: React.FC<MancalaBoardProps> = ({
    board,
    onPitClick,
    turn,
    isMyTurn,
    winner,
    myRole
}) => {
    const topRowIndices = [12, 11, 10, 9, 8, 7];
    const bottomRowIndices = [0, 1, 2, 3, 4, 5];

    const getIsPitActive = (index: number) => {
        const seeds = board[index];
        const isMyPit = (turn === 'first' && index < FIRST_STORE) || (turn === 'second' && index > FIRST_STORE && index < SECOND_STORE);
        return !winner && isMyTurn && isMyPit && seeds > 0;
    };

    const isSecondView = myRole === 'second';

    return (
        <div className={styles.boardContainer}>
            <div className={`${styles.playerLabel} ${styles.topLabel} ${turn === 'second' ? styles.activeTurn : ''}`}>
                {isSecondView ? 'YOU (Second)' : 'OPPONENT (Second)'}
            </div>

            <div
                className={`${styles.board} ${isSecondView ? styles.rotated : ''}`}
            >
                {/* Second Player's Store (Left) */}
                <div style={{ transform: isSecondView ? 'rotate(180deg)' : 'none' }}>
                    <Pit
                        index={SECOND_STORE}
                        seeds={board[SECOND_STORE]}
                        isStore={true}
                        isActive={false}
                        onClick={() => { }}
                    />
                </div>

                <div className={styles.pitsContainer}>
                    <div className={styles.row}>
                        {topRowIndices.map(i => (
                            <div key={i} style={{ transform: isSecondView ? 'rotate(180deg)' : 'none' }}>
                                <Pit
                                    index={i}
                                    seeds={board[i]}
                                    isStore={false}
                                    isActive={getIsPitActive(i)}
                                    onClick={() => onPitClick(i)}
                                />
                            </div>
                        ))}
                    </div>
                    <div className={styles.row}>
                        {bottomRowIndices.map(i => (
                            <div key={i} style={{ transform: isSecondView ? 'rotate(180deg)' : 'none' }}>
                                <Pit
                                    index={i}
                                    seeds={board[i]}
                                    isStore={false}
                                    isActive={getIsPitActive(i)}
                                    onClick={() => onPitClick(i)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* First Player's Store (Right) */}
                <div style={{ transform: isSecondView ? 'rotate(180deg)' : 'none' }}>
                    <Pit
                        index={FIRST_STORE}
                        seeds={board[FIRST_STORE]}
                        isStore={true}
                        isActive={false}
                        onClick={() => { }}
                    />
                </div>
            </div>

            <div className={`${styles.playerLabel} ${styles.bottomLabel} ${turn === 'first' ? styles.activeTurn : ''}`}>
                {isSecondView ? 'OPPONENT (First)' : 'YOU (First)'}
            </div>
        </div>
    );
};

export default MancalaBoard;
