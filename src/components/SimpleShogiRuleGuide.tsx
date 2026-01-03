import React from 'react';
import { IconKing, IconRook, IconBishop, IconPawn, IconGold } from './SimpleShogiIcons';
import styles from './SimpleShogiRuleGuide.module.css';

const MovementGrid = ({ pattern }: { pattern: number[][] }) => {
    // 3x3 grid, center is (1,1)
    const cells = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const isCenter = r === 1 && c === 1;
            const isMove = pattern.some(([dr, dc]) => 1 + dr === r && 1 + dc === c);
            cells.push(
                <div key={`${r}-${c}`} className={`${styles.guideCell} ${isCenter ? styles.center : ''} ${isMove ? styles.move : ''}`}>
                </div>
            );
        }
    }
    return <div className={styles.guideGrid}>{cells}</div>;
};

export default function SimpleShogiRuleGuide() {
    return (
        <div className={styles.guideContainer}>
            <h3 className={styles.guideTitle}>駒の動き</h3>
            <div className={styles.pieceList}>
                <div className={styles.pieceItem}>
                    <div className={styles.iconWrapper}><IconKing size={24} /></div>
                    <div className={styles.pieceName}>魔王 (King)</div>
                    <MovementGrid pattern={[[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]} />
                </div>
                <div className={styles.pieceItem}>
                    <div className={styles.iconWrapper}><IconRook size={24} /></div>
                    <div className={styles.pieceName}>戦士 (Warrior)</div>
                    <MovementGrid pattern={[[-1, 0], [1, 0], [0, -1], [0, 1]]} />
                </div>
                <div className={styles.pieceItem}>
                    <div className={styles.iconWrapper}><IconBishop size={24} /></div>
                    <div className={styles.pieceName}>魔法使い (Mage)</div>
                    <MovementGrid pattern={[[-1, -1], [-1, 1], [1, -1], [1, 1]]} />
                </div>
                <div className={styles.pieceItem}>
                    <div className={styles.iconWrapper}><IconGold size={24} /></div>
                    <div className={styles.pieceName}>勇者 (Hero)</div>
                    <MovementGrid pattern={[[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]]} />
                </div>
                <div className={styles.pieceItem}>
                    <div className={styles.iconWrapper}><IconPawn size={24} /></div>
                    <div className={styles.pieceName}>スライム (Slime)</div>
                    <MovementGrid pattern={[[-1, 0]]} />
                </div>
            </div>
            <div className={styles.note}>
                <p>※ スライムは敵陣(1段目)に入ると勇者に進化します。</p>
                <p>※ 魔王が敵陣(1段目)に到達しても勝ちです(侵略)。</p>
            </div>
        </div>
    );
}
