'use client';

import React from 'react';
import styles from './StockCard.module.css';
import { Position } from '@/lib/stock/types';

interface PortfolioAnalysisProps {
    positions: Record<string, Position>;
    cash: number;
    totalValue: number;
}

interface SectorAllocation {
    sector: string;
    value: number;
    percent: number;
    color: string;
}

const SECTOR_COLORS: Record<string, string> = {
    'Technology': '#3b82f6',
    'テクノロジー': '#3b82f6',
    'Consumer': '#10b981',
    '消費財': '#10b981',
    'Automotive': '#f59e0b',
    '自動車': '#f59e0b',
    'Semiconductors': '#8b5cf6',
    '半導体': '#8b5cf6',
    'エレクトロニクス': '#06b6d4',
    '通信': '#ec4899',
    'ゲーム': '#ef4444',
    '小売': '#84cc16',
    'Healthcare': '#14b8a6',
    'Finance': '#6366f1',
    'Energy': '#f97316',
    '現金': '#94a3b8',
    'その他': '#64748b'
};

export const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({
    positions,
    cash,
    totalValue
}) => {
    // Calculate sector allocation
    const sectorMap: Record<string, number> = {};

    for (const position of Object.values(positions)) {
        const sector = position.name.includes('Apple') || position.name.includes('Microsoft') ||
            position.name.includes('Google') || position.name.includes('Meta') ? 'Technology' :
            position.name.includes('Tesla') || position.name.includes('トヨタ') ? '自動車' :
                position.name.includes('NVIDIA') || position.name.includes('AMD') ? 'Semiconductors' :
                    position.name.includes('ソニー') ? 'エレクトロニクス' :
                        position.name.includes('任天堂') ? 'ゲーム' :
                            position.name.includes('ソフトバンク') ? '通信' :
                                position.name.includes('ファストリ') ? '小売' :
                                    'その他';

        sectorMap[sector] = (sectorMap[sector] || 0) + position.marketValue;
    }

    // Add cash
    sectorMap['現金'] = cash;

    // Convert to array with percentages
    const allocations: SectorAllocation[] = Object.entries(sectorMap)
        .map(([sector, value]) => ({
            sector,
            value,
            percent: (value / totalValue) * 100,
            color: SECTOR_COLORS[sector] || '#64748b'
        }))
        .sort((a, b) => b.value - a.value);

    // Calculate diversification score (0-100)
    const positionCount = Object.keys(positions).length;
    const sectorCount = Object.keys(sectorMap).length - 1; // Exclude cash
    const maxPosition = Math.max(...Object.values(positions).map(p => p.marketValue), 0);
    const maxPositionPercent = totalValue > 0 ? (maxPosition / totalValue) * 100 : 0;

    const diversificationScore = Math.min(100,
        (positionCount * 10) +
        (sectorCount * 15) -
        (maxPositionPercent > 30 ? maxPositionPercent - 30 : 0)
    );

    return (
        <div className={styles.analysisPanel}>
            <h3>📊 ポートフォリオ分析</h3>

            <div className={styles.diversificationScore}>
                <span className={styles.scoreLabel}>分散スコア</span>
                <div className={styles.scoreBar}>
                    <div
                        className={styles.scoreFill}
                        style={{
                            width: `${diversificationScore}%`,
                            background: diversificationScore > 70 ? '#22c55e' :
                                diversificationScore > 40 ? '#f59e0b' : '#ef4444'
                        }}
                    />
                </div>
                <span className={styles.scoreValue}>{Math.round(diversificationScore)}/100</span>
            </div>

            <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>保有銘柄数</span>
                    <span className={styles.metricValue}>{positionCount}</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>セクター数</span>
                    <span className={styles.metricValue}>{sectorCount}</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>現金比率</span>
                    <span className={styles.metricValue}>{((cash / totalValue) * 100).toFixed(1)}%</span>
                </div>
            </div>

            <div className={styles.sectorAllocation}>
                <h4>セクター配分</h4>
                <div className={styles.allocationChart}>
                    {allocations.map((alloc, i) => (
                        <div
                            key={alloc.sector}
                            className={styles.allocationSegment}
                            style={{
                                width: `${alloc.percent}%`,
                                background: alloc.color,
                                minWidth: alloc.percent > 0 ? '4px' : '0'
                            }}
                            title={`${alloc.sector}: ${alloc.percent.toFixed(1)}%`}
                        />
                    ))}
                </div>
                <div className={styles.allocationLegend}>
                    {allocations.filter(a => a.percent >= 1).map(alloc => (
                        <div key={alloc.sector} className={styles.legendItem}>
                            <span
                                className={styles.legendColor}
                                style={{ background: alloc.color }}
                            />
                            <span className={styles.legendLabel}>{alloc.sector}</span>
                            <span className={styles.legendPercent}>{alloc.percent.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
