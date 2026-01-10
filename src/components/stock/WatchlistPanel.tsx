'use client';

import React, { useState, useEffect } from 'react';
import styles from './StockCard.module.css';
import { Stock } from '@/lib/stock/types';
import { fetchStockPrice } from '@/lib/stock/api';

interface WatchlistPanelProps {
    watchlist: string[];
    onRemove: (symbol: string) => void;
    onAdd: (symbol: string) => void;
    onSelectStock: (stock: Stock) => void;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
    watchlist,
    onRemove,
    onAdd,
    onSelectStock
}) => {
    const [newSymbol, setNewSymbol] = useState('');
    const [watchlistStocks, setWatchlistStocks] = useState<Record<string, Stock>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWatchlistPrices = async () => {
            if (watchlist.length === 0) return;
            setLoading(true);
            const results: Record<string, Stock> = {};

            await Promise.all(watchlist.map(async symbol => {
                const stock = await fetchStockPrice(symbol);
                if (stock) results[symbol] = stock;
            }));

            setWatchlistStocks(results);
            setLoading(false);
        };

        fetchWatchlistPrices();
        const interval = setInterval(fetchWatchlistPrices, 60000);
        return () => clearInterval(interval);
    }, [watchlist]);

    const handleAdd = () => {
        if (newSymbol.trim()) {
            onAdd(newSymbol.toUpperCase().trim());
            setNewSymbol('');
        }
    };

    return (
        <div className={styles.watchlistPanel}>
            <h3>⭐ ウォッチリスト</h3>

            <div className={styles.addWatchlist}>
                <input
                    type="text"
                    placeholder="銘柄コード (例: TSLA)"
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAdd()}
                    className={styles.input}
                />
                <button onClick={handleAdd} className={styles.addBtn}>追加</button>
            </div>

            {loading && watchlist.length > 0 && (
                <div className={styles.loadingState}>読み込み中...</div>
            )}

            {watchlist.length === 0 ? (
                <div className={styles.emptyState}>ウォッチリストは空です</div>
            ) : (
                <div className={styles.watchlistItems}>
                    {watchlist.map(symbol => {
                        const stock = watchlistStocks[symbol];
                        return (
                            <div key={symbol} className={styles.watchlistItem}>
                                <div
                                    className={styles.watchlistInfo}
                                    onClick={() => stock && onSelectStock(stock)}
                                    style={{ cursor: stock ? 'pointer' : 'default' }}
                                >
                                    <span className={styles.watchlistSymbol}>{symbol}</span>
                                    {stock && (
                                        <>
                                            <span className={styles.watchlistPrice}>
                                                ¥{stock.priceInJPY.toLocaleString()}
                                            </span>
                                            <span className={`${styles.watchlistChange} ${stock.changePercent >= 0 ? styles.positive : styles.negative}`}>
                                                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                            </span>
                                        </>
                                    )}
                                </div>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => onRemove(symbol)}
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
