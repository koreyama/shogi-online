// Stock Trading Simulator Types

export interface Stock {
    symbol: string;
    name: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    marketCap?: number;
    lastUpdated: number;
    sector?: string;
}

export interface PriceHistory {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Position {
    symbol: string;
    name: string;
    shares: number;
    averageCost: number;
    currentPrice: number;
    totalCost: number;
    marketValue: number;
    profit: number;
    profitPercent: number;
}

export interface Trade {
    id: string;
    symbol: string;
    type: 'buy' | 'sell';
    shares: number;
    price: number;
    total: number;
    timestamp: number;
}

export interface Portfolio {
    cash: number;
    positions: Record<string, Position>;
    totalValue: number;
    totalProfit: number;
    totalProfitPercent: number;
    trades: Trade[];
}

export interface UserData {
    odId: string;
    odName: string;
    portfolio: Portfolio;
    createdAt: number;
    lastActive: number;
}

export interface LeaderboardEntry {
    odId: string;
    odName: string;
    totalValue: number;
    totalProfit: number;
    totalProfitPercent: number;
    lastUpdated: number;
}

// 主要銘柄のみ（検索で他の銘柄も買える）
export const FEATURED_STOCKS = [
    // 日本株トップ5
    { symbol: '7203.T', name: 'トヨタ自動車', sector: '自動車' },
    { symbol: '6758.T', name: 'ソニーG', sector: 'エレクトロニクス' },
    { symbol: '9984.T', name: 'ソフトバンクG', sector: '通信' },
    { symbol: '7974.T', name: '任天堂', sector: 'ゲーム' },
    { symbol: '9983.T', name: 'ファストリ', sector: '小売' },

    // 米国テクノロジー
    { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer' },
    { symbol: 'NVDA', name: 'NVIDIA', sector: 'Semiconductors' },
    { symbol: 'TSLA', name: 'Tesla', sector: 'Automotive' },
    { symbol: 'META', name: 'Meta', sector: 'Technology' },
];

export const INITIAL_CASH = 10000000; // 1000万円
