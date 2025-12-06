'use client';

import React from 'react';
import styles from './StockCard.module.css';
import { Stock } from '@/lib/stock/types';

interface StockCardProps {
    stock: Stock;
    onSelect: (stock: Stock) => void;
    isSelected?: boolean;
    ownedShares?: number;
}

export const StockCard: React.FC<StockCardProps> = ({
    stock,
    onSelect,
    isSelected,
    ownedShares
}) => {
    const isPositive = stock.change >= 0;

    const formatPrice = (price: number) => {
        const isJPY = stock.currency === 'JPY' || stock.symbol.includes('.T');
        if (isJPY) {
            // Japanese stock - use yen
            return `¥${price.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
        }
        // US stock - use dollars
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatChange = (change: number, percent: number) => {
        const sign = change >= 0 ? '+' : '';
        const isJPY = stock.currency === 'JPY' || stock.symbol.includes('.T');
        if (isJPY) {
            return `${sign}¥${change.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} (${sign}${percent.toFixed(2)}%)`;
        }
        return `${sign}$${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
    };

    return (
        <div
            className={`${styles.card} ${isSelected ? styles.selected : ''} ${isPositive ? styles.positive : styles.negative}`}
            onClick={() => onSelect(stock)}
        >
            <div className={styles.header}>
                <div className={styles.symbol}>{stock.symbol.replace('.T', '')}</div>
                {ownedShares && ownedShares > 0 && (
                    <div className={styles.owned}>{ownedShares}株保有</div>
                )}
            </div>
            <div className={styles.name}>{stock.name}</div>
            <div className={styles.price}>{formatPrice(stock.price)}</div>
            <div className={`${styles.change} ${isPositive ? styles.up : styles.down}`}>
                {formatChange(stock.change, stock.changePercent)}
            </div>
        </div>
    );
};
