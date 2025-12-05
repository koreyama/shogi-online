'use client';

import React, { useMemo } from 'react';
import styles from './StockChart.module.css';
import { PriceHistory } from '@/lib/stock/types';

interface StockChartProps {
    history: PriceHistory[];
    width?: number;
    height?: number;
    showVolume?: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({
    history,
    width = 400,
    height = 200,
    showVolume = false
}) => {
    const chartData = useMemo(() => {
        if (history.length < 2) return null;

        const prices = history.map(h => h.close);
        const minPrice = Math.min(...prices) * 0.995;
        const maxPrice = Math.max(...prices) * 1.005;
        const priceRange = maxPrice - minPrice || 1;

        const chartHeight = showVolume ? height * 0.7 : height - 20;
        const chartWidth = width - 60;

        const points = history.map((h, i) => {
            const x = (i / (history.length - 1)) * chartWidth + 50;
            const y = chartHeight - ((h.close - minPrice) / priceRange) * (chartHeight - 20) + 10;
            return { x, y, price: h.close, date: new Date(h.timestamp) };
        });

        // Create path
        const pathD = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ');

        // Create gradient area path
        const areaD = pathD +
            ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

        const isPositive = prices[prices.length - 1] >= prices[0];

        return {
            points,
            pathD,
            areaD,
            minPrice,
            maxPrice,
            isPositive,
            chartHeight
        };
    }, [history, width, height, showVolume]);

    if (!chartData) {
        return <div className={styles.noData}>チャートデータがありません</div>;
    }

    const formatPrice = (price: number) => {
        if (price >= 1000) {
            return price.toLocaleString('ja-JP', { maximumFractionDigits: 0 });
        }
        return price.toFixed(2);
    };

    const color = chartData.isPositive ? '#38a169' : '#e53e3e';

    return (
        <div className={styles.container}>
            <svg width={width} height={height} className={styles.chart}>
                <defs>
                    <linearGradient id={`gradient-${chartData.isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map(ratio => (
                    <line
                        key={ratio}
                        x1={50}
                        y1={ratio * chartData.chartHeight}
                        x2={width - 10}
                        y2={ratio * chartData.chartHeight}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                    />
                ))}

                {/* Area fill */}
                <path
                    d={chartData.areaD}
                    fill={`url(#gradient-${chartData.isPositive ? 'up' : 'down'})`}
                />

                {/* Price line */}
                <path
                    d={chartData.pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                />

                {/* Y-axis labels */}
                <text x={45} y={15} className={styles.label} textAnchor="end">
                    {formatPrice(chartData.maxPrice)}
                </text>
                <text x={45} y={chartData.chartHeight} className={styles.label} textAnchor="end">
                    {formatPrice(chartData.minPrice)}
                </text>
            </svg>

            <div className={styles.xAxis}>
                <span>{chartData.points[0].date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
                <span>{chartData.points[chartData.points.length - 1].date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
            </div>
        </div>
    );
};
