
export type Climate = 'hot' | 'cold' | 'humid' | 'arid' | 'temperate';
export type Density = 'urban' | 'rural' | 'balanced';

export interface Region {
    id: string;
    name: string;
    population: number;
    infected: number;
    dead: number;
    climate: Climate;
    density: Density;
    neighbors: string[];
    borderClosed: boolean;
}

export type TraitType = 'transmission' | 'symptom' | 'ability';

export interface Trait {
    id: string;
    name: string;
    type: TraitType;
    description: string;
    cost: number;
    reqTraits?: string[];
    effects: {
        infectivity?: number;
        lethality?: number;
        severity?: number;
        coldResist?: number;
        heatResist?: number;
        aridResist?: number;
        drugResist?: number;
        waterTransmission?: number;
        airTransmission?: number;
        landTransmission?: number;
        cureSlow?: number;
    };
}

export interface Bubble {
    id: string;
    type: 'dna' | 'biohazard' | 'cure' | 'orange' | 'info'; // Updated types
    regionId: string;
    value: number;
    createdAt: number;
}

export interface NewsItem {
    id: string;
    text: string;
    date: number;
    type: 'info' | 'warning' | 'critical';
}

export interface GameState {
    dnaPoints: number;
    cureProgress: number; // 0 to 100
    startDate: number;
    currentDate: number;
    regions: Record<string, Region>;
    traits: Record<string, boolean>;
    labs: string[]; // List of region IDs with active resistance labs

    globalInfectivity: number;
    globalLethality: number;
    globalSeverity: number; // Used for "Awareness" approximation

    isPaused: boolean;
    gameStatus: 'title' | 'choosing_start' | 'playing' | 'won' | 'lost';

    bubbles: Bubble[];
    news: NewsItem[];
    history: HistoryEntry[];
}

export interface HistoryEntry {
    date: number;
    infected: number;
    dead: number;
    cure: number;
}

