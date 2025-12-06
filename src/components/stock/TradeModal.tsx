'use client';

import React, { useState, useEffect } from 'react';
import styles from './TradeModal.module.css';
import { Stock, Position, PriceHistory } from '@/lib/stock/types';
import { StockChart } from './StockChart';
import { getPriceHistory } from '@/lib/stock/api';

interface TradeModalProps {
    stock: Stock;
    position?: Position;
    cash: number;
    onBuy: (shares: number) => void;
    onSell: (shares: number) => void;
    onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
    stock,
    position,
    cash,
    onBuy,
    onSell,
    onClose
}) => {
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [shares, setShares] = useState(1);
    const [history, setHistory] = useState<PriceHistory[]>([]);
    const [chartPeriod, setChartPeriod] = useState<number>(30);

    useEffect(() => {
        // Load price history
        setHistory(getPriceHistory(stock.symbol, chartPeriod));
    }, [stock.symbol, chartPeriod]);

    const priceInJPY = stock.priceInJPY || stock.price;
    const maxBuyShares = Math.floor(cash / priceInJPY);
    const maxSellShares = position?.shares || 0;

    const isJapanese = stock.currency === 'JPY' || stock.symbol.includes('.T');

    // Format stock price (Native Currency)
    const formatNativePrice = (price: number) => {
        if (isJapanese) {
            return `¥${price.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
        }
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format portfolio values (Always JPY)
    const formatJPY = (amount: number) => {
        return `¥${amount.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
    };

    const total = priceInJPY * shares;
    const isValid = mode === 'buy'
        ? shares > 0 && shares <= maxBuyShares
        : shares > 0 && shares <= maxSellShares;

    const handleSubmit = () => {
        if (!isValid) return;
        if (mode === 'buy') {
            onBuy(shares);
        } else {
            onSell(shares);
        }
    };

    const handleSetMax = () => {
        setShares(mode === 'buy' ? maxBuyShares : maxSellShares);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h2>{stock.symbol.replace('.T', '')}</h2>
                        <span className={styles.stockName}>{stock.name}</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.priceInfo}>
                    <span className={styles.currentPrice}>{formatNativePrice(stock.price)}</span>
                    <span className={`${styles.change} ${stock.change >= 0 ? styles.up : styles.down}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                </div>

                {/* Chart */}
                <div className={styles.chartSection}>
                    <div className={styles.chartPeriods}>
                        {[7, 30, 90].map(days => (
                            <button
                                key={days}
                                className={`${styles.periodBtn} ${chartPeriod === days ? styles.active : ''}`}
                                onClick={() => setChartPeriod(days)}
                            >
                                {days}D
                            </button>
                        ))}
                    </div>
                    <StockChart history={history} width={370} height={150} />
                </div>

                {position && (
                    <div className={styles.positionInfo}>
                        <div className={styles.positionRow}>
                            <span>保有数量</span>
                            <span>{position.shares}株</span>
                        </div>
                        <div className={styles.positionRow}>
                            <span>評価損益</span>
                            <span className={position.profit >= 0 ? styles.up : styles.down}>
                                {formatJPY(position.profit)} ({position.profit >= 0 ? '+' : ''}{position.profitPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                )}

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${mode === 'buy' ? styles.active : ''}`}
                        onClick={() => setMode('buy')}
                    >
                        買い
                    </button>
                    <button
                        className={`${styles.tab} ${mode === 'sell' ? styles.active : ''} ${!position ? styles.disabled : ''}`}
                        onClick={() => position && setMode('sell')}
                        disabled={!position}
                    >
                        売り
                    </button>
                </div>

                <div className={styles.inputGroup}>
                    <label>数量</label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="number"
                            value={shares}
                            min={1}
                            max={mode === 'buy' ? maxBuyShares : maxSellShares}
                            onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                            className={styles.input}
                        />
                        <span className={styles.unit}>株</span>
                        <button className={styles.maxBtn} onClick={handleSetMax}>MAX</button>
                    </div>
                    <div className={styles.maxInfo}>
                        最大: {mode === 'buy' ? maxBuyShares.toLocaleString() : maxSellShares.toLocaleString()}株
                    </div>
                </div>

                <div className={styles.summary}>
                    <div className={styles.summaryRow}>
                        <span>合計 (円換算)</span>
                        <span className={styles.totalAmount}>{formatJPY(total)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>{mode === 'buy' ? '購入後残高' : '売却後残高'}</span>
                        <span>{formatJPY(mode === 'buy' ? cash - total : cash + total)}</span>
                    </div>
                </div>

                <button
                    className={`${styles.submitBtn} ${mode === 'buy' ? styles.buyBtn : styles.sellBtn}`}
                    onClick={handleSubmit}
                    disabled={!isValid}
                >
                    {mode === 'buy' ? '購入する' : '売却する'}
                </button>
            </div>
        </div>
    );
};
