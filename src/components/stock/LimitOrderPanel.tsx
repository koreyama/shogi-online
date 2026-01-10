'use client';

import React, { useState } from 'react';
import styles from './StockCard.module.css';
import { LimitOrder } from '@/lib/stock/types';

interface LimitOrderPanelProps {
    pendingOrders: LimitOrder[];
    onCancelOrder: (orderId: string) => void;
    onCreateOrder: (symbol: string, type: 'buy' | 'sell', shares: number, targetPrice: number) => void;
}

export const LimitOrderPanel: React.FC<LimitOrderPanelProps> = ({
    pendingOrders,
    onCancelOrder,
    onCreateOrder
}) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        symbol: '',
        type: 'buy' as 'buy' | 'sell',
        shares: 1,
        targetPrice: 0
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.symbol && formData.shares > 0 && formData.targetPrice > 0) {
            onCreateOrder(formData.symbol.toUpperCase(), formData.type, formData.shares, formData.targetPrice);
            setFormData({ symbol: '', type: 'buy', shares: 1, targetPrice: 0 });
            setShowForm(false);
        }
    };

    return (
        <div className={styles.orderPanel}>
            <div className={styles.orderPanelHeader}>
                <h3>📋 指値注文</h3>
                <button
                    className={styles.addOrderBtn}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'キャンセル' : '+ 新規注文'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className={styles.orderForm}>
                    <div className={styles.formRow}>
                        <input
                            type="text"
                            placeholder="銘柄コード (例: AAPL)"
                            value={formData.symbol}
                            onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                            className={styles.input}
                        />
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as 'buy' | 'sell' })}
                            className={styles.select}
                        >
                            <option value="buy">買い</option>
                            <option value="sell">売り</option>
                        </select>
                    </div>
                    <div className={styles.formRow}>
                        <input
                            type="number"
                            placeholder="株数"
                            value={formData.shares}
                            onChange={e => setFormData({ ...formData, shares: parseInt(e.target.value) || 0 })}
                            className={styles.input}
                            min="1"
                        />
                        <input
                            type="number"
                            placeholder="指値 (円)"
                            value={formData.targetPrice || ''}
                            onChange={e => setFormData({ ...formData, targetPrice: parseFloat(e.target.value) || 0 })}
                            className={styles.input}
                        />
                    </div>
                    <button type="submit" className={styles.submitBtn}>注文を作成</button>
                </form>
            )}

            {pendingOrders.length === 0 ? (
                <div className={styles.emptyState}>保留中の注文はありません</div>
            ) : (
                <div className={styles.orderList}>
                    {pendingOrders.map(order => (
                        <div key={order.id} className={styles.orderItem}>
                            <div className={styles.orderInfo}>
                                <span className={`${styles.orderType} ${order.type === 'buy' ? styles.buyOrder : styles.sellOrder}`}>
                                    {order.type === 'buy' ? '買' : '売'}
                                </span>
                                <span className={styles.orderSymbol}>{order.symbol}</span>
                                <span className={styles.orderDetails}>
                                    {order.shares}株 @ ¥{order.targetPrice.toLocaleString()}
                                </span>
                            </div>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => onCancelOrder(order.id)}
                            >
                                取消
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
