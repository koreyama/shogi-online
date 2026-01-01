'use client';

import React, { useState } from 'react';
import styles from './YakuListModal.module.css';
import { YAKU_LIST } from '@/lib/mahjong/yaku';
import { YAKU_DESCRIPTIONS } from './yaku-descriptions';
import { IconX } from '@/components/Icons';
import { TILE_DISPLAY, HONOR_VALUES } from '@/lib/mahjong/types';

interface YakuListModalProps {
    onClose: () => void;
}

// 簡易牌表示コンポーネント
const SimpleTile = ({ code }: { code: string }) => {
    const getDisplay = (c: string) => {
        const val = parseInt(c[0]);
        const type = c[1];

        if (type === 'z') {
            const honorType = HONOR_VALUES[val];
            return TILE_DISPLAY[honorType] || '?';
        }

        let suit = '';
        if (type === 'm') suit = 'man';
        if (type === 'p') suit = 'pin';
        if (type === 's') suit = 'sou';
        return TILE_DISPLAY[`${suit}${val}`] || '?';
    };

    const display = getDisplay(code);
    /* 赤ドラ対応などは今回は省略、基本形のみ */

    return (
        <div className={styles.simpleTile}>
            {display}
        </div>
    );
};

export const YakuListModal: React.FC<YakuListModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'1' | '2' | '3' | 'yakuman'>('1');

    // 役をカテゴリ分け
    const yakuCategories = {
        '1': Object.values(YAKU_LIST).filter(y => !y.isYakuman && (typeof y.han === 'number' ? y.han === 1 : y.han.closed === 1)),
        '2': Object.values(YAKU_LIST).filter(y => !y.isYakuman && (typeof y.han === 'number' ? y.han === 2 : y.han.closed === 2)),
        '3': Object.values(YAKU_LIST).filter(y => !y.isYakuman && (typeof y.han === 'number' ? y.han >= 3 : y.han.closed >= 3)),
        'yakuman': Object.values(YAKU_LIST).filter(y => y.isYakuman)
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>役・得点一覧</h2>
                    <button className={styles.closeButton} onClick={onClose}><IconX /></button>
                </div>

                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${activeTab === '1' ? styles.active : ''}`} onClick={() => setActiveTab('1')}>1翻</button>
                    <button className={`${styles.tab} ${activeTab === '2' ? styles.active : ''}`} onClick={() => setActiveTab('2')}>2翻</button>
                    <button className={`${styles.tab} ${activeTab === '3' ? styles.active : ''}`} onClick={() => setActiveTab('3')}>3翻以上</button>
                    <button className={`${styles.tab} ${activeTab === 'yakuman' ? styles.active : ''}`} onClick={() => setActiveTab('yakuman')}>役満</button>
                </div>

                <div className={styles.content}>
                    <div className={styles.yakuGrid}>
                        {yakuCategories[activeTab].map((yaku) => {
                            const desc = YAKU_DESCRIPTIONS[yaku.name];
                            return (
                                <div key={yaku.name} className={styles.yakuCard}>
                                    <div className={styles.yakuHeader}>
                                        <span className={styles.yakuName}>{yaku.nameJp}</span>
                                        <span className={styles.yakuHan}>
                                            {activeTab === 'yakuman' ? '役満' :
                                                typeof yaku.han === 'number' ? `${yaku.han}翻` :
                                                    `門前${yaku.han.closed}翻 / 鳴き${yaku.han.open}翻`
                                            }
                                        </span>
                                    </div>

                                    {desc && (
                                        <div className={styles.yakuDetail}>
                                            <div className={styles.description}>
                                                {desc.description}
                                            </div>
                                            <div className={styles.conditionBadge}>
                                                {desc.condition}
                                            </div>
                                            {desc.example && (
                                                <div className={styles.example}>
                                                    {desc.example.map((code, i) => (
                                                        <SimpleTile key={i} code={code} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <h3 style={{ marginTop: '2rem', fontSize: '1.1rem', borderBottom: '1px solid #ddd' }}>簡易点数表（親/子）</h3>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>※ロンあがり / ツモ（1人あたり支払い）の順</p>
                    <table className={styles.scoreTable}>
                        <thead>
                            <tr>
                                <th>翻数</th>
                                <th>30符（標準）</th>
                                <th>40符</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1翻</td>
                                <td>1500 / 500(1000)</td>
                                <td>2000 / 700(1300)</td>
                            </tr>
                            <tr>
                                <td>2翻</td>
                                <td>2900 / 1000(2000)</td>
                                <td>3900 / 1300(2600)</td>
                            </tr>
                            <tr>
                                <td>3翻</td>
                                <td>5800 / 2000(3900)</td>
                                <td>7700 / 2600(5200)</td>
                            </tr>
                            <tr>
                                <td>4翻</td>
                                <td>11600 / 3900(7700)</td>
                                <td>満貫</td>
                            </tr>
                            <tr>
                                <td>満貫(5)</td>
                                <td colSpan={2}>12000 / 4000(8000)</td>
                            </tr>
                            <tr>
                                <td>跳満(6-7)</td>
                                <td colSpan={2}>18000 / 6000(12000)</td>
                            </tr>
                            <tr>
                                <td>倍満(8-10)</td>
                                <td colSpan={2}>24000 / 8000(16000)</td>
                            </tr>
                            <tr>
                                <td>三倍満(11-12)</td>
                                <td colSpan={2}>36000 / 12000(24000)</td>
                            </tr>
                            <tr>
                                <td>役満(13~)</td>
                                <td colSpan={2}>48000 / 16000(32000)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
