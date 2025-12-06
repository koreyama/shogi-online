// Stock API Service - Real data via API + search support

import { Stock, PriceHistory, FEATURED_STOCKS, USD_JPY_RATE } from './types';

// Base prices for simulation fallback
const BASE_PRICES: Record<string, number> = {
    // Japanese stocks
    '7203.T': 2850, '6758.T': 4200, '9984.T': 8500, '7974.T': 8200, '9983.T': 45000,
    '6501.T': 12500, '6902.T': 2200, '8306.T': 1650, '8316.T': 8500, '9432.T': 180,
    '9433.T': 4600, '4063.T': 5800, '6367.T': 28000, '6594.T': 6500, '7267.T': 1450,
    '6981.T': 3200, '8035.T': 28000, '4519.T': 6200, '6098.T': 7800, '6861.T': 65000,
    // US stocks
    'AAPL': 195, 'MSFT': 430, 'GOOGL': 175, 'AMZN': 185, 'NVDA': 140, 'META': 550,
    'TSLA': 250, 'AMD': 145, 'INTC': 45, 'CRM': 320, 'ORCL': 140, 'ADBE': 580,
    'NFLX': 485, 'PYPL': 65, 'JPM': 195, 'BAC': 38, 'WFC': 55, 'GS': 490,
    'V': 285, 'MA': 470, 'JNJ': 160, 'UNH': 580, 'PFE': 28, 'MRK': 115, 'ABBV': 175,
    'WMT': 165, 'COST': 750, 'HD': 380, 'MCD': 290, 'NKE': 105, 'KO': 62, 'PEP': 170,
    'XOM': 105, 'CVX': 150, 'BA': 195, 'CAT': 340, 'GE': 170, 'DIS': 95, 'SBUX': 100,
};

const currentPrices: Record<string, { price: number; previousClose: number; history: number[] }> = {};

// Yahoo Finance API endpoints
const YAHOO_CHART_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_SEARCH_API = 'https://query1.finance.yahoo.com/v1/finance/search';

// CORS proxy for client-side requests (fallback options)
const CORS_PROXIES = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

// Fetch stock price via client-side CORS proxy
export async function fetchStockPrice(symbol: string): Promise<Stock | null> {
    const url = `${YAHOO_CHART_API}/${symbol}?interval=1d&range=5d`;

    for (const proxyFn of CORS_PROXIES) {
        try {
            const proxyUrl = proxyFn(url);
            const response = await fetch(proxyUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) continue;

            const data = await response.json();
            const result = data.chart?.result?.[0];

            if (!result) continue;

            const meta = result.meta;
            const quote = result.indicators?.quote?.[0];
            const closes = quote?.close?.filter((c: number | null) => c !== null) || [];

            const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 0;
            const previousClose = meta.chartPreviousClose || meta.previousClose || (closes.length > 1 ? closes[closes.length - 2] : currentPrice);
            const change = currentPrice - previousClose;
            const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

            const featuredInfo = FEATURED_STOCKS.find(s => s.symbol === symbol);
            const currency = meta.currency || (symbol.includes('.T') ? 'JPY' : 'USD');
            const priceInJPY = currency === 'USD' ? currentPrice * USD_JPY_RATE : currentPrice;

            return {
                symbol,
                name: featuredInfo?.name || meta.shortName || meta.longName || symbol,
                price: currentPrice,
                priceInJPY: Math.round(priceInJPY),
                previousClose: previousClose,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                high: meta.regularMarketDayHigh || currentPrice,
                low: meta.regularMarketDayLow || currentPrice,
                volume: meta.regularMarketVolume || 0,
                sector: featuredInfo?.sector,
                currency: currency,
                lastUpdated: Date.now()
            };
        } catch (err) {
            console.warn(`CORS proxy failed for ${symbol}:`, err);
            continue;
        }
    }

    // All proxies failed, use simulation
    return getSimulatedStock(symbol);
}

// Search result type
interface SearchResult {
    symbol: string;
    name: string;
    exchange?: string;
}

// Search for stocks by symbol or name via CORS proxy
export async function searchStocks(query: string): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url = `${YAHOO_SEARCH_API}?q=${encodeURIComponent(trimmed)}&quotesCount=10&newsCount=0`;

    for (const proxyFn of CORS_PROXIES) {
        try {
            const proxyUrl = proxyFn(url);
            const response = await fetch(proxyUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) continue;

            const data = await response.json();
            const quotes = data.quotes || [];

            // Filter to only stocks (EQUITY type)
            const stocks = quotes
                .filter((q: Record<string, unknown>) => q.quoteType === 'EQUITY')
                .slice(0, 5)
                .map((q: Record<string, unknown>) => ({
                    symbol: q.symbol as string,
                    name: (q.shortname || q.longname || q.symbol) as string,
                    exchange: q.exchange as string | undefined
                }));

            return stocks;
        } catch (err) {
            console.warn('Search proxy failed:', err);
            continue;
        }
    }

    return [];
}

// Fetch a specific stock by symbol via CORS proxy
export async function searchStock(symbol: string): Promise<Stock | null> {
    const upperSymbol = symbol.toUpperCase().trim();
    if (!upperSymbol) return null;

    // Use the same fetchStockPrice function which already uses CORS proxy
    return fetchStockPrice(upperSymbol);
}

// Fetch featured stocks in parallel for better performance
export async function fetchFeaturedStocks(): Promise<Stock[]> {
    // Fetch all stocks in parallel
    const results = await Promise.allSettled(
        FEATURED_STOCKS.map(info => fetchStockPrice(info.symbol))
    );

    const stocks: Stock[] = [];
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
            stocks.push(result.value);
        }
    }

    return stocks.length > 0 ? stocks : getSimulatedFeaturedStocks();
}

// Get price history (simulated for now)
export function getPriceHistory(symbol: string, days: number = 30): PriceHistory[] {
    initializePrices(symbol);

    const data = currentPrices[symbol];
    if (!data) return [];

    const history: PriceHistory[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    let price = data.previousClose;
    const vol = symbol.includes('TSLA') || symbol.includes('NVDA') ? 0.03 : 0.015;

    for (let i = days; i >= 0; i--) {
        const change = price * vol * (Math.random() - 0.5) * 2;
        price = Math.max(price + change, price * 0.8);

        const high = price * (1 + Math.random() * 0.02);
        const low = price * (1 - Math.random() * 0.02);

        history.push({
            timestamp: now - i * dayMs,
            open: price - change * 0.5,
            high,
            low,
            close: price,
            volume: Math.floor(Math.random() * 10000000)
        });
    }

    // Set final price to current
    if (history.length > 0) {
        history[history.length - 1].close = data.price;
    }

    return history;
}

// Simulation helpers
function initializePrices(symbol?: string) {
    const symbols = symbol ? [symbol] : Object.keys(BASE_PRICES);

    for (const sym of symbols) {
        if (!currentPrices[sym]) {
            const base = BASE_PRICES[sym] || (100 + Math.random() * 400);
            const price = base * (1 + (Math.random() - 0.5) * 0.02);
            currentPrices[sym] = { price, previousClose: price, history: [] };
        }
    }
}

function simulatePriceMovement(symbol: string): void {
    const data = currentPrices[symbol];
    if (!data) return;

    const vol = symbol.includes('TSLA') || symbol.includes('NVDA') ? 0.025 : 0.015;
    const change = data.price * vol * (Math.random() - 0.5) * 2;
    data.price = Math.max(data.price + change, data.price * 0.5);
}

export function getSimulatedStock(symbol: string): Stock | null {
    initializePrices(symbol);

    if (!currentPrices[symbol] && !BASE_PRICES[symbol]) {
        // Unknown symbol - create random stock
        const base = 50 + Math.random() * 200;
        currentPrices[symbol] = { price: base, previousClose: base, history: [] };
    }

    const data = currentPrices[symbol];
    if (!data) return null;

    simulatePriceMovement(symbol);

    const featuredInfo = FEATURED_STOCKS.find(s => s.symbol === symbol);
    const change = data.price - data.previousClose;
    const changePercent = (change / data.previousClose) * 100;
    const isJP = symbol.includes('.T');
    const currency = isJP ? 'JPY' : 'USD';
    const priceInJPY = currency === 'USD' ? data.price * USD_JPY_RATE : data.price;
    const finalPrice = isJP ? Math.round(data.price) : Math.round(data.price * 100) / 100;

    return {
        symbol,
        name: featuredInfo?.name || symbol,
        price: finalPrice,
        priceInJPY: Math.round(priceInJPY),
        previousClose: isJP ? Math.round(data.previousClose) : Math.round(data.previousClose * 100) / 100,
        change: isJP ? Math.round(change) : Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        high: data.price * 1.01,
        low: data.price * 0.99,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        sector: featuredInfo?.sector,
        currency: currency,
        lastUpdated: Date.now()
    };
}

function getSimulatedFeaturedStocks(): Stock[] {
    return FEATURED_STOCKS.map(s => getSimulatedStock(s.symbol)).filter(Boolean) as Stock[];
}

// For backward compatibility
export async function fetchAllStocks(): Promise<Stock[]> {
    return fetchFeaturedStocks();
}

export function getSimulatedStocks(): Stock[] {
    return getSimulatedFeaturedStocks();
}
