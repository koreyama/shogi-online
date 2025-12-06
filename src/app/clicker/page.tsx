'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { useClickerEngine } from '@/lib/clicker/engine';
import { IconFood, IconWood, IconStone, IconKnowledge, IconGold, IconPopulation, IconSettings, IconHammer, IconBook, IconLock, IconCheck, IconApple, IconPickaxe, IconUsers, IconIron, IconCoal, IconOil, IconSilicon } from '@/components/Icons';
import { TechTreeModal } from './TechTreeModal';
import { AchievementsModal } from './AchievementsModal';
import { TradeRouteModal } from './TradeRouteModal'; // Added
import { AchievementToast } from './AchievementToast';
import { ACHIEVEMENTS } from '@/lib/clicker/achievements';
import { JobManager } from './JobManager';
import { ExpeditionManager } from './ExpeditionManager';
import { formatNumber } from '@/lib/clicker/utils';
import { TitleScreen } from './TitleScreen';
import { useAuth } from '@/hooks/useAuth';
import { Resources, TradeRoute, ResourceType } from '@/lib/clicker/types';
import { AVAILABLE_TRADE_ROUTES } from '@/lib/clicker/data';

export default function ClickerPage() {
    const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
    const {
        gameState,
        setGameState,
        clickResource,
        buyBuilding,
        researchTech,
        assignJob,
        calculateCost,
        resetGame,
        getNextObjective,
        sendExpedition,
        saveToCloud,
        loadFromCloud,
        saveGame,
        addTradeRoute,
        removeTradeRoute
    } = useClickerEngine();

    const [showTechTree, setShowTechTree] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showTradeRoutes, setShowTradeRoutes] = useState(false); // Added
    const [clickAnims, setClickAnims] = useState<{ id: number, x: number, y: number, gained: Partial<Resources> }[]>([]);
    const [activeTab, setActiveTab] = useState<'main' | 'jobs' | 'expedition' | 'settings'>('main');
    const [showTitle, setShowTitle] = useState(true);
    const [isLoadingSave, setIsLoadingSave] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const lastUnlockedCountRef = useRef(0);

    // Check for local save on mount to enable "Continue" button
    const [hasLocalSave, setHasLocalSave] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem('civ_builder_save_v5_10');
        if (saved) setHasLocalSave(true);
    }, []);

    // Cloud Sync Effect
    useEffect(() => {
        if (user && !showTitle) {
            // Auto-save to cloud every 30 seconds if playing
            const interval = setInterval(() => {
                saveToCloud(user, gameState);
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [user, showTitle, gameState, saveToCloud]);

    // Achievement Notification Effect
    useEffect(() => {
        const currentCount = gameState.unlockedAchievements.length;
        if (currentCount > lastUnlockedCountRef.current) {
            // Find the newly unlocked achievement
            // Note: This logic assumes only one is unlocked at a time or just shows the last one.
            // For a robust system, we might want a queue, but this suffices for now.
            const newId = gameState.unlockedAchievements[currentCount - 1];
            const ach = ACHIEVEMENTS.find(a => a.id === newId);
            if (ach) {
                setToastMessage(ach.title);
            }
        }
        lastUnlockedCountRef.current = currentCount;
    }, [gameState.unlockedAchievements]);

    const handleToastClose = React.useCallback(() => {
        setToastMessage(null);
    }, []);

    const handleNewGame = () => {
        setShowTitle(false);
        resetGame();
    };

    const handleContinue = async () => {
        setIsLoadingSave(true);
        // If logged in, try to load from cloud first (or merge? for now just prefer cloud if exists, else local)
        // Actually, engine loads local save on mount.
        // If user is logged in, we might want to fetch cloud save and replace local if newer.
        if (user) {
            const cloudSave = await loadFromCloud(user);
            if (cloudSave) {
                // Compare timestamps? For now, let's just use cloud save if it exists and user clicked continue
                // But wait, engine already loaded local save.
                // Let's just use the loaded state.
                // If we want to enforce cloud save, we should have loaded it.
                // Let's explicitly load cloud save here if available.
                setGameState(prev => ({
                    ...prev,
                    ...cloudSave,
                    // Ensure we don't break references if structure changed (safety)
                    buildings: { ...prev.buildings, ...cloudSave.buildings },
                    techs: { ...prev.techs, ...cloudSave.techs },
                    resources: { ...prev.resources, ...cloudSave.resources },
                    jobs: { ...cloudSave.jobs },
                    logs: cloudSave.logs || []
                }));
            }
        }
        setIsLoadingSave(false);
        setShowTitle(false);
    };

    if (showTitle) {
        return (
            <TitleScreen
                onNewGame={handleNewGame}
                onContinue={handleContinue}
                hasSave={hasLocalSave || !!user} // Assume user might have cloud save
                user={user}
                onLogin={signInWithGoogle}
                onLogout={signOut}
                isLoading={authLoading || isLoadingSave}
            />
        );
    }

    const handleMainClick = (e: React.MouseEvent) => {
        const gained = clickResource();

        // Create floating text
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newAnim = { id: Date.now(), x, y, gained };
        setClickAnims(prev => [...prev, newAnim]);
        setTimeout(() => {
            setClickAnims(prev => prev.filter(a => a.id !== newAnim.id));
        }, 1000);
    };

    const toggleTradeRoute = (routeId: string) => {
        setGameState(prev => {
            const currentRoute = prev.tradeRoutes[routeId];
            if (!currentRoute) return prev;

            return {
                ...prev,
                tradeRoutes: {
                    ...prev.tradeRoutes,
                    [routeId]: {
                        ...currentRoute,
                        active: !currentRoute.active
                    }
                }
            };
        });
    };

    const objective = getNextObjective();

    return (
        <div className={styles.gameContainer}>
            {/* Left Panel: Status */}
            <div className={styles.statusPanel}>
                <div className={styles.panelHeader}>
                    <h2>資源 (Resources)</h2>
                    <div className={styles.eraBadge}>{gameState.era}</div>
                </div>

                <div className={styles.resourceGrid}>
                    <ResourceItem icon={<IconApple />} name="食料" amount={gameState.resources.food} rate={gameState.rates?.food} />
                    <ResourceItem icon={<IconWood />} name="木材" amount={gameState.resources.wood} rate={gameState.rates?.wood} />
                    <ResourceItem icon={<IconPickaxe />} name="石材" amount={gameState.resources.stone} rate={gameState.rates?.stone} />
                    <ResourceItem icon={<IconBook />} name="知識" amount={gameState.resources.knowledge} rate={gameState.rates?.knowledge} />
                    <ResourceItem icon={<IconGold />} name="金" amount={gameState.resources.gold} rate={gameState.rates?.gold} />
                    <ResourceItem icon={<IconIron />} name="鉄" amount={gameState.resources.iron} rate={gameState.rates?.iron} />
                    <ResourceItem icon={<IconCoal />} name="石炭" amount={gameState.resources.coal} rate={gameState.rates?.coal} />
                    <ResourceItem icon={<IconOil />} name="石油" amount={gameState.resources.oil} rate={gameState.rates?.oil} />
                    <ResourceItem icon={<IconSilicon />} name="シリコン" amount={gameState.resources.silicon} rate={gameState.rates?.silicon} />
                    <ResourceItem icon={<IconUsers />} name="人口" amount={gameState.resources.population} />
                </div>

                <div className={styles.panelHeader} style={{ marginTop: '2rem' }}>
                    <h2>幸福度 (Happiness)</h2>
                </div>
                <div className={styles.happinessBar}>
                    <div className={styles.happinessFill} style={{ width: `${gameState.happiness}%` }} />
                    <span className={styles.happinessText}>{Math.round(gameState.happiness)}%</span>
                </div>
            </div>

            {/* Center Panel: Tabs & Content */}
            <div className={styles.mainPanel}>
                {/* Tab Navigation */}
                <div className={styles.tabContainer}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'main' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('main')}
                    >
                        メイン
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'jobs' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        職業
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'expedition' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('expedition')}
                    >
                        探索
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'settings' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        設定
                    </button>
                </div>

                {/* Main Tab */}
                {activeTab === 'main' && (
                    <>
                        {objective && (
                            <div className={styles.objectiveBanner}>
                                <span className={styles.objectiveLabel}>NEXT GOAL</span>
                                <span className={styles.objectiveText}>{objective.text}</span>
                            </div>
                        )}

                        <div className={styles.clickContainer}>
                            <button className={styles.clickTarget} onClick={handleMainClick}>
                                <div className={styles.clickIcon}>🌍</div>
                                <span className={styles.clickLabel}>開拓する</span>
                                {clickAnims.map(anim => (
                                    <div key={anim.id} className={styles.floatingText} style={{ left: anim.x, top: anim.y, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        {Object.entries(anim.gained).map(([key, val]) => (
                                            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                {key === 'food' ? <IconApple size={20} /> :
                                                    key === 'wood' ? <IconWood size={20} /> :
                                                        key === 'stone' ? <IconPickaxe size={20} /> :
                                                            key === 'knowledge' ? <IconBook size={20} /> :
                                                                key === 'gold' ? <IconGold size={20} /> : null}
                                                +{formatNumber(val as number)}
                                            </span>
                                        ))}
                                    </div>
                                ))}
                            </button>
                        </div>

                        <div className={styles.controls}>
                            <button className={styles.techTreeButton} onClick={() => setShowTechTree(true)}>
                                <IconBook /> 技術ツリーを開く
                            </button>
                            <button className={styles.techTreeButton} style={{ background: '#48bb78', marginLeft: '0.5rem' }} onClick={() => setShowAchievements(true)}>
                                <IconCheck /> 実績
                            </button>
                            {gameState.techs.currency?.researched && (
                                <button className={styles.techTreeButton} style={{ background: '#d69e2e', marginLeft: '0.5rem' }} onClick={() => setShowTradeRoutes(true)}>
                                    🚢 交易
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* Jobs Tab */}
                {activeTab === 'jobs' && (
                    <div className="w-full max-w-md">
                        <JobManager gameState={gameState} onAssign={assignJob} />
                    </div>
                )}

                {/* Expedition Tab */}
                {activeTab === 'expedition' && (
                    <ExpeditionManager gameState={gameState} onSendExpedition={sendExpedition} />
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className={styles.settingsPanel}>
                        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>設定</h3>

                        <button className={styles.settingsButton} onClick={() => {
                            saveGame();
                            if (user) saveToCloud(user, gameState);
                            setShowTitle(true);
                        }}>
                            <IconSettings /> ゲームを終了してタイトルへ
                        </button>

                        <button className={styles.settingsButton} style={{ marginTop: '1rem', backgroundColor: '#e53e3e', color: 'white', fontWeight: 'bold' }} onClick={() => {
                            if (window.confirm("本当にリセットしますか？\n全ての進行状況が失われます。")) {
                                handleNewGame();
                            }
                        }}>
                            <IconSettings /> ゲームをリセット (最初から)
                        </button>
                        <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            ※リセットすると全ての進行状況が失われます。
                        </p>
                    </div>
                )}
            </div>

            {/* Right Panel: Management (Buildings) */}
            <div className={styles.managePanel}>
                <div className={styles.panelHeader}>
                    <h2>建設 (Buildings)</h2>
                </div>
                <div className={styles.buildingList}>
                    {Object.values(gameState.buildings)
                        .filter(b => b.unlocked)
                        .map(building => {
                            const cost = calculateCost(building);
                            const canAfford = Object.entries(cost).every(([r, a]) => gameState.resources[r as keyof Resources] >= (a as number));
                            return (
                                <div key={building.id} className={styles.buildingCard}>
                                    <div className={styles.bCardHeader}>
                                        <span className={styles.bName}>{building.name}</span>
                                        <span className={styles.bCount}>Lv.{building.count}</span>
                                    </div>
                                    <div className={styles.bDesc}>{building.description}</div>
                                    <div className={styles.bCost}>
                                        {Object.entries(cost).map(([r, a]) => (
                                            <span key={r} className={gameState.resources[r as keyof Resources] >= (a as number) ? styles.costOk : styles.costNo}>
                                                {r}: {formatNumber(a as number)}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        className={styles.buyButton}
                                        disabled={!canAfford}
                                        onClick={() => buyBuilding(building.id)}
                                    >
                                        建設
                                    </button>
                                </div>
                            );
                        })}
                </div>
            </div>

            {showTechTree && (
                <TechTreeModal
                    gameState={gameState}
                    onClose={() => setShowTechTree(false)}
                    onResearch={researchTech}
                    onBuyBuilding={buyBuilding}
                    calculateCost={calculateCost}
                />
            )}

            {showTradeRoutes && (
                <TradeRouteModal
                    gameState={gameState}
                    onClose={() => setShowTradeRoutes(false)}
                    onToggleRoute={toggleTradeRoute}
                    onAddRoute={addTradeRoute}
                    onRemoveRoute={removeTradeRoute}
                />
            )}

            {/* Achievements Modal */}
            <AchievementsModal
                isOpen={showAchievements}
                onClose={() => setShowAchievements(false)}
                unlockedAchievements={gameState.unlockedAchievements}
            />

            {/* Achievement Toast */}
            {toastMessage && (
                <AchievementToast
                    message={toastMessage}
                    onClose={handleToastClose}
                />
            )}
        </div>
    );
}

const ResourceItem = ({ icon, name, amount, rate, sub = '' }: any) => (
    <div className={styles.resourceItem}>
        <span className={styles.resIcon}>{icon}</span>
        <div className={styles.resInfo}>
            <span className={styles.resName}>{name}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className={styles.resAmount}>{formatNumber(amount)}{sub}</span>
                {rate !== undefined && rate !== 0 && (
                    <span style={{ fontSize: '0.75rem', color: rate > 0 ? '#48bb78' : '#f56565' }}>
                        {rate > 0 ? '+' : ''}{formatNumber(rate)}/s
                    </span>
                )}
            </div>
        </div>
    </div>
);
