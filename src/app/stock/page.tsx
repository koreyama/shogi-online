'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Stock, Portfolio, LeaderboardEntry, INITIAL_CASH, FEATURED_STOCKS, USD_JPY_RATE } from '@/lib/stock/types';
import { PortfolioEngine } from '@/lib/stock/engine';
import { fetchFeaturedStocks, searchStock, searchStocks, fetchStockPrice, fetchExchangeRate } from '@/lib/stock/api';
import { StockCard } from '@/components/stock/StockCard';
import { TradeModal } from '@/components/stock/TradeModal';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firebase/users';
import { ref, onValue, set, get } from 'firebase/database';
import HideChatBot from '@/components/HideChatBot';

interface SearchSuggestion {
    symbol: string;
    name: string;
    exchange?: string;
}

const IconBack = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const IconRefresh = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
);

const IconSearch = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

export default function StockTradePage() {
    const router = useRouter();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    const [stocks, setStocks] = useState<Stock[]>([]);
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [engine, setEngine] = useState<PortfolioEngine | null>(null);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [showTradeModal, setShowTradeModal] = useState(false);

    // Ref to track latest engine for async operations
    const engineRef = React.useRef<PortfolioEngine | null>(null);
    useEffect(() => {
        engineRef.current = engine;
    }, [engine]);

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [cloudSyncStatus, setCloudSyncStatus] = useState<'local' | 'cloud' | 'syncing'>('local');
    const [exchangeRate, setExchangeRate] = useState<number>(USD_JPY_RATE);
    const [profileName, setProfileName] = useState<string>('');

    // Fetch user profile name
    useEffect(() => {
        if (user) {
            getUserProfile(user.uid).then(profile => {
                if (profile && profile.displayName) {
                    setProfileName(profile.displayName);
                }
            });
        }
    }, [user]);

    // Force leaderboard update immediately when profile name becomes available
    useEffect(() => {
        if (user && profileName && portfolio) {
            set(ref(db, `stock_leaderboard/${user.uid}`), {
                odId: user.uid,
                odName: profileName,
                totalValue: portfolio.totalValue,
                totalProfit: portfolio.totalProfit,
                totalProfitPercent: portfolio.totalProfitPercent,
                lastUpdated: Date.now()
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileName]);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
    const [searchResult, setSearchResult] = useState<Stock | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Load portfolio from Firebase (login required)
    useEffect(() => {
        if (authLoading) return;
        if (!user) return; // Must be logged in

        const loadPortfolio = async () => {
            setCloudSyncStatus('syncing');
            try {
                const snapshot = await get(ref(db, `stock_portfolios/${user.uid}`));
                let eng: PortfolioEngine;
                if (snapshot.exists()) {
                    eng = PortfolioEngine.fromJSON(snapshot.val());
                } else {
                    eng = new PortfolioEngine();
                    await set(ref(db, `stock_portfolios/${user.uid}`), eng.toJSON());
                }
                setEngine(eng);
                setPortfolio(eng.getPortfolio());
                setCloudSyncStatus('cloud');
            } catch (error) {
                console.error('Failed to load from cloud:', error);
                setEngine(new PortfolioEngine());
                setPortfolio(new PortfolioEngine().getPortfolio());
                setCloudSyncStatus('local');
            }
        };

        loadPortfolio();
    }, [authLoading, user]);

    // Save portfolio to Firebase
    const savePortfolio = useCallback(async (eng: PortfolioEngine) => {
        if (!user) return;
        try {
            await set(ref(db, `stock_portfolios/${user.uid}`), eng.toJSON());
        } catch (error) {
            console.error('Failed to save to cloud:', error);
        }
    }, [user]);


    // Fetch featured stocks
    const fetchPrices = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch rate first to ensure it settles
            let rate = USD_JPY_RATE;
            try {
                rate = await fetchExchangeRate();
            } catch (e) {
                console.warn('Failed to fetch exchange rate, using default:', e);
            }

            // Should always be a number due to fallback in api.ts, but double safety
            setExchangeRate(rate || USD_JPY_RATE);

            const stockData = await fetchFeaturedStocks();
            setStocks(stockData);
            setLastUpdate(new Date());

            const currentEngine = engineRef.current;
            if (currentEngine) {
                currentEngine.updatePrices(stockData);
                setPortfolio(currentEngine.getPortfolio());
                savePortfolio(currentEngine);
                updateLeaderboard(currentEngine.getPortfolio());
            }
        } catch (error) {
            console.error('Failed to fetch prices:', error);
        } finally {
            setIsLoading(false);
        }
    }, [savePortfolio]);

    useEffect(() => {
        if (engine) fetchPrices();
    }, [engine, fetchPrices]);

    useEffect(() => {
        if (!engine) return;
        const interval = setInterval(fetchPrices, 60000);
        return () => clearInterval(interval);
    }, [engine, fetchPrices]);

    // Leaderboard
    useEffect(() => {
        const leaderboardRef = ref(db, 'stock_leaderboard');
        const unsubscribe = onValue(leaderboardRef, (snapshot) => {
            if (snapshot.exists()) {
                const entries: LeaderboardEntry[] = Object.values(snapshot.val());
                entries.sort((a, b) => b.totalValue - a.totalValue);
                setLeaderboard(entries.slice(0, 10));
            }
        });
        return () => unsubscribe();
    }, []);

    const updateLeaderboard = async (p: Portfolio) => {
        if (!user) return;

        try {
            await set(ref(db, `stock_leaderboard/${user.uid}`), {
                odId: user.uid,
                odName: profileName || user.displayName || 'Unknown',
                totalValue: p.totalValue,
                totalProfit: p.totalProfit,
                totalProfitPercent: p.totalProfitPercent,
                lastUpdated: Date.now()
            });
        } catch { }
    };

    // Search functionality - search by name
    const handleSearchInput = async (value: string) => {
        setSearchQuery(value);
        setSearchError('');
        setSearchResult(null);

        if (value.length >= 2) {
            const suggestions = await searchStocks(value);
            setSearchSuggestions(suggestions);
        } else {
            setSearchSuggestions([]);
        }
    };

    // Select a suggestion
    const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
        setIsSearching(true);
        setSearchSuggestions([]);
        setSearchQuery(suggestion.symbol);

        try {
            const result = await searchStock(suggestion.symbol);
            if (result) {
                setSearchResult(result);
            } else {
                setSearchError('株価データを取得できませんでした');
            }
        } catch {
            setSearchError('検索に失敗しました');
        } finally {
            setIsSearching(false);
        }
    };

    // Direct symbol search
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError('');
        setSearchResult(null);
        setSearchSuggestions([]);

        try {
            const result = await searchStock(searchQuery);
            if (result) {
                setSearchResult(result);
            } else {
                setSearchError('銘柄が見つかりませんでした');
            }
        } catch {
            setSearchError('検索に失敗しました');
        } finally {
            setIsSearching(false);
        }
    };

    // Open trade modal from position
    const handlePositionClick = async (symbol: string) => {
        // Try to find in featured stocks first
        let stock = stocks.find(s => s.symbol === symbol);

        if (!stock) {
            // Fetch the stock price
            stock = await fetchStockPrice(symbol) || undefined;
        }

        if (stock) {
            setSelectedStock(stock);
            setShowTradeModal(true);
        }
    };

    // Trade handlers
    const handleBuy = (shares: number) => {
        if (!engine || !selectedStock) return;
        const result = engine.buy(selectedStock, shares);
        if (result.success) {
            setPortfolio(engine.getPortfolio());
            savePortfolio(engine);
            updateLeaderboard(engine.getPortfolio());
            setMessage({ type: 'success', text: result.message });
            setShowTradeModal(false);
            setSearchResult(null);
            setSearchQuery('');
        } else {
            setMessage({ type: 'error', text: result.message });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSell = (shares: number) => {
        if (!engine || !selectedStock) return;
        const result = engine.sell(selectedStock, shares);
        if (result.success) {
            setPortfolio(engine.getPortfolio());
            savePortfolio(engine);
            updateLeaderboard(engine.getPortfolio());
            setMessage({ type: 'success', text: result.message });
            setShowTradeModal(false);
        } else {
            setMessage({ type: 'error', text: result.message });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const formatCurrency = (value: number) => {
        return `¥${value.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
    };

    // Loading state
    if (authLoading || !user) {
        return <main className={styles.main}><div className={styles.loading}>Loading...</div></main>;
    }

    // Loading portfolio
    if (!portfolio) {
        return <main className={styles.main}><div className={styles.loading}>Loading portfolio...</div></main>;
    }

    return (
        <main className={styles.main}>
            <HideChatBot />
            <header className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backBtn}>
                    <IconBack size={20} /> Back
                </button>
                <h1 className={styles.title}>Stock Trade Simulator</h1>
                <button onClick={fetchPrices} className={styles.refreshBtn} disabled={isLoading}>
                    <IconRefresh size={18} />
                </button>
            </header>

            {message && (
                <div className={`${styles.toast} ${styles[message.type]}`}>{message.text}</div>
            )}

            {/* Portfolio Summary */}
            <section className={styles.portfolioSection}>
                <div className={styles.portfolioCard}>
                    <div className={styles.portfolioHeaderRow}>
                        <div className={styles.portfolioMain}>
                            <div className={styles.totalValue}>
                                <div className={styles.totalValueHeader}>
                                    <span className={styles.label}>TOTAL VALUE</span>
                                    <span className={styles.exchangeRate}>USD/JPY: ¥{(exchangeRate || USD_JPY_RATE).toFixed(2)}</span>
                                </div>
                                <span className={styles.value}>{portfolio && formatCurrency(portfolio.totalValue)}</span>
                            </div>
                            <div className={`${styles.totalProfit} ${portfolio && portfolio.totalProfit >= 0 ? styles.up : styles.down}`}>
                                <span className={styles.label}>P&L</span>
                                <span className={styles.value}>
                                    {portfolio && portfolio.totalProfit >= 0 ? '+' : ''}{portfolio && formatCurrency(portfolio.totalProfit)}
                                    ({portfolio && portfolio.totalProfit >= 0 ? '+' : ''}{portfolio && portfolio.totalProfitPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                        <button
                            className={styles.resetBtn}
                            onClick={() => {
                                if (window.confirm('本当に資産をリセットしますか？\nこの操作は取り消せません。')) {
                                    const newEngine = new PortfolioEngine();
                                    setEngine(newEngine);
                                    engineRef.current = newEngine; // Immediately update ref
                                    setPortfolio(newEngine.getPortfolio());
                                    savePortfolio(newEngine);
                                    updateLeaderboard(newEngine.getPortfolio());
                                    setMessage({ type: 'success', text: '資産をリセットしました' });
                                    setTimeout(() => setMessage(null), 3000);
                                }
                            }}
                        >
                            リセット
                        </button>
                    </div>

                    <div className={styles.cashDisplay}>
                        Cash: {portfolio && formatCurrency(portfolio.cash)}
                        <span className={styles.syncStatus}>
                            {cloudSyncStatus === 'cloud' && user ? (
                                <span className={styles.cloudSync}>Cloud Sync ON ({profileName || user.displayName})</span>
                            ) : cloudSyncStatus === 'syncing' ? (
                                <span className={styles.syncing}>Syncing...</span>
                            ) : (
                                <span className={styles.localOnly}>Local Only</span>
                            )}
                        </span>
                    </div>
                </div>
            </section>

            {/* Search Bar */}
            <section className={styles.searchSection}>
                <div className={styles.searchWrapper}>
                    <div className={styles.searchBar}>
                        <IconSearch size={18} />
                        <input
                            type="text"
                            placeholder="銘柄名またはコードで検索 (例: Apple, AAPL)"
                            value={searchQuery}
                            onChange={e => handleSearchInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className={styles.searchInput}
                        />
                        <button onClick={handleSearch} className={styles.searchBtn} disabled={isSearching}>
                            {isSearching ? '...' : '検索'}
                        </button>
                    </div>

                    {/* Search suggestions dropdown */}
                    {searchSuggestions.length > 0 && (
                        <ul className={styles.suggestions}>
                            {searchSuggestions.map(s => (
                                <li
                                    key={s.symbol}
                                    className={styles.suggestionItem}
                                    onClick={() => handleSelectSuggestion(s)}
                                >
                                    <span className={styles.suggestionSymbol}>{s.symbol}</span>
                                    <span className={styles.suggestionName}>{s.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {searchError && <div className={styles.searchError}>{searchError}</div>}

                {searchResult && (
                    <div className={styles.searchResult}>
                        <StockCard
                            stock={searchResult}
                            onSelect={(s) => {
                                setSelectedStock(s);
                                setShowTradeModal(true);
                            }}
                            ownedShares={portfolio.positions[searchResult.symbol]?.shares}
                        />
                    </div>
                )}
            </section>

            {/* Main Content */}
            <div className={styles.content}>
                {/* Featured Stocks */}
                <section className={styles.stocksSection}>
                    <h2 className={styles.sectionTitle}>
                        Featured Stocks
                        {lastUpdate && (
                            <span className={styles.updateTime}>
                                Updated: {lastUpdate.toLocaleTimeString('ja-JP')}
                            </span>
                        )}
                    </h2>
                    <div className={styles.stockGrid}>
                        {stocks.map(stock => (
                            <StockCard
                                key={stock.symbol}
                                stock={stock}
                                onSelect={(s) => {
                                    setSelectedStock(s);
                                    setShowTradeModal(true);
                                }}
                                isSelected={selectedStock?.symbol === stock.symbol}
                                ownedShares={portfolio.positions[stock.symbol]?.shares}
                            />
                        ))}
                    </div>
                </section>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    {/* Positions */}
                    <div className={styles.positionsCard}>
                        <h3>POSITIONS</h3>
                        {Object.values(portfolio.positions).length === 0 ? (
                            <p className={styles.noPositions}>ポジションがありません</p>
                        ) : (
                            <ul className={styles.positionList}>
                                {Object.values(portfolio.positions).map(pos => (
                                    <li
                                        key={pos.symbol}
                                        className={styles.positionItem}
                                        onClick={() => handlePositionClick(pos.symbol)}
                                    >
                                        <div className={styles.positionHeader}>
                                            <span className={styles.positionSymbol}>{pos.symbol.replace('.T', '')}</span>
                                            <span className={styles.positionShares}>{pos.shares}株</span>
                                        </div>
                                        <div className={styles.positionValue}>
                                            {formatCurrency(pos.marketValue)}
                                            <span className={pos.profit >= 0 ? styles.up : styles.down}>
                                                ({pos.profit >= 0 ? '+' : ''}{pos.profitPercent.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Leaderboard */}
                    <div className={styles.leaderboardCard}>
                        <h3>RANKING</h3>
                        {leaderboard.length === 0 ? (
                            <p className={styles.noData}>ランキングがありません</p>
                        ) : (
                            <ol className={styles.leaderboardList}>
                                {leaderboard.map((entry, index) => (
                                    <li
                                        key={entry.odId}
                                        className={`${styles.leaderboardItem} ${entry.odId === user?.uid ? styles.isMe : ''}`}
                                    >
                                        <span className={styles.rank}>{index + 1}</span>
                                        <span className={styles.playerName}>{entry.odName}</span>
                                        <span className={styles.playerValue}>{formatCurrency(entry.totalValue)}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </aside>
            </div>

            {/* Trade Modal */}
            {showTradeModal && selectedStock && (
                <TradeModal
                    stock={selectedStock}
                    position={portfolio.positions[selectedStock.symbol]}
                    cash={portfolio.cash}
                    onBuy={handleBuy}
                    onSell={handleSell}
                    onClose={() => setShowTradeModal(false)}
                />
            )}
        </main>
    );
}
