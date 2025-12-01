export type CardType = 'weapon' | 'armor' | 'magic' | 'item' | 'enchantment' | 'field' | 'trap';
export type ElementType = 'none' | 'fire' | 'water' | 'wind' | 'earth' | 'holy' | 'dark';
export type Rarity = 'common' | 'rare' | 'legendary';

export interface Card {
    id: string;
    name: string;
    type: CardType;
    element: ElementType;
    value: number; // Damage for weapon/magic, Defense for armor, Heal amount for item
    cost: number; // MP cost
    description: string;
    rarity: Rarity;
    effectId?: string; // For special effects
    durability?: number; // For armor
}

export interface StatusEffect {
    id: string; // Unique ID for the effect instance
    type: 'poison' | 'burn' | 'freeze' | 'regen' | 'atk_up' | 'def_up' | 'buff_armor';
    name: string;
    value: number;
    duration: number; // Turns remaining
}

export interface Avatar {
    id: string;
    name: string;
    description: string;
    baseHp: number;
    baseMp: number;
    passiveId: string;
    passiveName: string;
    passiveDescription: string;
    defaultDeckId: string;
    ultimateId: string;
    ultimateName: string;
    ultimateDescription: string;
    ultimateCost: number;
}

export interface Deck {
    id: string;
    name: string;
    cards: string[]; // List of Card IDs
}

export interface PlayerState {
    id: string;
    name: string;
    avatarId: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    hand: string[]; // Card IDs
    deck: string[]; // Card IDs
    discardPile: string[]; // Card IDs
    equipment: {
        weapon?: string; // Card ID
        armor?: string; // Card ID
        armorDurability?: number; // Current durability of equipped armor
        enchantment?: string; // Card ID
    };
    statusEffects: StatusEffect[];
    status: 'alive' | 'dead';
    money: number;
    ultimateUsed: boolean;
}

export interface Field {
    cardId: string;
    name: string;
    effectId: string;
    element?: ElementType;
}
export interface Trap {
    id: string; // Unique ID
    cardId: string;
    name: string;
    ownerId: string;
    effectId: string;
}

export interface GameState {
    roomId: string;
    turnPlayerId: string;
    phase: 'draw' | 'main' | 'end';
    players: Record<string, PlayerState>;
    turnCount: number;
    log: GameLogEntry[];
    winner?: string;
    field?: Field; // Active field effect
    traps?: Trap[]; // Active traps
    turnState: {
        hasAttacked: boolean;
        hasDiscarded: boolean;
        cardsPlayedCount: number;
    };
    lastPlayedCard?: {
        cardId: string;
        playerId: string;
        timestamp: number;
    };
}

export interface GameLogEntry {
    id: string;
    text: string;
    timestamp: number;
}
