import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Resources, Building, Tech, ResourceType, INITIAL_RESOURCES, Era, ExpeditionType } from './types';
import { INITIAL_BUILDINGS, INITIAL_TECHS, INITIAL_JOBS, CLICK_DROPS, EXPEDITIONS } from './data';
import { ACHIEVEMENTS } from './achievements';

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
        unlockedAchievements: []
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load save on mount (Client-side only)
    useEffect(() => {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setGameState(prev => ({
                    ...prev,
                    ...parsed,
                    buildings: { ...INITIAL_BUILDINGS, ...parsed.buildings },
                    techs: { ...INITIAL_TECHS, ...parsed.techs },
                    resources: { ...INITIAL_RESOURCES, ...parsed.resources },
                    jobs: { ...parsed.jobs },
                    logs: parsed.logs || [],
                    unlockedAchievements: parsed.unlockedAchievements || []
                }));
            } catch (e) {
                console.error("Failed to load save", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const lastTickRef = useRef<number>(Date.now());
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const calculateProduction = (jobs: { [key: string]: number }): Partial<Resources> => {
        // Calculate Tech Multipliers
        const multipliers: { [key: string]: number } = {};
        Object.values(gameState.techs).forEach(tech => {
            if (tech.researched && tech.effects?.resourceMultiplier) {
                Object.entries(tech.effects.resourceMultiplier).forEach(([res, mult]) => {
                    multipliers[res] = (multipliers[res] || 1) * mult;
                });
            }
        });

        const totalProd: Partial<Resources> = {
            food: 1 * (multipliers['food'] || 1),
            knowledge: 0.1 * (multipliers['knowledge'] || 1)
        };

        const hasPaper = gameState.techs['paper']?.researched;

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
                const production = calculateProduction(prev.jobs);
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

                // Natural Growth
                if (newPopulation < maxPop && newResources.food > 0 && newHappiness > 50) {
                    // Growth rate depends on happiness and empty space
                    const growthRate = 0.1 * (newHappiness / 100);
                    newPopulation += growthRate * delta;
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
                    if (!b.unlocked) {
                        if (b.reqTech) {
                            const allReqsMet = b.reqTech.every(reqId => prev.techs[reqId]?.researched);
                            if (allReqsMet) b.unlocked = true;
                        } else if (b.reqEra === prev.era) {
                            if (b.id === 'gatherer_hut') b.unlocked = true;
                        }
                    }
                });

                // Process Active Expeditions
                const activeExpeditions = prev.activeExpeditions || [];
                const completedExpeditions: any[] = [];
                const remainingExpeditions: any[] = [];

                activeExpeditions.forEach(exp => {
                    if (now >= exp.startTime + exp.duration) {
                        completedExpeditions.push(exp);
                    } else {
                        remainingExpeditions.push(exp);
                    }
                });

                // Grant rewards for completed expeditions
                const newLogs: any[] = [];

                completedExpeditions.forEach(exp => {
                    const rand = Math.random();
                    let reward: Partial<Resources> = {};
                    let message = "";
                    let type: 'success' | 'info' | 'error' = 'info';

                    if (exp.type === 'scout') {
                        if (rand < 0.4) {
                            const amount = Math.floor(Math.random() * 30) + 20;
                            const resType = Math.random() > 0.5 ? 'wood' : 'stone';
                            reward = { [resType]: amount };
                            message = `周辺調査完了: ${resType === 'wood' ? '木材' : '石材'} +${amount}`;
                            type = 'success';
                        } else if (rand < 0.7) {
                            const amount = Math.floor(Math.random() * 20) + 10;
                            reward = { food: amount };
                            message = `周辺調査完了: 食料 +${amount}`;
                            type = 'success';
                        } else {
                            message = "周辺調査完了: 成果なし";
                            type = 'info';
                        }
                    } else if (exp.type === 'research') {
                        if (rand < 0.5) {
                            const amount = Math.floor(Math.random() * 100) + 50;
                            reward = { knowledge: amount };
                            message = `古代遺跡調査完了: 知識 +${amount}`;
                            type = 'success';
                        } else {
                            message = "古代遺跡調査完了: 成果なし";
                            type = 'info';
                        }
                    } else if (exp.type === 'trade') {
                        if (rand < 0.6) {
                            const amount = Math.floor(Math.random() * 50) + 20;
                            reward = { gold: amount };
                            message = `交易完了: 金 +${amount}`;
                            type = 'success';
                        } else {
                            message = "交易失敗: 成果なし";
                            type = 'error';
                        }
                    }

                    // Apply reward
                    Object.entries(reward).forEach(([res, amount]) => {
                        newResources[res as ResourceType] += (amount as number);
                    });

                    // Create Log Entry
                    newLogs.push({
                        id: Date.now().toString() + Math.random().toString(),
                        message,
                        timestamp: Date.now(),
                        type
                    });
                });

                // Check Achievements
                const newUnlockedAchievements = [...(prev.unlockedAchievements || [])];
                let achievementUnlocked = false;

                ACHIEVEMENTS.forEach(ach => {
                    if (!newUnlockedAchievements.includes(ach.id)) {
                        if (ach.condition(prev)) { // Check against previous state to avoid immediate re-render issues, though checking against new state would be more accurate for instant feedback. Using prev is safer for now.
                            newUnlockedAchievements.push(ach.id);
                            achievementUnlocked = true;
                            newLogs.push({
                                id: Date.now().toString() + Math.random().toString(),
                                message: `実績解除: ${ach.title}`,
                                timestamp: Date.now(),
                                type: 'success'
                            });
                        }
                    }
                });

                // Update logs (keep last 10)
                const updatedLogs = [...newLogs, ...(prev.logs || [])].slice(0, 10);

                return {
                    ...prev,
                    resources: { ...newResources, population: newPopulation },
                    rates: currentRates, // Update rates
                    buildings: newBuildings,
                    techs: newTechs,
                    happiness: Math.max(0, Math.min(100, newHappiness)),
                    maxPopulation: maxPop,
                    totalPlayTime: prev.totalPlayTime + delta,
                    activeExpeditions: remainingExpeditions,
                    logs: updatedLogs,
                    unlockedAchievements: newUnlockedAchievements
                };
            });
        };

        const intervalId = setInterval(tick, TICK_RATE);
        return () => clearInterval(intervalId);
    }, []);

    const gameStateRef = useRef(gameState); // Ref to track latest state for event listeners

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Auto-Save & Cleanup
    useEffect(() => {
        const save = () => {
            const current = gameStateRef.current;
            const toSave = { ...current, lastSaveTime: Date.now() };
            localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
        };

        const handleBeforeUnload = () => save();
        const handleVisibilityChange = () => {
            if (document.hidden) save();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        saveIntervalRef.current = setInterval(save, 1000);

        return () => {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            save(); // Save on unmount too
        };
    }, []);

    // Job Assignment Logic
    const assignJob = useCallback((jobId: string, amount: number) => {
        setGameState(prev => {
            const job = INITIAL_JOBS[jobId];
            if (!job) return prev;

            const currentAssigned = prev.jobs[jobId] || 0;
            const newAssigned = currentAssigned + amount;

            // Check bounds
            if (newAssigned < 0) return prev;

            // Check max slots
            let maxSlots = 0;
            if (jobId === 'gatherer') maxSlots = 5; // Base slots for gatherer

            Object.values(prev.buildings).forEach(b => {
                if (b.jobSlots && b.jobSlots[jobId]) {
                    maxSlots += b.jobSlots[jobId] * b.count;
                }
            });

            if (newAssigned > maxSlots) return prev;

            // Check available population
            const totalAssigned = Object.values(prev.jobs).reduce((a, b) => a + b, 0);
            const unassigned = Math.floor(prev.resources.population) - totalAssigned;

            // If adding, check if we have unassigned pop
            if (amount > 0 && unassigned < amount) return prev;

            return {
                ...prev,
                jobs: {
                    ...prev.jobs,
                    [jobId]: newAssigned
                }
            };
        });
    }, []);

    const clickResource = useCallback(() => {
        const gained: Partial<Resources> = {};

        // Calculate Click Multiplier from Techs
        let clickMult = 1;
        Object.values(gameState.techs).forEach(tech => {
            if (tech.researched && tech.effects?.clickMultiplier) {
                clickMult *= tech.effects.clickMultiplier;
            }
        });

        // Dynamic Click Drops based on Tech
        CLICK_DROPS.forEach(drop => {
            if (!drop.reqTech || gameState.techs[drop.reqTech]?.researched) {
                if (Math.random() <= drop.chance) {
                    const amount = drop.amount * clickMult;
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
    }, [gameState.techs]);

    const calculateCost = (building: Building): Partial<Resources> => {
        const cost: Partial<Resources> = {};
        Object.entries(building.baseCost).forEach(([res, amount]) => {
            const rKey = res as ResourceType;
            cost[rKey] = Math.floor(amount * Math.pow(building.costScaling, building.count));
        });
        return cost;
    };

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
            let popIncrease = 0;
            if (building.housing) {
                newMaxPop += building.housing;
                popIncrease = building.housing; // Instant population growth
            }

            const updatedResources = {
                ...newResources,
                population: prev.resources.population + popIncrease
            };

            return {
                ...prev,
                resources: updatedResources,
                buildings: newBuildings,
                maxPopulation: newMaxPop
            };
        });
    }, []);

    const researchTech = useCallback((techId: string) => {
        setGameState(prev => {
            const tech = prev.techs[techId];
            if (!tech || tech.researched) return prev;

            // Check affordability
            for (const [res, amount] of Object.entries(tech.cost)) {
                if (prev.resources[res as ResourceType] < (amount as number)) return prev;
            }

            // Deduct resources
            const newResources = { ...prev.resources };
            for (const [res, amount] of Object.entries(tech.cost)) {
                newResources[res as ResourceType] -= (amount as number);
            }

            const newTechs = { ...prev.techs };
            newTechs[techId] = { ...tech, researched: true };

            // Apply immediate effects
            const newBuildings = { ...prev.buildings };
            if (tech.effects?.unlockBuilding) {
                tech.effects.unlockBuilding.forEach(bId => {
                    if (newBuildings[bId]) newBuildings[bId].unlocked = true;
                });
            }

            // Era Progression Check
            let newEra = prev.era;
            if (techId === 'agriculture') newEra = 'ancient';
            if (techId === 'currency') newEra = 'classical';
            if (techId === 'feudalism') newEra = 'medieval';
            if (techId === 'printing_press') newEra = 'renaissance';
            if (techId === 'steam_power') newEra = 'industrial';

            return {
                ...prev,
                resources: newResources,
                techs: newTechs,
                buildings: newBuildings,
                era: newEra
            };
        });
    }, []);

    const resetGame = () => {
        localStorage.removeItem(SAVE_KEY);
        setGameState({
            resources: INITIAL_RESOURCES,
            rates: {},
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
            unlockedAchievements: []
        });
    };

    const saveGame = () => {
        const toSave = { ...gameState, lastSaveTime: Date.now() };
        localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
        return toSave;
    };

    const getNextObjective = () => {
        if (gameState.era === 'primitive') {
            if (!gameState.techs.stone_tools.researched) return { text: "「石器」を研究する", target: 1, current: 0, type: 'tech' };
            if (!gameState.techs.fire.researched) return { text: "「火の発見」を研究する", target: 1, current: 0, type: 'tech' };
            if (!gameState.techs.agriculture.researched) return { text: "「農耕」を研究して古代へ", target: 1, current: 0, type: 'tech' };
        }
        return { text: "文明を発展させる", target: 100, current: 100, type: 'generic' };
    };

    const sendExpedition = useCallback((type: ExpeditionType) => {
        let result = { success: false, message: '', reward: {} as Partial<Resources> };

        setGameState(prev => {
            // Limit concurrent expeditions
            if (prev.activeExpeditions && prev.activeExpeditions.length >= 3) {
                result.message = "探索隊はこれ以上派遣できません";
                return prev;
            }

            const config = EXPEDITIONS[type];
            if (!config) {
                result.message = "Invalid expedition type";
                return prev;
            }

            // Check affordability
            for (const [res, amount] of Object.entries(config.cost)) {
                if (prev.resources[res as ResourceType] < (amount as number)) {
                    result.message = `${res === 'food' ? '食料' : '木材'}が足りません`; // Simple message, could be better
                    return prev;
                }
            }

            const newResources = { ...prev.resources };
            for (const [res, amount] of Object.entries(config.cost)) {
                newResources[res as ResourceType] -= (amount as number);
            }

            const newExpedition: any = {
                id: Date.now().toString() + Math.random().toString(),
                type,
                startTime: Date.now(),
                duration: config.duration * 1000, // ms
                cost: config.cost
            };

            result = { success: true, message: "探索隊を派遣しました！", reward: {} };

            return {
                ...prev,
                resources: newResources,
                activeExpeditions: [...(prev.activeExpeditions || []), newExpedition]
            };
        });
        return result;
    }, []);

    // Cloud Save Logic
    const saveToCloud = async (user: any, state: GameState) => {
        if (!user) return;
        try {
            const { ref, set } = await import('firebase/database');
            const { db } = await import('@/lib/firebase');
            const userSaveRef = ref(db, `users/${user.uid}/clickerSave`);
            await set(userSaveRef, {
                ...state,
                lastSaveTime: Date.now()
            });
            console.log("Cloud save successful");
        } catch (e) {
            console.error("Cloud save failed", e);
        }
    };

    const loadFromCloud = async (user: any): Promise<GameState | null> => {
        if (!user) return null;
        try {
            const { ref, get } = await import('firebase/database');
            const { db } = await import('@/lib/firebase');
            const userSaveRef = ref(db, `users/${user.uid}/clickerSave`);
            const snapshot = await get(userSaveRef);
            if (snapshot.exists()) {
                return snapshot.val() as GameState;
            }
        } catch (e) {
            console.error("Cloud load failed", e);
        }
        return null;
    };

    return {
        gameState,
        setGameState, // Export setGameState for external loading
        clickResource,
        buyBuilding,
        researchTech,
        assignJob,
        calculateCost,
        calculateProduction,
        calculateConsumption,
        resetGame,
        getNextObjective,
        sendExpedition,
        saveToCloud,
        loadFromCloud,
        saveGame
    };
};
