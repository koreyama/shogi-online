import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Region } from './types';
import { INITIAL_REGIONS, TRAITS } from './data';

const TICK_RATE = 200; // 5 times per second

export const usePlagueEngine = () => {
    const [gameState, setGameState] = useState<GameState>(() => {
        const regions: Record<string, Region> = {};
        INITIAL_REGIONS.forEach(r => regions[r.id] = { ...r, borderClosed: false });

        return {
            dnaPoints: 0,
            cureProgress: 0,
            startDate: Date.now(),
            currentDate: Date.now(),
            regions,
            traits: {},
            labs: [],
            globalInfectivity: 0.005, // EXTREME SLOW DOWN (Was 0.05)
            globalLethality: 0,
            globalSeverity: 0,
            isPaused: true,
            gameStatus: 'title',
            bubbles: [],
            news: [],
            history: []
        };
    });

    const lastTickRef = useRef<number>(Date.now());

    // Game Loop
    useEffect(() => {
        if (gameState.isPaused || (gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'choosing_start')) return;

        const tick = () => {
            const now = Date.now();
            const delta = (now - lastTickRef.current) / 1000;
            const safeDelta = Math.min(delta, 1.0);
            lastTickRef.current = now;

            if (gameState.gameStatus === 'choosing_start') return;

            setGameState(prev => {
                const newRegions = { ...prev.regions };
                const newLabs = [...prev.labs];
                const newNews = [...prev.news];
                let totalInfected = 0;
                let totalDead = 0;
                let totalPop = 0;
                let dnaGain = 0;

                // Precompute Active Trait Bonuses
                let airTrans = 0;
                let waterTrans = 0;
                let landTrans = 0;
                let cureSlowing = 0;

                Object.keys(prev.traits).forEach(tId => {
                    const t = TRAITS.find(tr => tr.id === tId);
                    if (t) {
                        airTrans = Math.max(airTrans, t.effects.airTransmission || 0);
                        waterTrans = Math.max(waterTrans, t.effects.waterTransmission || 0);
                        landTrans = Math.max(landTrans, t.effects.landTransmission || 0);
                        cureSlowing += (t.effects.cureSlow || 0);
                    }
                });

                // 1. Logistic Growth within Regions
                Object.values(newRegions).forEach(region => {
                    const susceptible = region.population - region.infected - region.dead;

                    if (region.infected > 0 && susceptible > 0) {
                        // Spread Rate Calculation
                        let transmissionProbability = prev.globalInfectivity * 2.5;

                        if (region.density === 'urban') transmissionProbability *= 1.5;
                        if (region.density === 'rural') transmissionProbability *= 0.8;

                        const newInfections = Math.ceil(region.infected * transmissionProbability * (susceptible / region.population) * safeDelta);

                        const actualNew = Math.min(newInfections, susceptible);
                        region.infected += actualNew;

                        // DNA LOGIC (Dynamic)
                        // Early game (< 1M infected globally): High drop rate (50%)
                        // Late game: Low drop rate
                        let dropChance = 0.02; // Base 2%
                        if (totalInfected < 1000000) dropChance = 0.5; // 50% boost early

                        if (actualNew > 0 && Math.random() < dropChance) dnaGain += 0.5; // 0.5 DNA per tick roughly? No, keep it int.
                        if (actualNew > 0 && Math.random() < dropChance) dnaGain += 1;
                    }

                    // Lethality
                    if (prev.globalLethality > 0 && region.infected > 0) {
                        const deathRate = prev.globalLethality * 0.2;
                        const newDeaths = Math.ceil(region.infected * deathRate * safeDelta);
                        const actualDeaths = Math.min(newDeaths, region.infected);

                        region.dead += actualDeaths;
                        region.infected -= actualDeaths;

                        if (actualDeaths > 0 && Math.random() < 0.05) dnaGain += 1;
                    }

                    // Border Closing
                    if (!region.borderClosed) {
                        const panicFactor = (region.dead / region.population) * 200 + (prev.globalSeverity * 0.5);
                        if (panicFactor > 25) {
                            region.borderClosed = true;
                            newNews.push({
                                id: `border_${region.id}_${now}`,
                                text: `${region.name} が国境を封鎖しました！`,
                                date: prev.currentDate,
                                type: 'warning'
                            });
                        }
                    }

                    totalInfected += region.infected;
                    totalDead += region.dead;
                    totalPop += region.population;
                });

                // 2. Transmission
                Object.values(newRegions).forEach(source => {
                    if (source.infected > 1000) {
                        source.neighbors.forEach(neighborId => {
                            const target = newRegions[neighborId];
                            if (target && target.infected < 10 && target.population > 0) {
                                let chance = 0.005 * safeDelta;
                                if (landTrans > 0) chance *= 5;
                                if (source.borderClosed || target.borderClosed) chance *= 0.0001;

                                if (Math.random() < chance) {
                                    target.infected += 1;
                                    newNews.push({ id: `spread_land_${target.id}_${now}`, text: `${source.name} から ${target.name} へ陸路感染！`, date: prev.currentDate, type: 'warning' });
                                }
                            }
                        });

                        Object.values(newRegions).forEach(target => {
                            if (source.id !== target.id && target.infected === 0 && target.population > 0) {
                                if (airTrans > 0) {
                                    let airChance = 0.0005 * safeDelta * airTrans;
                                    if (source.borderClosed || target.borderClosed) airChance *= 0.01;
                                    if (Math.random() < airChance) {
                                        target.infected += 1;
                                        dnaGain += 3;
                                        newNews.push({ id: `spread_air_${target.id}_${now}`, text: `飛行機により ${target.name} で感染確認！`, date: prev.currentDate, type: 'critical' });
                                    }
                                }
                                if (waterTrans > 0) {
                                    let seaChance = 0.0005 * safeDelta * waterTrans;
                                    if (source.borderClosed || target.borderClosed) seaChance *= 0.01;
                                    if (Math.random() < seaChance) {
                                        target.infected += 1;
                                        dnaGain += 3;
                                        newNews.push({ id: `spread_sea_${target.id}_${now}`, text: `船舶により ${target.name} で感染確認！`, date: prev.currentDate, type: 'critical' });
                                    }
                                }
                            }
                        });
                    }
                });

                // 3. Victory/Defeat
                let status = prev.gameStatus;
                const detectionThreshold = Math.max(100, 100000 - (prev.globalSeverity * 5000));

                let cureGain = 0;
                if (totalInfected > detectionThreshold || totalDead > 100) {
                    cureGain = 0.01 * safeDelta;
                    if (prev.globalSeverity > 0) {
                        cureGain += (Math.pow(prev.globalSeverity, 1.5) * 0.0005 * safeDelta);
                    }
                    if (totalDead > 10000) cureGain += 0.05 * safeDelta;
                    if (totalDead > 1000000) cureGain += 0.1 * safeDelta;
                    cureGain += (newLabs.length * 0.08 * safeDelta);
                }

                if (cureSlowing > 0) {
                    cureGain *= (1.0 - cureSlowing);
                }

                let newCureProgress = prev.cureProgress + cureGain;
                if (newCureProgress >= 100) {
                    newCureProgress = 100;
                    status = 'lost';
                }

                if (totalInfected === 0 && totalPop > 0 && prev.gameStatus === 'playing') {
                    status = 'lost';
                }
                if (totalPop < 100 && totalInfected === 0) status = 'won';

                // --- Bubbles ---
                const newBubbles = [...prev.bubbles];

                // Red Bubbles (Infection Based)
                if (Math.random() < 0.03) {
                    const infectedRegions = Object.values(newRegions).filter(r => r.infected > 1000);
                    if (infectedRegions.length > 0) {
                        const target = infectedRegions[Math.floor(Math.random() * infectedRegions.length)];
                        newBubbles.push({
                            id: `dna_${Date.now()}_${Math.random()}`,
                            type: 'dna',
                            regionId: target.id,
                            value: Math.floor(Math.random() * 3) + 1,
                            createdAt: Date.now()
                        });
                    }
                }

                // ECONOMY FIX: Orange Bubbles (Time Based)
                // Spawns randomly in the world regardless of infection.
                // Gives a steady income (1-3 DNA).
                if (Math.random() < 0.01) { // 1% per tick (every 20s approx)
                    const allRegions = Object.values(newRegions);
                    const target = allRegions[Math.floor(Math.random() * allRegions.length)];
                    newBubbles.push({
                        id: `orange_${Date.now()}_${Math.random()}`,
                        type: 'orange', // New Type
                        regionId: target.id,
                        value: Math.floor(Math.random() * 3) + 2, // 2-4 DNA
                        createdAt: Date.now()
                    });
                }

                // Labs
                if (newCureProgress > 15 && newLabs.length < 5 && Math.random() < 0.003) {
                    const safeRegions = Object.values(newRegions).filter(r => r.dead < 100000);
                    if (safeRegions.length > 0) {
                        const target = safeRegions[Math.floor(Math.random() * safeRegions.length)];
                        if (!newLabs.includes(target.id)) {
                            newLabs.push(target.id);
                            newNews.push({ id: `lab_${target.id}_${now}`, text: `${target.name} にCURE研究所が設立されました。`, date: prev.currentDate, type: 'info' });
                            newBubbles.push({
                                id: `lab_bubble_${target.id}_${now}`,
                                type: 'cure',
                                regionId: target.id,
                                value: 0,
                                createdAt: Date.now()
                            });
                        }
                    }
                }

                // --- History Tracking (Every ~1 second of game time, simplified to random for now or counter) ---
                // We want to record history periodically.
                // Let's rely on the fact this tick runs 5 times a sec.
                // We don't want 5 entries a second.
                // engine.ts inner scope var? No, React state update...
                // Ideally we use a Ref for timing, but we are inside setGameState.
                // Let's just append if Math.random is low or checking date difference?
                // Checking date diff is better but we only have prev state.

                let newHistory = prev.history;
                // Only record every 5 days or so?
                const daysDiff = (prev.currentDate - prev.startDate) / (1000 * 3600 * 24);
                const lastHistoryDate = prev.history.length > 0 ? prev.history[prev.history.length - 1].date : prev.startDate;
                const daysSinceLast = (prev.currentDate - lastHistoryDate) / (1000 * 3600 * 24);

                if (daysSinceLast > 5 || prev.history.length === 0) {
                    newHistory = [...prev.history, {
                        date: prev.currentDate,
                        infected: totalInfected,
                        dead: totalDead,
                        cure: newCureProgress
                    }];
                }

                return {
                    ...prev,
                    currentDate: prev.currentDate + (safeDelta * 1000 * 3600 * 24),
                    regions: newRegions,
                    labs: newLabs,
                    dnaPoints: prev.dnaPoints + dnaGain,
                    bubbles: newBubbles,
                    news: newNews,
                    gameStatus: status,
                    history: newHistory
                };
            });
        };

        const interval = setInterval(tick, TICK_RATE);
        return () => clearInterval(interval);
    }, [gameState.isPaused, gameState.gameStatus]);

    const popBubble = (bubbleId: string) => {
        setGameState(prev => {
            const bubble = prev.bubbles.find(b => b.id === bubbleId);
            if (!bubble) return prev;
            let newLabs = prev.labs;
            let dnaBonus = bubble.value;

            if (bubble.type === 'cure') {
                newLabs = prev.labs.filter(labId => labId !== bubble.regionId);
                dnaBonus = 5;
            }

            return {
                ...prev,
                dnaPoints: prev.dnaPoints + dnaBonus,
                labs: newLabs,
                bubbles: prev.bubbles.filter(b => b.id !== bubbleId)
            };
        });
    };

    const evolveTrait = (traitId: string) => {
        setGameState(prev => {
            if (prev.traits[traitId]) return prev;
            const trait = TRAITS.find(t => t.id === traitId);
            if (!trait) return prev;

            const ownedCount = Object.keys(prev.traits).length;
            const inflatedCost = trait.cost + (ownedCount * 2);

            if (prev.dnaPoints < inflatedCost) return prev;
            // Check reqs in engine too just in case
            if (trait.reqTraits && !trait.reqTraits.every(req => prev.traits[req])) return prev;

            const newTraits = { ...prev.traits, [traitId]: true };

            let inf = 0.005; // New Base
            let leth = 0;
            let sev = 0;

            Object.keys(newTraits).forEach(tId => {
                const t = TRAITS.find(tr => tr.id === tId);
                if (t) {
                    inf += t.effects.infectivity || 0;
                    leth += t.effects.lethality || 0;
                    sev += t.effects.severity || 0;
                }
            });

            return {
                ...prev,
                dnaPoints: prev.dnaPoints - inflatedCost, // Pay inflated cost
                traits: newTraits,
                globalInfectivity: inf,
                globalLethality: leth,
                globalSeverity: sev
            };
        });
    };

    const resetGame = () => {
        setGameState(() => {
            const regions: Record<string, Region> = {};
            INITIAL_REGIONS.forEach(r => regions[r.id] = { ...r, borderClosed: false });
            return {
                dnaPoints: 0,
                cureProgress: 0,
                startDate: Date.now(),
                currentDate: Date.now(),
                regions,
                traits: {},
                labs: [],
                globalInfectivity: 0.005,
                globalLethality: 0,
                globalSeverity: 0,
                isPaused: true,
                gameStatus: 'title',
                bubbles: [],
                news: [],
                history: []
            };
        });
        lastTickRef.current = Date.now();
    };

    const startGame = () => {
        setGameState(prev => ({
            ...prev,
            gameStatus: 'choosing_start',
            isPaused: false,
            news: [{ id: 'select', text: '感染を開始する国を選択してください...', date: Date.now(), type: 'info' }]
        }));
    };

    const selectStartRegion = (regionId: string) => {
        setGameState(prev => {
            const newRegions = { ...prev.regions };
            if (newRegions[regionId]) {
                newRegions[regionId].infected = 1;
            }
            return {
                ...prev,
                regions: newRegions,
                gameStatus: 'playing',
                news: [...prev.news, { id: 'zero', text: `${newRegions[regionId].name} で最初の感染者が確認されました。`, date: Date.now(), type: 'critical' }],
                dnaPoints: 10
            };
        });
    };

    return { gameState, setGameState, evolveTrait, popBubble, resetGame, startGame, selectStartRegion };
};
