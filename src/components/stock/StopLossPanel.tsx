'use client';

import React from 'react';
import styles from './StockCard.module.css';
import { Position, StopLoss } from '@/lib/stock/types';

interface StopLossPanelProps {
    positions: Record<string, Position>;
    stopLosses: Record<string, StopLoss>;
    onSetStopLoss: (symbol: string, triggerPrice: number) => void;
    onRemoveStopLoss: (symbol: string) => void;
}

export const StopLossPanel: React.FC<StopLossPanelProps> = ({
    positions,
    stopLosses,
    onSetStopLoss,
    onRemoveStopLoss
}) => {
    const [editingSymbol, setEditingSymbol] = React.useState<string | null>(null);
    const [triggerPrice, setTriggerPrice] = React.useState<number>(0);

    const handleSetStopLoss = (symbol: string) => {
        if (triggerPrice > 0) {
            onSetStopLoss(symbol, triggerPrice);
            setEditingSymbol(null);
            setTriggerPrice(0);
        }
    };

    const positionList = Object.values(positions);

    return (
        <div className={styles.stopLossPanel}>
            <h3>🛡️ ストップロス設定</h3>

            {positionList.length === 0 ? (
                <div className={styles.emptyState}>保有ポジションがありません</div>
            ) : (
                <div className={styles.stopLossList}>
                    {positionList.map(position => {
                        const existingStopLoss = stopLosses[position.symbol];
                        const isEditing = editingSymbol === position.symbol;

                        return (
                            <div key={position.symbol} className={styles.stopLossItem}>
                                <div className={styles.stopLossInfo}>
                                    <span className={styles.symbol}>{position.symbol}</span>
                                    <span className={styles.shares}>{position.shares}株</span>
                                    <span className={styles.currentPrice}>
                                        現在: ¥{position.currentPrice.toLocaleString()}
                                    </span>
                                </div>

                                {existingStopLoss && !isEditing ? (
                                    <div className={styles.stopLossActive}>
                                        <span className={styles.triggerPrice}>
                                            発動: ¥{existingStopLoss.triggerPrice.toLocaleString()}
                                        </span>
                                        <button
                                            className={styles.editBtn}
                                            onClick={() => {
                                                setEditingSymbol(position.symbol);
                                                setTriggerPrice(existingStopLoss.triggerPrice);
                                            }}
                                        >
                                            編集
                                        </button>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => onRemoveStopLoss(position.symbol)}
                                        >
                                            解除
                                        </button>
                                    </div>
                                ) : isEditing ? (
                                    <div className={styles.stopLossEdit}>
                                        <input
                                            type="number"
                                            value={triggerPrice || ''}
                                            onChange={e => setTriggerPrice(parseFloat(e.target.value) || 0)}
                                            placeholder="発動価格"
                                            className={styles.input}
                                        />
                                        <button
                                            className={styles.saveBtn}
                                            onClick={() => handleSetStopLoss(position.symbol)}
                                        >
                                            設定
                                        </button>
                                        <button
                                            className={styles.cancelBtn}
                                            onClick={() => {
                                                setEditingSymbol(null);
                                                setTriggerPrice(0);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={styles.setStopLossBtn}
                                        onClick={() => {
                                            setEditingSymbol(position.symbol);
                                            setTriggerPrice(Math.floor(position.currentPrice * 0.95));
                                        }}
                                    >
                                        設定
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
