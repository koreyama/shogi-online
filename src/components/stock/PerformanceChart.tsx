'use client';

import React from 'react';
import styles from './StockCard.module.css';
import { PortfolioSnapshot, INITIAL_CASH } from '@/lib/stock/types';

interface PerformanceChartProps {
    history: PortfolioSnapshot[];
    currentValue: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
    history,
    currentValue
}) => {
    // Add current value as latest point
    const dataPoints = [
        ...history,
        { timestamp: Date.now(), totalValue: currentValue, cash: 0, positionCount: 0 }
    ];

    if (dataPoints.length < 2) {
        return (
            <div className={styles.performancePanel}>
                <h3>📈 パフォーマンス履歴</h3>
                <div className={styles.emptyState}>
                    履歴データがまだありません。取引を行うとデータが蓄積されます。
                </div>
            </div>
        );
    }

    // Calculate chart dimensions
    const chartWidth = 100;
    const chartHeight = 60;
    const padding = 5;

    const values = dataPoints.map(p => p.totalValue);
    const minValue = Math.min(...values, INITIAL_CASH * 0.9);
    const maxValue = Math.max(...values, INITIAL_CASH * 1.1);
    const valueRange = maxValue - minValue || 1;

    // Generate SVG path
    const points = dataPoints.map((point, i) => {
        const x = padding + (i / (dataPoints.length - 1)) * (chartWidth - padding * 2);
        const y = chartHeight - padding - ((point.totalValue - minValue) / valueRange) * (chartHeight - padding * 2);
        return `${x},${y}`;
    });

    const linePath = `M${points.join(' L')}`;

    // Area path
    const areaPath = `${linePath} L${chartWidth - padding},${chartHeight - padding} L${padding},${chartHeight - padding} Z`;

    // Calculate returns
    const initialValue = dataPoints[0].totalValue;
    const totalReturn = currentValue - initialValue;
    const totalReturnPercent = (totalReturn / initialValue) * 100;

    // Calculate period returns
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const weekStart = dataPoints.find(p => p.timestamp >= oneWeekAgo)?.totalValue || initialValue;
    const monthStart = dataPoints.find(p => p.timestamp >= oneMonthAgo)?.totalValue || initialValue;

    const weekReturn = ((currentValue - weekStart) / weekStart) * 100;
    const monthReturn = ((currentValue - monthStart) / monthStart) * 100;

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    return (
        <div className={styles.performancePanel}>
            <h3>📈 パフォーマンス履歴</h3>

            <div className={styles.returnsSummary}>
                <div className={`${styles.returnItem} ${totalReturn >= 0 ? styles.positive : styles.negative}`}>
                    <span className={styles.returnLabel}>累計</span>
                    <span className={styles.returnValue}>
                        {totalReturn >= 0 ? '+' : ''}¥{totalReturn.toLocaleString()}
                    </span>
                    <span className={styles.returnPercent}>
                        ({totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%)
                    </span>
                </div>
                <div className={`${styles.returnItem} ${weekReturn >= 0 ? styles.positive : styles.negative}`}>
                    <span className={styles.returnLabel}>週間</span>
                    <span className={styles.returnPercent}>
                        {weekReturn >= 0 ? '+' : ''}{weekReturn.toFixed(2)}%
                    </span>
                </div>
                <div className={`${styles.returnItem} ${monthReturn >= 0 ? styles.positive : styles.negative}`}>
                    <span className={styles.returnLabel}>月間</span>
                    <span className={styles.returnPercent}>
                        {monthReturn >= 0 ? '+' : ''}{monthReturn.toFixed(2)}%
                    </span>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className={styles.performanceSvg}
                    preserveAspectRatio="none"
                >
                    {/* Baseline at initial value */}
                    <line
                        x1={padding}
                        y1={chartHeight - padding - ((INITIAL_CASH - minValue) / valueRange) * (chartHeight - padding * 2)}
                        x2={chartWidth - padding}
                        y2={chartHeight - padding - ((INITIAL_CASH - minValue) / valueRange) * (chartHeight - padding * 2)}
                        stroke="#94a3b8"
                        strokeWidth="0.3"
                        strokeDasharray="2,2"
                    />

                    {/* Area fill */}
                    <path
                        d={areaPath}
                        fill={totalReturn >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
                    />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke={totalReturn >= 0 ? '#22c55e' : '#ef4444'}
                        strokeWidth="1"
                    />
                </svg>

                <div className={styles.chartLabels}>
                    <span>{formatDate(dataPoints[0].timestamp)}</span>
                    <span>現在</span>
                </div>
            </div>
        </div>
    );
};
