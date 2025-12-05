// Next.js API Route for Stock Prices and Search
// Proxies requests to Yahoo Finance to avoid CORS issues

import { NextRequest, NextResponse } from 'next/server';

const YAHOO_CHART_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_SEARCH_API = 'https://query1.finance.yahoo.com/v1/finance/search';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const query = searchParams.get('query'); // For name search

    // Name-based search
    if (query) {
        try {
            const response = await fetch(
                `${YAHOO_SEARCH_API}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    }
                }
            );

            if (!response.ok) {
                return NextResponse.json({ error: 'Search failed' }, { status: response.status });
            }

            const data = await response.json();
            const quotes = data.quotes || [];

            // Filter to only stocks (not ETFs, funds, etc.)
            const stocks = quotes
                .filter((q: Record<string, unknown>) => q.quoteType === 'EQUITY')
                .slice(0, 5)
                .map((q: Record<string, unknown>) => ({
                    symbol: q.symbol,
                    name: q.shortname || q.longname || q.symbol,
                    exchange: q.exchange
                }));

            return NextResponse.json({ results: stocks });
        } catch (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }
    }

    // Symbol-based price fetch
    if (!symbol) {
        return NextResponse.json({ error: 'Symbol or query is required' }, { status: 400 });
    }

    try {
        const response = await fetch(
            `${YAHOO_CHART_API}/${symbol}?interval=1d&range=5d`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                next: { revalidate: 60 }
            }
        );

        if (!response.ok) {
            return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result) {
            return NextResponse.json({ error: 'No data available' }, { status: 404 });
        }

        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        const closes = quote?.close?.filter((c: number | null) => c !== null) || [];

        // Get actual previous close from historical data
        const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 0;
        const previousClose = meta.chartPreviousClose || meta.previousClose || (closes.length > 1 ? closes[closes.length - 2] : currentPrice);

        const change = currentPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        const stockData = {
            symbol,
            shortName: meta.shortName || meta.longName || symbol,
            price: currentPrice,
            previousClose: previousClose,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            high: meta.regularMarketDayHigh || (quote?.high ? Math.max(...quote.high.filter((h: number | null) => h !== null)) : currentPrice),
            low: meta.regularMarketDayLow || (quote?.low ? Math.min(...quote.low.filter((l: number | null) => l !== null)) : currentPrice),
            volume: meta.regularMarketVolume || 0,
            currency: meta.currency,
            exchangeName: meta.exchangeName,
            lastUpdated: Date.now()
        };

        return NextResponse.json(stockData);
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
