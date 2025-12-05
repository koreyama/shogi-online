import React, { useEffect, useState } from 'react';
import { GameState, Resources, ExpeditionType } from '@/lib/clicker/types';
import { EXPEDITIONS } from '@/lib/clicker/data';
import styles from './ExpeditionManager.module.css';
import { IconFood, IconWood, IconStone, IconKnowledge, IconGold, IconPickaxe, IconBook } from '@/components/Icons';
import { formatNumber } from '@/lib/clicker/utils';

interface ExpeditionManagerProps {
    gameState: GameState;
    onSendExpedition: (type: ExpeditionType) => { success: boolean, message: string, reward: Partial<Resources> };
}

export const ExpeditionManager: React.FC<ExpeditionManagerProps> = ({ gameState, onSendExpedition }) => {
    const [log, setLog] = React.useState<string | null>(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    const handleSend = (type: ExpeditionType) => {
        const result = onSendExpedition(type);
        setLog(result.message);
        setTimeout(() => setLog(null), 5000);
    };

    const activeCount = gameState.activeExpeditions?.length || 0;
    const maxActive = 3;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>探索ミッション (Expeditions)</h2>

            {/* Active Expeditions */}
            <div className={styles.grid}>
                {Object.values(EXPEDITIONS).map(exp => {
                    let Icon = IconWood;
                    let variant = 'cardScout';
                    if (exp.id === 'research') { Icon = IconBook; variant = 'cardResearch'; }
                    if (exp.id === 'trade') { Icon = IconGold; variant = 'cardTrade'; }

                    const canAfford = Object.entries(exp.cost).every(([k, v]) => (gameState.resources[k as keyof Resources] || 0) >= (v as number));

                    return (
                        <ExpeditionCard
                            key={exp.id}
                            title={exp.title}
                            desc={exp.description}
                            cost={exp.cost}
                            rewards={exp.rewardDesc}
                            risk={exp.risk}
                            duration={`${exp.duration}秒`}
                            variant={variant}
                            icon={<Icon size={32} />}
                            onSend={() => handleSend(exp.id as ExpeditionType)}
                            canAfford={canAfford}
                            disabled={activeCount >= maxActive}
                        />
                    );
                })}
            </div>

            {/* Active Expeditions */}
            {activeCount > 0 && (
                <div className={styles.activeSection}>
                    <h3 className={styles.sectionTitle}>進行中のミッション ({activeCount}/{maxActive})</h3>
                    {gameState.activeExpeditions.map(exp => {
                        const elapsed = now - exp.startTime;
                        const progress = Math.min(100, (elapsed / exp.duration) * 100);
                        const remaining = Math.max(0, Math.ceil((exp.duration - elapsed) / 1000));

                        return (
                            <div key={exp.id} className={styles.activeCard}>
                                <div className={styles.activeHeader}>
                                    <span className={styles.activeType}>
                                        {exp.type === 'scout' ? '🌲 ' : exp.type === 'research' ? '📜 ' : '💰 '}
                                        {EXPEDITIONS[exp.type]?.title || 'Unknown'}
                                    </span>
                                    <span className={styles.activeTimer}>{remaining}秒</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Logs Section */}
            <div className={styles.logSection}>
                <h3 className={styles.sectionTitle}>探索ログ</h3>
                <div className={styles.logList}>
                    {gameState.logs?.length === 0 && <p className={styles.emptyLog}>履歴はありません</p>}
                    {gameState.logs?.map(log => (
                        <div key={log.id} className={`${styles.logEntry} ${styles[log.type]}`}>
                            <span className={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={styles.logMessage}>{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ExpeditionCard = ({ title, desc, cost, rewards, risk, duration, variant, icon, onSend, canAfford, disabled }: any) => (
    <div className={`${styles.card} ${styles[variant]}`}>
        <div className={styles.icon}>{icon}</div>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDesc}>{desc}</p>

        <div style={{ marginBottom: '1rem' }}>
            <div className={styles.infoRow}>
                <span className={styles.label}>コスト:</span>
                <span className={styles.costVal}>
                    {Object.entries(cost).map(([k, v]) => (
                        <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                            {k === 'food' ? <IconFood size={14} /> : <IconWood size={14} />} {formatNumber(v as number)}
                        </span>
                    ))}
                </span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.label}>時間:</span>
                <span className={styles.costVal}>{duration}</span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.label}>期待報酬:</span>
                <span className={styles.rewardVal}>{rewards}</span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.label}>リスク:</span>
                <span className={risk === '高' ? styles.riskHigh : risk === '中' ? styles.riskMed : styles.riskLow}>{risk}</span>
            </div>
        </div>

        <button
            onClick={onSend}
            disabled={!canAfford || disabled}
            className={`${styles.button} ${canAfford && !disabled ? styles.buttonEnabled : styles.buttonDisabled}`}
        >
            {disabled ? '派遣中...' : '派遣する'}
        </button>
    </div>
);
