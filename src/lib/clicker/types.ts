export type ResourceType = 'food' | 'wood' | 'stone' | 'knowledge' | 'population' | 'gold' | 'iron' | 'coal';

export type Era = 'primitive' | 'ancient' | 'classical' | 'medieval' | 'renaissance' | 'industrial';

export interface Resources {
    food: number;
    wood: number;
    stone: number;
    knowledge: number;
    population: number;
    gold: number;
    iron: number;
    coal: number;
}

export interface ClickDrop {
    resource: ResourceType;
    amount: number;
    chance: number; // 0-1
    reqTech?: string; // Tech ID required to unlock this drop
}

export interface Job {
    id: string;
    name: string;
    description: string;
    production: Partial<Resources>; // Production per worker
    consumption?: Partial<Resources>; // Consumption per worker
    unlocked: boolean;
    reqTech?: string[];
}

export interface Building {
    id: string;
    name: string;
    description: string;
    baseCost: Partial<Resources>;
    // production: Partial<Resources>; // Removed in v5.1
    jobSlots?: { [jobId: string]: number }; // Added in v5.1: Job ID -> Slots per building
    consumption?: Partial<Resources>; // Maintenance cost (not per worker)
    costScaling: number;
    count: number;
    unlocked: boolean;
    reqEra?: Era;
    reqTech?: string[];
    housing?: number;
    workerReq?: number; // Deprecated
}

export interface Tech {
    id: string;
    name: string;
    description: string;
    cost: Partial<Resources>;
    unlocked: boolean;
    researched: boolean;
    effects?: {
        unlockBuilding?: string[];
        unlockJob?: string[]; // Added
        resourceMultiplier?: Partial<Record<ResourceType, number>>;
        clickMultiplier?: number;
    };
    reqEra?: Era;
    reqTech?: string[];
}

export type ExpeditionType = 'scout' | 'research' | 'trade';

export interface ExpeditionConfig {
    id: ExpeditionType;
    title: string;
    description: string;
    cost: Partial<Resources>;
    rewardDesc: string;
    risk: '低' | '中' | '高';
    duration: number; // seconds
    reqTech?: string; // Optional tech requirement
}

export interface ActiveExpedition {
    id: string;
    type: ExpeditionType;
    startTime: number;
    duration: number;
    cost: Partial<Resources>;
}

export interface GameState {
    resources: Resources;
    rates: Partial<Resources>; // Added: Production rate per second
    buildings: { [key: string]: Building };
    techs: { [key: string]: Tech };
    jobs: { [key: string]: number };
    era: Era;
    happiness: number;
    maxPopulation: number;
    lastSaveTime: number;
    totalPlayTime: number;
    activeExpeditions: ActiveExpedition[]; // Added in v5.9
    logs: LogEntry[]; // Added in v5.10
    unlockedAchievements: string[];
}

export interface LogEntry {
    id: string;
    message: string;
    timestamp: number;
    type: 'success' | 'info' | 'error';
}

export const INITIAL_RESOURCES: Resources = {
    food: 0,
    wood: 0,
    stone: 0,
    knowledge: 0,
    population: 5, // Changed from 1 to 5 in v5.9
    gold: 0,
    iron: 0,
    coal: 0
};

export const ERAS: Record<Era, { name: string; description: string }> = {
    primitive: { name: '原始時代', description: '自然と共に生きる' },
    ancient: { name: '古代', description: '文明の曙' },
    classical: { name: '古典時代', description: '哲学と帝国の時代' },
    medieval: { name: '中世', description: '封建制とギルド' },
    renaissance: { name: 'ルネサンス', description: '再生と発見' },
    industrial: { name: '産業時代', description: '蒸気と鋼鉄' }
};
