// Portfolio Engine - Manages user's portfolio and trades

import { Portfolio, Position, Trade, Stock, INITIAL_CASH } from './types';

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
            trades: []
        };
    }

    getPortfolio(): Portfolio {
        return { ...this.portfolio };
    }

    // Buy shares
    buy(stock: Stock, shares: number): { success: boolean; message: string; trade?: Trade } {
        const totalCost = stock.price * shares;

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
                averageCost: stock.price,
                currentPrice: stock.price,
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
            price: stock.price,
            total: totalCost,
            timestamp: Date.now()
        };
        this.portfolio.trades.unshift(trade);

        return { success: true, message: `${stock.symbol} を ${shares}株 購入しました`, trade };
    }

    // Sell shares
    sell(stock: Stock, shares: number): { success: boolean; message: string; trade?: Trade } {
        const position = this.portfolio.positions[stock.symbol];

        if (!position) {
            return { success: false, message: 'この銘柄を保有していません' };
        }

        if (shares > position.shares) {
            return { success: false, message: '保有株数を超えて売却できません' };
        }

        if (shares <= 0) {
            return { success: false, message: '株数を正しく入力してください' };
        }

        const saleValue = stock.price * shares;

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
            price: stock.price,
            total: saleValue,
            timestamp: Date.now()
        };
        this.portfolio.trades.unshift(trade);

        return { success: true, message: `${stock.symbol} を ${shares}株 売却しました`, trade };
    }

    // Update positions with current prices
    updatePrices(stocks: Stock[]): void {
        let totalMarketValue = this.portfolio.cash;
        let totalCost = INITIAL_CASH;

        for (const stock of stocks) {
            const position = this.portfolio.positions[stock.symbol];
            if (position) {
                position.currentPrice = stock.price;
                position.marketValue = position.shares * stock.price;
                position.profit = position.marketValue - position.totalCost;
                position.profitPercent = (position.profit / position.totalCost) * 100;
                totalMarketValue += position.marketValue;
            }
        }

        // Calculate totals
        const totalPositionCost = Object.values(this.portfolio.positions)
            .reduce((sum, p) => sum + p.totalCost, 0);

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
        return {
            ...this.portfolio,
            positions: encodedPositions
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

        const sanitized: Portfolio = {
            cash: data.cash ?? INITIAL_CASH,
            positions: decodedPositions,
            totalValue: data.totalValue ?? INITIAL_CASH,
            totalProfit: data.totalProfit ?? 0,
            totalProfitPercent: data.totalProfitPercent ?? 0,
            trades: data.trades || []
        };
        return new PortfolioEngine(sanitized);
    }
}
