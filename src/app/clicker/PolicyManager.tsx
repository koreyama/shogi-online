"use client";

import React, { useMemo } from 'react';
import { GameState, Policy } from '@/lib/clicker/types';
import { ResourceIcon } from '@/components/Icons';
import styles from './PolicyManager.module.css';

interface Props {
    gameState: GameState;
    onUnlockPolicy: (id: string) => void;
}

export const PolicyManager: React.FC<Props> = ({ gameState, onUnlockPolicy }) => {

    const sortedPolicies = useMemo(() => {
        return Object.values(gameState.policies)
            .filter(p => p.unlocked)
            .sort((a, b) => {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
                return a.cost - b.cost;
            });
    }, [gameState.policies]);

    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ResourceIcon type="culture" /> 社会制度
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                {sortedPolicies.map(policy => (
                    <div
                        key={policy.id}
                        className={styles.card}
                        style={{
                            borderColor: policy.active ? '#805ad5' : '#e2e8f0',
                            borderWidth: policy.active ? '2px' : '1px',
                            background: policy.active ? '#faf5ff' : 'white'
                        }}
                    >
                        <div className={styles.cardHeader}>
                            <h3>{policy.name}</h3>
                            {policy.active && <span style={{ fontSize: '0.8rem', background: '#805ad5', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>採用中</span>}
                        </div>

                        <div className={styles.cardDesc}>
                            {policy.description}
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#553c9a', fontWeight: '600' }}>
                                {/* Display Effects Summary */}
                                {policy.effects.resourceMultiplier && Object.entries(policy.effects.resourceMultiplier).map(([res, mult]) => (
                                    <div key={res}>・{res === 'culture' ? '文化' : res === 'food' ? '食料' : res === 'production' ? '生産' : res}生産: +{Math.round((mult - 1) * 100)}%</div>
                                ))}
                                {policy.effects.buildingCostMultiplier && (
                                    <div>・建設コスト: {Math.round((1 - policy.effects.buildingCostMultiplier) * 100)}% 減少</div>
                                )}
                            </div>
                        </div>

                        {!policy.active && (
                            <button
                                className={styles.button}
                                disabled={gameState.resources.culture < policy.cost}
                                onClick={() => onUnlockPolicy(policy.id)}
                            >
                                <span>採用する (コスト: {policy.cost})</span>
                                <ResourceIcon type="culture" size={16} />
                            </button>
                        )}
                        {policy.active && (
                            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#805ad5', fontWeight: 'bold', padding: '0.6rem' }}>
                                採用済み
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {sortedPolicies.length === 0 && (
                <div style={{ textAlign: 'center', color: '#718096', padding: '2rem' }}>
                    利用可能な社会制度はありません。時代を進めるとアンロックされます。
                </div>
            )}
        </div>
    );
};
