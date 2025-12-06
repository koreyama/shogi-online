
import React, { useState } from 'react';
import styles from './TradeRouteModal.module.css';
import { GameState, ResourceType } from '@/lib/clicker/types';
import { RESOURCE_VALUES } from '@/lib/clicker/data';

interface Props {
    gameState: GameState;
    onClose: () => void;
    onToggleRoute: (routeId: string) => void;
    onAddRoute: (from: ResourceType, to: ResourceType) => void;
    onRemoveRoute: (routeId: string) => void;
}

const TRADABLE_RESOURCES: ResourceType[] = ['food', 'wood', 'stone', 'coal', 'iron', 'gold', 'knowledge'];

export const TradeRouteModal: React.FC<Props> = ({ gameState, onClose, onToggleRoute, onAddRoute, onRemoveRoute }) => {
    const [fromRes, setFromRes] = useState<ResourceType>('wood');
    const [toRes, setToRes] = useState<ResourceType>('gold');

    const handleCreate = () => {
        if (fromRes === toRes) return;
        onAddRoute(fromRes, toRes);
    };

    // Calculate preview rate
    const valFrom = RESOURCE_VALUES[fromRes] || 1;
    const valTo = RESOURCE_VALUES[toRes] || 1;
    const previewRate = (valFrom / valTo) * 0.8; // 20% tax

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        <span>🚢</span> 交易ルート管理 (Market)
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.createSection}>
                    <div className={styles.createHeader}>新規ルート作成 (Create Route)</div>
                    <div className={styles.createForm}>
                        <select
                            className={styles.select}
                            value={fromRes}
                            onChange={(e) => setFromRes(e.target.value as ResourceType)}
                        >
                            {TRADABLE_RESOURCES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                        </select>
                        <span className={styles.arrow}>➡</span>
                        <select
                            className={styles.select}
                            value={toRes}
                            onChange={(e) => setToRes(e.target.value as ResourceType)}
                        >
                            {TRADABLE_RESOURCES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                        </select>

                        <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginLeft: '1rem' }}>
                            レート: {previewRate.toFixed(2)} (手数料 20%)
                        </div>

                        <button className={styles.createButton} onClick={handleCreate}>開設</button>
                    </div>
                </div>

                <div className={styles.routeList}>
                    {Object.values(gameState.tradeRoutes).map(route => {
                        return (
                            <div key={route.id} className={`${styles.routeCard} ${route.active ? styles.active : ''}`}>
                                <div className={styles.routeInfo}>
                                    <div className={styles.routeName}>
                                        {route.name || `${route.from.toUpperCase()} ➡ ${route.to.toUpperCase()}`}
                                    </div>
                                    <div className={styles.routeDetail}>
                                        <span>変換: {route.from.toUpperCase()} → {route.to.toUpperCase()}</span>
                                        <span className={styles.flowRate}>(レート: {(route.rate * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className={styles.routeDetail}>
                                        コスト: -1.0 {route.from}/秒  ⇒  獲得: +{route.rate.toFixed(2)} {route.to}/秒
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        className={`${styles.toggleButton} ${route.active ? styles.active : styles.inactive}`}
                                        onClick={() => onToggleRoute(route.id)}
                                    >
                                        {route.active ? '稼働中' : '停止中'}
                                    </button>
                                    <button className={styles.deleteButton} onClick={() => onRemoveRoute(route.id)}>
                                        削除
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(gameState.tradeRoutes).length === 0 && (
                        <div style={{ textAlign: 'center', color: '#718096', padding: '2rem' }}>
                            交易ルートがありません。新規作成してください。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
