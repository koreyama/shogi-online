// Portfolio Engine - Manages user's portfolio and trades

import { Portfolio, Position, Trade, Stock, INITIAL_CASH, LimitOrder, StopLoss, PortfolioSnapshot } from './types';

export class PortfolioEngine {
    private portfolio: Portfolio;

    constructor(initialPortfolio?: Portfolio) {
        this.portfolio = initialPortfolio || this.createInitialPortfolio();
    }

    createInitialPortfolio(): Portfolio {
        return {
            cash: INITIAL_CASH,
            positions: {},
            totalValue: INITIAL_CASH,
            totalProfit: 0,
            totalProfitPercent: 0,
            trades: [],
            limitOrders: [],
            stopLosses: {},
            watchlist: [],
            history: []
        };
    }

    getPortfolio(): Portfolio {
        return { ...this.portfolio };
    }

    // Buy shares
    buy(stock: Stock, shares: number): { success: boolean; message: string; trade?: Trade } {
        const price = stock.priceInJPY || stock.price; // Fallback for safety
        const totalCost = price * shares;

        if (totalCost > this.portfolio.cash) {
            return { success: false, message: '資金が不足しています' };
        }

        if (shares <= 0) {
            return { success: false, message: '株数を正しく入力してください' };
        }

        // Deduct cash
        this.portfolio.cash -= totalCost;

        // Update or create position
        const existingPosition = this.portfolio.positions[stock.symbol];
        if (existingPosition) {
            const totalShares = existingPosition.shares + shares;
            const totalCostBasis = existingPosition.totalCost + totalCost;
            existingPosition.shares = totalShares;
            existingPosition.totalCost = totalCostBasis;
            existingPosition.averageCost = totalCostBasis / totalShares;
        } else {
            this.portfolio.positions[stock.symbol] = {
                symbol: stock.symbol,
                name: stock.name,
                shares,
                averageCost: price,
                currentPrice: price,
                totalCost: totalCost,
                marketValue: totalCost,
                profit: 0,
                profitPercent: 0
            };
        }

        // Record trade
        const trade: Trade = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            symbol: stock.symbol,
            type: 'buy',
            shares,
            price: price, // Record in JPY
            total: totalCost,
            timestamp: Date.now()
        };
        this.portfolio.trades.unshift(trade);

        return { success: true, message: `${stock.symbol} を ${shares}株 購入しました`, trade };
    }

    // Sell shares
    sell(stock: Stock, shares: number): { success: boolean; message: string; trade?: Trade } {
        const position = this.portfolio.positions[stock.symbol];
        const price = stock.priceInJPY || stock.price;

        if (!position) {
            return { success: false, message: 'この銘柄を保有していません' };
        }

        if (shares > position.shares) {
            return { success: false, message: '保有株数を超えて売却できません' };
        }

        if (shares <= 0) {
            return { success: false, message: '株数を正しく入力してください' };
        }

        const saleValue = price * shares;

        // Add cash
        this.portfolio.cash += saleValue;

        // Update position
        if (shares === position.shares) {
            // Sell all
            delete this.portfolio.positions[stock.symbol];
        } else {
            // Partial sell
            const remainingShares = position.shares - shares;
            const remainingCost = position.averageCost * remainingShares;
            position.shares = remainingShares;
            position.totalCost = remainingCost;
        }

        // Record trade
        const trade: Trade = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            symbol: stock.symbol,
            type: 'sell',
            shares,
            price: price, // Record in JPY
            total: saleValue,
            timestamp: Date.now()
        };
        this.portfolio.trades.unshift(trade);

        return { success: true, message: `${stock.symbol} を ${shares}株 売却しました`, trade };
    }

    // Update positions with current prices
    updatePrices(stocks: Stock[]): void {
        // Create a map of stock prices for quick lookup
        const priceMap: Record<string, number> = {};
        for (const stock of stocks) {
            priceMap[stock.symbol] = stock.priceInJPY || stock.price;
        }

        // Update all positions and calculate market values
        let totalMarketValue = this.portfolio.cash;

        for (const [symbol, position] of Object.entries(this.portfolio.positions)) {
            // Use price from provided stocks, or keep existing currentPrice if not found
            const price = priceMap[symbol] ?? position.currentPrice;
            position.currentPrice = price;
            position.marketValue = position.shares * price;
            position.profit = position.marketValue - position.totalCost;
            position.profitPercent = position.totalCost > 0 ? (position.profit / position.totalCost) * 100 : 0;
            totalMarketValue += position.marketValue;
        }

        // Calculate totals
        this.portfolio.totalValue = totalMarketValue;
        this.portfolio.totalProfit = totalMarketValue - INITIAL_CASH;
        this.portfolio.totalProfitPercent = (this.portfolio.totalProfit / INITIAL_CASH) * 100;
    }

    // Get max shares that can be bought
    getMaxBuyShares(price: number): number {
        return Math.floor(this.portfolio.cash / price);
    }

    // Get position for a symbol
    getPosition(symbol: string): Position | undefined {
        return this.portfolio.positions[symbol];
    }

    // ===== LIMIT ORDERS =====
    createLimitOrder(symbol: string, name: string, type: 'buy' | 'sell', shares: number, targetPrice: number): LimitOrder {
        const order: LimitOrder = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            symbol,
            name,
            type,
            shares,
            targetPrice,
            createdAt: Date.now(),
            status: 'pending'
        };
        this.portfolio.limitOrders.push(order);
        return order;
    }

    cancelLimitOrder(orderId: string): boolean {
        const order = this.portfolio.limitOrders.find(o => o.id === orderId);
        if (order && order.status === 'pending') {
            order.status = 'cancelled';
            return true;
        }
        return false;
    }

    getPendingOrders(): LimitOrder[] {
        return this.portfolio.limitOrders.filter(o => o.status === 'pending');
    }

    checkAndExecuteOrders(stocks: Stock[]): Trade[] {
        const executedTrades: Trade[] = [];
        const priceMap: Record<string, number> = {};
        for (const stock of stocks) {
            priceMap[stock.symbol] = stock.priceInJPY || stock.price;
        }

        for (const order of this.portfolio.limitOrders) {
            if (order.status !== 'pending') continue;
            const currentPrice = priceMap[order.symbol];
            if (!currentPrice) continue;

            let shouldExecute = false;
            if (order.type === 'buy' && currentPrice <= order.targetPrice) {
                shouldExecute = true;
            } else if (order.type === 'sell' && currentPrice >= order.targetPrice) {
                shouldExecute = true;
            }

            if (shouldExecute) {
                const stock: Stock = {
                    symbol: order.symbol,
                    name: order.name,
                    price: currentPrice,
                    priceInJPY: currentPrice,
                    previousClose: currentPrice,
                    change: 0,
                    changePercent: 0,
                    high: currentPrice,
                    low: currentPrice,
                    volume: 0,
                    lastUpdated: Date.now()
                };

                const result = order.type === 'buy'
                    ? this.buy(stock, order.shares)
                    : this.sell(stock, order.shares);

                if (result.success && result.trade) {
                    order.status = 'executed';
                    executedTrades.push(result.trade);
                }
            }
        }
        return executedTrades;
    }

    // ===== STOP LOSS =====
    setStopLoss(symbol: string, triggerPrice: number, shares: number = 0): void {
        this.portfolio.stopLosses[symbol] = { symbol, triggerPrice, shares };
    }

    removeStopLoss(symbol: string): void {
        delete this.portfolio.stopLosses[symbol];
    }

    getStopLoss(symbol: string): StopLoss | undefined {
        return this.portfolio.stopLosses[symbol];
    }

    checkStopLosses(stocks: Stock[]): Trade[] {
        const executedTrades: Trade[] = [];
        const priceMap: Record<string, number> = {};
        for (const stock of stocks) {
            priceMap[stock.symbol] = stock.priceInJPY || stock.price;
        }

        for (const [symbol, stopLoss] of Object.entries(this.portfolio.stopLosses)) {
            const currentPrice = priceMap[symbol];
            const position = this.portfolio.positions[symbol];
            if (!currentPrice || !position) continue;

            if (currentPrice <= stopLoss.triggerPrice) {
                const sharesToSell = stopLoss.shares > 0 ? Math.min(stopLoss.shares, position.shares) : position.shares;
                const stock: Stock = {
                    symbol,
                    name: position.name,
                    price: currentPrice,
                    priceInJPY: currentPrice,
                    previousClose: currentPrice,
                    change: 0,
                    changePercent: 0,
                    high: currentPrice,
                    low: currentPrice,
                    volume: 0,
                    lastUpdated: Date.now()
                };

                const result = this.sell(stock, sharesToSell);
                if (result.success && result.trade) {
                    executedTrades.push(result.trade);
                    delete this.portfolio.stopLosses[symbol];
                }
            }
        }
        return executedTrades;
    }

    // ===== WATCHLIST =====
    addToWatchlist(symbol: string): void {
        if (!this.portfolio.watchlist.includes(symbol)) {
            this.portfolio.watchlist.push(symbol);
        }
    }

    removeFromWatchlist(symbol: string): void {
        this.portfolio.watchlist = this.portfolio.watchlist.filter(s => s !== symbol);
    }

    getWatchlist(): string[] {
        return [...this.portfolio.watchlist];
    }

    isInWatchlist(symbol: string): boolean {
        return this.portfolio.watchlist.includes(symbol);
    }

    // ===== PORTFOLIO HISTORY =====
    recordSnapshot(): void {
        const snapshot: PortfolioSnapshot = {
            timestamp: Date.now(),
            totalValue: this.portfolio.totalValue,
            cash: this.portfolio.cash,
            positionCount: Object.keys(this.portfolio.positions).length
        };
        this.portfolio.history.push(snapshot);
        // Keep only last 90 days
        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        this.portfolio.history = this.portfolio.history.filter(s => s.timestamp > ninetyDaysAgo);
    }

    getHistory(): PortfolioSnapshot[] {
        return [...this.portfolio.history];
    }

    // Encode symbol for Firebase key (. is not allowed)
    private static encodeSymbol(symbol: string): string {
        return symbol.replace(/\./g, '_DOT_');
    }

    // Decode symbol from Firebase key
    private static decodeSymbol(key: string): string {
        return key.replace(/_DOT_/g, '.');
    }

    // Export portfolio for saving (encode symbols for Firebase)
    toJSON(): Portfolio {
        const encodedPositions: Record<string, Position> = {};
        for (const [symbol, position] of Object.entries(this.portfolio.positions)) {
            encodedPositions[PortfolioEngine.encodeSymbol(symbol)] = position;
        }
        const encodedStopLosses: Record<string, StopLoss> = {};
        for (const [symbol, stopLoss] of Object.entries(this.portfolio.stopLosses)) {
            encodedStopLosses[PortfolioEngine.encodeSymbol(symbol)] = stopLoss;
        }
        return {
            ...this.portfolio,
            positions: encodedPositions,
            stopLosses: encodedStopLosses
        };
    }

    // Import portfolio from saved data (decode symbols from Firebase)
    static fromJSON(data: Portfolio): PortfolioEngine {
        // Decode positions keys
        const decodedPositions: Record<string, Position> = {};
        if (data.positions) {
            for (const [key, position] of Object.entries(data.positions)) {
                decodedPositions[PortfolioEngine.decodeSymbol(key)] = position;
            }
        }
        // Decode stopLosses keys
        const decodedStopLosses: Record<string, StopLoss> = {};
        if (data.stopLosses) {
            for (const [key, stopLoss] of Object.entries(data.stopLosses)) {
                decodedStopLosses[PortfolioEngine.decodeSymbol(key)] = stopLoss;
            }
        }

        const sanitized: Portfolio = {
            cash: data.cash ?? INITIAL_CASH,
            positions: decodedPositions,
            totalValue: data.totalValue ?? INITIAL_CASH,
            totalProfit: data.totalProfit ?? 0,
            totalProfitPercent: data.totalProfitPercent ?? 0,
            trades: data.trades || [],
            limitOrders: data.limitOrders || [],
            stopLosses: decodedStopLosses,
            watchlist: data.watchlist || [],
            history: data.history || []
        };
        return new PortfolioEngine(sanitized);
    }
}
