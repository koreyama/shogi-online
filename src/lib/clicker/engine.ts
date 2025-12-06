import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Resources, Building, Tech, ResourceType, INITIAL_RESOURCES, Era, ExpeditionType, TradeRoute, Policy } from './types';
import { INITIAL_BUILDINGS, INITIAL_TECHS, INITIAL_JOBS, CLICK_DROPS, EXPEDITIONS, AVAILABLE_TRADE_ROUTES, RESOURCE_VALUES, INITIAL_POLICIES } from './data';
import { ACHIEVEMENTS } from './achievements';
import { getExpeditionScaling } from './utils';

const SAVE_KEY = 'civ_builder_save_v5_10'; // Bumped version for new save structure
const TICK_RATE = 100; // ms

export const useClickerEngine = () => {
    const [gameState, setGameState] = useState<GameState>({
        resources: INITIAL_RESOURCES,
        rates: {}, // Initialize rates
        buildings: INITIAL_BUILDINGS,
        techs: INITIAL_TECHS,
        jobs: {},
        era: 'primitive',
        happiness: 100,
        maxPopulation: 5,
        lastSaveTime: Date.now(),
        totalPlayTime: 0,
        activeExpeditions: [],
        logs: [],
        unlockedAchievements: [],
        tradeRoutes: {}, // Initialize
        policies: INITIAL_POLICIES // Initialize Policies
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load save on mount (Client-side only)
    useEffect(() => {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deep merge techs: take cost/effects from INITIAL_TECHS, but keep progress from save
                const mergedTechs: { [key: string]: Tech } = {};
                Object.keys(INITIAL_TECHS).forEach(techId => {
                    const initial = INITIAL_TECHS[techId];
                    const saved = parsed.techs?.[techId];
                    mergedTechs[techId] = {
                        ...initial,
                        unlocked: saved?.unlocked ?? initial.unlocked,
                        researched: saved?.researched ?? initial.researched,
                    };
                });

                // Deep merge buildings: take baseCost from INITIAL_BUILDINGS, but keep count/unlocked from save
                const mergedBuildings: { [key: string]: Building } = {};
                Object.keys(INITIAL_BUILDINGS).forEach(buildingId => {
                    const initial = INITIAL_BUILDINGS[buildingId];
                    const saved = parsed.buildings?.[buildingId];
                    mergedBuildings[buildingId] = {
                        ...initial,
                        count: saved?.count ?? initial.count,
                        unlocked: saved?.unlocked ?? initial.unlocked,
                    };
                });

                // Deep merge policies
                const mergedPolicies = { ...INITIAL_POLICIES };
                if (parsed.policies) {
                    Object.keys(parsed.policies).forEach(pId => {
                        if (mergedPolicies[pId]) {
                            mergedPolicies[pId].unlocked = parsed.policies[pId].unlocked;
                            mergedPolicies[pId].active = parsed.policies[pId].active;
                        }
                    });
                }

                // Recalculate Era based on techs (Migration fix)
                const determineEra = (techs: { [key: string]: Tech }): Era => {
                    if (techs['ai']?.researched) return 'modern';
                    if (techs['computers']?.researched) return 'information';
                    if (techs['nuclear_fission']?.researched) return 'atomic';
                    if (techs['steam_power']?.researched) return 'industrial';
                    if (techs['printing_press']?.researched) return 'renaissance';
                    if (techs['feudalism']?.researched) return 'medieval';
                    if (techs['currency']?.researched) return 'classical';
                    if (techs['agriculture']?.researched) return 'ancient';
                    return 'primitive';
                };

                const correctEra = determineEra(mergedTechs);

                setGameState(prev => ({
                    ...prev,
                    ...parsed,
                    buildings: mergedBuildings,
                    techs: mergedTechs,
                    resources: { ...INITIAL_RESOURCES, ...parsed.resources },
                    jobs: { ...parsed.jobs },
                    logs: parsed.logs || [],
                    unlockedAchievements: parsed.unlockedAchievements || [],
                    tradeRoutes: parsed.tradeRoutes || {},
                    policies: mergedPolicies, // Merged policies
                    era: correctEra // Use recalculated era
                }));
            } catch (e) {
                console.error("Failed to load save", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const lastTickRef = useRef<number>(Date.now());
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const calculateProduction = (jobs: { [key: string]: number }, techs: { [key: string]: Tech }, buildings: { [key: string]: Building }, happiness: number): Partial<Resources> => {
        const happinessMult = 0.5 + (happiness / 100); // 0.5x to 1.5x

        // Calculate Tech Multipliers
        const multipliers: { [key: string]: number } = {};
        Object.values(techs).forEach(tech => {
            if (tech.researched && tech.effects?.resourceMultiplier) {
                Object.entries(tech.effects.resourceMultiplier).forEach(([res, mult]) => {
                    multipliers[res] = (multipliers[res] || 1) * mult;
                });
            }
        });

        // Calculate Policy Multipliers
        Object.values(gameState.policies || {}).forEach(policy => {
            if (policy.active && policy.effects?.resourceMultiplier) {
                Object.entries(policy.effects.resourceMultiplier).forEach(([res, mult]) => {
                    multipliers[res] = (multipliers[res] || 1) * mult;
                });
            }
        });

        const totalProd: Partial<Resources> = {
            food: 1 * (multipliers['food'] || 1) * happinessMult,
            knowledge: 0.1 * (multipliers['knowledge'] || 1) * happinessMult
        };

        const hasPaper = techs['paper']?.researched;

        Object.entries(jobs).forEach(([jobId, count]) => {
            const job = INITIAL_JOBS[jobId];
            if (job && count > 0) {
                Object.entries(job.production).forEach(([res, amount]) => {
                    const rKey = res as ResourceType;
                    let finalAmount = amount as number;

                    // Tech Bonuses (Specific)
                    if (jobId === 'scholar' && hasPaper && rKey === 'knowledge') {
                        finalAmount += 1; // Paper boosts Scholar
                    }

                    // Apply Global Multipliers
                    if (multipliers[rKey]) {
                        finalAmount *= multipliers[rKey];
                    }

                    // Apply Happiness Multiplier
                    finalAmount *= happinessMult;

                    totalProd[rKey] = (totalProd[rKey] || 0) + (finalAmount * count);
                });
            }
        });
        return totalProd;
    };

    const calculateConsumption = (jobs: { [key: string]: number }, population: number): Partial<Resources> => {
        const totalCons: Partial<Resources> = { food: Math.floor(population) * 1.0 }; // Base food consumption

        Object.entries(jobs).forEach(([jobId, count]) => {
            const job = INITIAL_JOBS[jobId];
            if (job && count > 0 && job.consumption) {
                Object.entries(job.consumption).forEach(([res, amount]) => {
                    const rKey = res as ResourceType;
                    totalCons[rKey] = (totalCons[rKey] || 0) + (amount * count);
                });
            }
        });
        return totalCons;
    };

    // Game Loop
    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const delta = (now - lastTickRef.current) / 1000;
            lastTickRef.current = now;

            setGameState(prev => {
                const production = calculateProduction(prev.jobs, prev.techs, prev.buildings, prev.happiness);
                const consumption = calculateConsumption(prev.jobs, prev.resources.population);

                const newResources = { ...prev.resources };
                let newHappiness = prev.happiness;
                let newPopulation = prev.resources.population;

                // Calculate Net Rates for UI
                const currentRates: Partial<Resources> = {};
                Object.keys(INITIAL_RESOURCES).forEach(k => {
                    const key = k as ResourceType;
                    const prod = production[key] || 0;
                    const cons = consumption[key] || 0;
                    currentRates[key] = prod - cons;
                });

                // --- Trade Routes Logic ---
                const tradeDiff: Partial<Resources> = {};
                Object.values(prev.tradeRoutes).forEach(route => {
                    if (route.active) {
                        const flow = (route.amount || 1) * delta; // Use custom amount per second
                        const available = newResources[route.from] || 0;
                        const actualFlow = Math.min(available, flow);

                        if (actualFlow > 0) {
                            newResources[route.from] -= actualFlow;
                            const gain = actualFlow * route.rate;
                            newResources[route.to] = (newResources[route.to] || 0) + gain;

                            tradeDiff[route.from] = (tradeDiff[route.from] || 0) - actualFlow;
                            tradeDiff[route.to] = (tradeDiff[route.to] || 0) + gain;
                        }
                    }
                });

                // Update rates with trade info
                Object.entries(tradeDiff).forEach(([res, rate]) => {
                    const rKey = res as ResourceType;
                    currentRates[rKey] = (currentRates[rKey] || 0) + (rate / delta); // Convert back to per-second rate
                });

                // Apply Production & Consumption
                Object.keys(production).forEach(key => {
                    const rKey = key as ResourceType;
                    newResources[rKey] += (production[rKey] || 0) * delta;
                });

                // Food Consumption Logic
                const foodConsumed = (consumption.food || 0) * delta;
                if (newResources.food >= foodConsumed) {
                    newResources.food -= foodConsumed;
                    if (newHappiness < 100) newHappiness += 1 * delta; // Recover happiness
                } else {
                    newResources.food = 0;
                    newHappiness -= 5 * delta; // Starvation penalty
                    // Negative rate for food if starving
                    currentRates.food = -(consumption.food || 0);
                }

                // Population Growth/Decline based on Happiness & Housing
                const baseMaxPop = 5;
                const housingPop = Object.values(prev.buildings).reduce((acc, b) => acc + (b.housing || 0) * b.count, 0);
                const maxPop = baseMaxPop + housingPop;

                // Instant Growth (User Request)
                if (newPopulation < maxPop && newResources.food > 0) {
                    newPopulation = maxPop;
                }
                // Cap population
                if (newPopulation > maxPop) newPopulation = maxPop;

                // Unlock Logic
                const newBuildings = { ...prev.buildings };
                const newTechs = { ...prev.techs };

                // Auto-unlock techs based on dependencies
                Object.values(newTechs).forEach(t => {
                    if (!t.unlocked) {
                        if (t.reqTech) {
                            const allReqsMet = t.reqTech.every(reqId => prev.techs[reqId]?.researched);
                            if (allReqsMet) t.unlocked = true;
                        } else if (t.reqEra === prev.era) {
                            // Unlock starting techs of the era if no other reqs
                            if (t.id === 'stone_tools' && prev.era === 'primitive') t.unlocked = true;
                        }
                    }
                });

                // Unlock buildings based on techs/era
                Object.values(newBuildings).forEach(b => {
                    if (b.unlocked) return; // Add check if already unlocked (optional optimization)
                    if (!b.unlocked) {
                        if (b.reqTech) {
                            const allReqsMet = b.reqTech.every(reqId => prev.techs[reqId]?.researched);
                            if (allReqsMet) b.unlocked = true;
                        } else if (b.reqEra === prev.era) {
                            if (b.id === 'gatherer_hut') b.unlocked = true;
                        }
                    }
                });

                // Unlock Policies based on Era
                const newPolicies = { ...prev.policies };
                Object.values(newPolicies).forEach(p => {
                    if (!p.unlocked && p.reqEra) {
                        // Simple check: if current era index >= req era index
                        const eraOrder = ['primitive', 'ancient', 'classical', 'medieval', 'renaissance', 'industrial', 'atomic', 'information', 'modern'];
                        const currentIdx = eraOrder.indexOf(prev.era);
                        const reqIdx = eraOrder.indexOf(p.reqEra);

                        if (currentIdx >= reqIdx) {
                            p.unlocked = true;
                        }
                    }
                });

                // Process Active Expeditions
                const activeExpeditions = prev.activeExpeditions || [];
                const completedExpeditions: any[] = [];
                const remainingExpeditions: any[] = [];

                activeExpeditions.forEach(exp => {
                    if (exp.startTime + exp.duration <= now) {
                        completedExpeditions.push(exp);
                    } else {
                        remainingExpeditions.push(exp);
                    }
                });

                // Process Rewards and Logs
                const newLogs = [...prev.logs];

                completedExpeditions.forEach(exp => {
                    const multiplier = exp.multiplier || 1.0;
                    const rand = Math.random();
                    let reward: Partial<Resources> = {};
                    let message = "";
                    let type: 'success' | 'info' | 'error' = 'info';

                    if (exp.type === 'scout') {
                        if (rand < 0.4) {
                            const amount = Math.floor((Math.random() * 30 + 20) * multiplier);
                            reward = { food: amount, wood: amount, stone: amount };
                            message = `探索隊が帰還しました。資源(食料:${amount}, 木材:${amount}, 石材:${amount})を発見しました！(x${multiplier.toFixed(1)})`;
                            type = 'success';
                        } else if (rand < 0.7) {
                            const amount = Math.floor((Math.random() * 20 + 10) * multiplier);
                            reward = { food: amount };
                            message = `探索は難航しましたが、少量の食料(${amount})を持ち帰りました。(x${multiplier.toFixed(1)})`;
                        } else {
                            message = "探索隊は何も発見できませんでした。";
                            type = 'error';
                        }
                    } else if (exp.type === 'research') {
                        if (rand < 0.5) {
                            const amount = Math.floor((Math.random() * 50 + 50) * multiplier);
                            reward = { knowledge: amount };
                            message = `古代の遺跡を発見！知識(${amount})を得ました。(x${multiplier.toFixed(1)})`;
                            type = 'success';
                        } else {
                            message = "遺跡は既に略奪されていました。";
                        }
                    } else if (exp.type === 'trade') {
                        if (rand < 0.6) {
                            const amount = Math.floor((Math.random() * 100 + 50) * multiplier);
                            reward = { gold: amount };
                            message = `交易は成功しました。金(${amount})を得ました。(x${multiplier.toFixed(1)})`;
                            type = 'success';
                        } else {
                            message = "交易隊は盗賊に襲われました。";
                            type = 'error';
                        }
                    }

                    // Add Reward
                    Object.entries(reward).forEach(([res, val]) => {
                        newResources[res as ResourceType] += val as number;
                    });

                    // Add Log
                    newLogs.unshift({
                        id: (Date.now() + Math.random()).toString(),
                        message,
                        timestamp: Date.now(),
                        type
                    });
                });
                // Truncate logs
                if (newLogs.length > 50) newLogs.length = 50;

                return {
                    ...prev,
                    resources: {
                        ...newResources,
                        population: newPopulation
                    },
                    rates: currentRates,
                    happiness: newHappiness,
                    buildings: newBuildings,
                    techs: newTechs,
                    policies: newPolicies,
                    activeExpeditions: remainingExpeditions,
                    logs: newLogs
                };
            });
        };

        const interval = setInterval(tick, TICK_RATE);
        return () => clearInterval(interval);
    }, [isLoaded]); // Depend on loaded to start tick? No, tick runs always but logic inside handles initialization or we assume init state is safe.

    // Achievement Check Loop (Less frequent)
    useEffect(() => {
        if (!isLoaded) return;
        const checkAchievements = () => {
            setGameState(prev => {
                const newUnlocked = [...prev.unlockedAchievements];
                let changed = false;

                ACHIEVEMENTS.forEach(ach => {
                    if (!newUnlocked.includes(ach.id)) {
                        if (ach.condition(prev)) {
                            newUnlocked.push(ach.id);
                            changed = true;
                        }
                    }
                });

                if (changed) {
                    return { ...prev, unlockedAchievements: newUnlocked };
                }
                return prev;
            });
        };
        const interval = setInterval(checkAchievements, 1000); // Check every second
        return () => clearInterval(interval);
    }, [isLoaded]);


    // Auto-Save
    useEffect(() => {
        if (!isLoaded) return;
        saveIntervalRef.current = setInterval(() => {
            localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
            setGameState(prev => ({ ...prev, lastSaveTime: Date.now() }));
        }, 10000); // Auto save every 10s

        return () => {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        };
    }, [gameState, isLoaded]);


    // --- Actions ---

    const clickResource = useCallback(() => {
        const gained: Partial<Resources> = {};

        let clickMult = 1;

        // Click Multipliers (Global)
        // 1. Techs
        // Basic click upgrade?

        // 2. Policies?

        // Dynamic Click Drops based on Tech
        CLICK_DROPS.forEach(drop => {
            if (!drop.reqTech || gameState.techs[drop.reqTech]?.researched) {
                if (Math.random() <= drop.chance) {
                    let amount = drop.amount * clickMult;
                    // Apply resource specific multiplier
                    // Calculate current multipliers (should optimize this to not recalc every click, maybe store in state)
                    // For now, simplified:
                    const techMult = Object.values(gameState.techs)
                        .filter(t => t.researched && t.effects?.resourceMultiplier?.[drop.resource])
                        .reduce((acc, t) => acc * (t.effects!.resourceMultiplier![drop.resource] || 1), 1);

                    const policyMult = Object.values(gameState.policies)
                        .filter(p => p.active && p.effects?.resourceMultiplier?.[drop.resource])
                        .reduce((acc, p) => acc * (p.effects!.resourceMultiplier![drop.resource] || 1), 1);

                    amount *= techMult * policyMult;

                    gained[drop.resource] = (gained[drop.resource] || 0) + amount;
                }
            }
        });

        setGameState(prev => {
            const newResources = { ...prev.resources };
            Object.entries(gained).forEach(([res, amount]) => {
                newResources[res as ResourceType] += amount;
            });
            return { ...prev, resources: newResources };
        });

        return gained;
    }, [gameState.techs, gameState.policies]);

    const calculateCost = useCallback((building: Building): Partial<Resources> => {
        const cost: Partial<Resources> = {};

        // Calculate Global Cost Multiplier
        let multiplier = 1.0;

        // 1. Building Effects (e.g. Pyramids)
        if (gameState.buildings['pyramids']?.count > 0) {
            multiplier *= 0.9; // -10%
        }

        // 2. Tech Effects (e.g. Wheel)
        Object.values(gameState.techs).forEach(tech => {
            if (tech.researched && tech.effects?.buildingCostMultiplier) {
                multiplier *= tech.effects.buildingCostMultiplier;
            }
        });

        // 3. Policy Effects
        Object.values(gameState.policies || {}).forEach(policy => {
            if (policy.active && policy.effects?.buildingCostMultiplier) {
                multiplier *= policy.effects.buildingCostMultiplier;
            }
        });

        Object.entries(building.baseCost).forEach(([res, amount]) => {
            const rKey = res as ResourceType;
            // Apply scaling then multiplier
            const scaledAmount = (amount as number) * Math.pow(building.costScaling, building.count) * multiplier;
            cost[rKey] = Math.floor(scaledAmount);
        });
        return cost;
    }, [gameState]);

    const buyBuilding = useCallback((buildingId: string) => {
        setGameState(prev => {
            const building = prev.buildings[buildingId];
            if (!building) return prev;

            // Security check: Must be unlocked
            if (!building.unlocked) return prev;

            const cost = calculateCost(building);

            // Check affordability
            for (const [res, amount] of Object.entries(cost)) {
                if (prev.resources[res as ResourceType] < amount) return prev;
            }

            // Deduct resources
            const newResources = { ...prev.resources };
            for (const [res, amount] of Object.entries(cost)) {
                newResources[res as ResourceType] -= amount;
            }

            // Increase count
            const newBuildings = { ...prev.buildings };
            newBuildings[buildingId] = {
                ...building,
                count: building.count + 1
            };

            // Update Max Population if housing
            let newMaxPop = prev.maxPopulation;
            if (building.housing) {
                newMaxPop += building.housing;
            }

            return {
                ...prev,
                resources: newResources,
                buildings: newBuildings,
                maxPopulation: newMaxPop
            };
        });
    }, [calculateCost]);

    const researchTech = useCallback((techId: string) => {
        setGameState(prev => {
            const tech = prev.techs[techId];
            if (!tech || tech.researched) return prev;

            // Check cost
            for (const [res, amount] of Object.entries(tech.cost)) {
                if (prev.resources[res as ResourceType] < (amount as number)) return prev;
            }

            // Deduct
            const newResources = { ...prev.resources };
            for (const [res, amount] of Object.entries(tech.cost)) {
                newResources[res as ResourceType] -= (amount as number);
            }

            const newTechs = { ...prev.techs };
            newTechs[techId] = { ...tech, researched: true };

            return {
                ...prev,
                resources: newResources,
                techs: newTechs
            };
        });
    }, []);

    const assignJob = useCallback((jobId: string, delta: number) => {
        setGameState(prev => {
            const job = prev.jobs[jobId] || 0;
            const currentTotalAssigned = Object.values(prev.jobs).reduce((a, b) => a + b, 0);

            if (delta > 0) {
                // Hiring
                if (currentTotalAssigned >= Math.floor(prev.resources.population)) return prev; // No idle pop
                const newJobs = { ...prev.jobs, [jobId]: job + delta };
                return { ...prev, jobs: newJobs };
            } else {
                // Firing
                if (job + delta < 0) return prev;
                const newJobs = { ...prev.jobs, [jobId]: job + delta };
                return { ...prev, jobs: newJobs };
            }
        });
    }, []);

    const sendExpedition = useCallback((type: ExpeditionType) => {
        let result = { success: false, message: '', reward: {} as Partial<Resources> };
        setGameState(prev => {
            const config = EXPEDITIONS[type];
            if (!config) return prev;

            // Get scaling multiplier
            const multiplier = getExpeditionScaling(prev.era);

            // Check cost (scaled)
            const scaledCost: Partial<Resources> = {};
            let canAfford = true;
            for (const [res, amount] of Object.entries(config.cost)) {
                const scaledAmount = Math.floor((amount as number) * multiplier);
                scaledCost[res as ResourceType] = scaledAmount;
                if (prev.resources[res as ResourceType] < scaledAmount) {
                    canAfford = false;
                }
            }

            if (!canAfford) {
                result.message = `資源が足りません`;
                return prev;
            }

            const newResources = { ...prev.resources };
            for (const [res, amount] of Object.entries(scaledCost)) {
                newResources[res as ResourceType] -= (amount as number);
            }

            const newExpedition: any = {
                id: Date.now().toString() + Math.random().toString(),
                type,
                startTime: Date.now(),
                duration: config.duration * 1000,
                cost: scaledCost,
                multiplier: multiplier // Store the multiplier used!
            };

            result.success = true;
            result.message = `${config.title}に出発しました (コスト倍率: x${multiplier.toFixed(1)})`;

            return {
                ...prev,
                resources: newResources,
                activeExpeditions: [...(prev.activeExpeditions || []), newExpedition]
            };
        });
        return result;
    }, []);

    const resetGame = useCallback(() => {
        // Clear save
        localStorage.removeItem(SAVE_KEY);
        // Reload page to reset state cleanly (simplest way)
        window.location.reload();
    }, []);

    const getNextObjective = useCallback(() => {
        if (!gameState.techs['agriculture']?.researched) return { text: "農業を研究する (食料: 10, 知識: 10)" };
        if (gameState.resources.population < 10) return { text: "人口を10人にする (家を建てる)" };
        if (gameState.era === 'primitive') return { text: "石器時代へ進む (石の道具を研究)" };
        return null;
    }, [gameState]);

    // Dummy Cloud Save (Placeholder)
    const saveToCloud = useCallback(async (user: any, data: any) => {
        console.log("Saving to cloud...", user?.uid);
        // Implement Firebase/Firestore save here later
        return true;
    }, []);

    const loadFromCloud = useCallback(async (user: any) => {
        console.log("Loading from cloud...", user?.uid);
        return null;
    }, []);

    const saveGame = useCallback(() => {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    }, [gameState]);

    const addTradeRoute = useCallback((from: ResourceType, to: ResourceType, amount: number) => {
        setGameState(prev => {
            const id = `${from}_to_${to}`;

            // Check if already exists
            if (prev.tradeRoutes[id]) {
                // Optionally update amount? For now just return or maybe update.
                // Let's update the amount if it exists
                return {
                    ...prev,
                    tradeRoutes: {
                        ...prev.tradeRoutes,
                        [id]: {
                            ...prev.tradeRoutes[id],
                            amount: amount // Update amount
                        }
                    }
                };
            }

            // Calculate dynamic rate
            const isTradable = RESOURCE_VALUES[from] && RESOURCE_VALUES[to];
            if (!isTradable) return prev;

            const valFrom = RESOURCE_VALUES[from];
            const valTo = RESOURCE_VALUES[to];
            const rate = (valFrom / valTo) * 0.8; // 20% tax

            const newRoute: TradeRoute = {
                id,
                name: `${from} ➡ ${to}`, // Simple name
                from,
                to,
                rate,
                active: true,
                amount: amount
            };

            return {
                ...prev,
                tradeRoutes: { ...prev.tradeRoutes, [id]: newRoute }
            };
        });
    }, []);

    const removeTradeRoute = useCallback((id: string) => {
        setGameState(prev => {
            const newRoutes = { ...prev.tradeRoutes };
            delete newRoutes[id];
            return { ...prev, tradeRoutes: newRoutes };
        });
    }, []);

    const unlockPolicy = useCallback((policyId: string) => {
        setGameState(prev => {
            const policy = prev.policies[policyId];
            if (!policy) return prev; // Should exist
            if (policy.active) return prev; // Already active
            if (prev.resources.culture < policy.cost) return prev;

            const newResources = { ...prev.resources };
            newResources.culture -= policy.cost;

            // Create new policies object where only the target policy is active
            const newPolicies: { [key: string]: Policy } = {};
            Object.keys(prev.policies).forEach(key => {
                newPolicies[key] = {
                    ...prev.policies[key],
                    active: key === policyId
                };
            });

            return {
                ...prev,
                resources: newResources,
                policies: newPolicies
            };
        });
    }, []);


    return {
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
        removeTradeRoute,
        unlockPolicy
    };
};
