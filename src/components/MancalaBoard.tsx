import React from 'react';
import styles from './MancalaBoard.module.css';
import { BoardState, Player, FIRST_STORE, SECOND_STORE, PITS_PER_PLAYER } from '@/lib/mancala/types';

interface MancalaBoardProps {
    board: BoardState;
    onPitClick: (index: number) => void;
    turn: Player;
    isMyTurn: boolean;
    winner: Player | 'draw' | null;
    myRole: Player | null;
}

const MancalaBoard: React.FC<MancalaBoardProps> = ({
    board,
    onPitClick,
    turn,
    isMyTurn,
    winner,
    myRole
}) => {
    // 常に自分が下側に来るように表示を反転させるロジックを入れると親切だが、
    // マンカラは左右対称ではない（反時計回り）ので、固定表示の方が混乱が少ないかも。
    // ここでは固定表示（下がFirst Player、上がSecond Player）とする。
    // ただし、自分がSecond Playerの場合は、自分が上側であることを認識しやすくする必要がある。
    // -> プレイヤー名を上下に表示することで対応。

    const renderPit = (index: number, isStore: boolean = false) => {
        const seeds = board[index];
        const isMyPit = (turn === 'first' && index < FIRST_STORE) || (turn === 'second' && index > FIRST_STORE && index < SECOND_STORE);
        const isActive = !isStore && !winner && isMyTurn && isMyPit && seeds > 0;

        // Generate seeds for visualization
        const seedElements = [];
        for (let i = 0; i < seeds; i++) {
            // Deterministic random based on index and seed index to keep positions stable
            const seedId = index * 100 + i;
            const randomX = ((seedId * 9301 + 49297) % 233280) / 233280 * 60 + 20; // 20% - 80%
            const randomY = ((seedId * 49297 + 9301) % 233280) / 233280 * 60 + 20; // 20% - 80%
            const hue = ((seedId * 12345) % 360); // Random color

            seedElements.push(
                <div
                    key={i}
                    className={styles.seed}
                    style={{
                        left: `${randomX}%`,
                        top: `${randomY}%`,
                        backgroundColor: `hsl(${hue}, 70%, 60%)`,
                        transform: `translate(-50%, -50%)`
                    }}
                />
            );
        }

        return (
            <div
                key={index}
                className={`${isStore ? styles.store : styles.pit} ${isActive ? styles.active : styles.disabled}`}
                onClick={() => isActive ? onPitClick(index) : undefined}
            >
                {seeds > 0 && (
                    <div className={styles.seedCount}>
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

    // 上側 (Second Player): index 12 -> 7 (左から右へ、反時計回りの流れを表現するため逆順？)
    // マンカラのボードは通常、反時計回りに回る。
    // 下側 (First): 左(0) -> 右(5) -> Store(6)
    // 上側 (Second): 右(7) -> 左(12) -> Store(13)
    // 画面上では：
    //       12 11 10  9  8  7
    //   13                    6
    //        0  1  2  3  4  5

    const topRowIndices = [12, 11, 10, 9, 8, 7];
    const bottomRowIndices = [0, 1, 2, 3, 4, 5];

    return (
        <div className={styles.boardContainer}>
            <div className={styles.playerLabel + ' ' + styles.topLabel}>
                {myRole === 'second' ? 'YOU' : 'OPPONENT'}
            </div>

            <div className={styles.board}>
                {/* Second Player's Store (Left) */}
                {renderPit(SECOND_STORE, true)}

                <div className={styles.pitsContainer}>
                    <div className={styles.row}>
                        {topRowIndices.map(i => renderPit(i))}
                    </div>
                    <div className={styles.row}>
                        {bottomRowIndices.map(i => renderPit(i))}
                    </div>
                </div>

                {/* First Player's Store (Right) */}
                {renderPit(FIRST_STORE, true)}
            </div>

            <div className={styles.playerLabel + ' ' + styles.bottomLabel}>
                {myRole === 'first' ? 'YOU' : 'OPPONENT'}
            </div>
        </div>
    );
};

export default MancalaBoard;
