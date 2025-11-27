export type CardType = 'weapon' | 'armor' | 'magic' | 'item' | 'enchantment';
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
        enchantment?: string; // Card ID
    };
    status: 'alive' | 'dead';
    money: number; // Future use
}

export interface GameState {
    roomId: string;
    turnPlayerId: string;
    phase: 'draw' | 'main' | 'end';
    players: Record<string, PlayerState>;
    turnCount: number;
    log: GameLogEntry[];
    winner?: string;
    turnState: {
        hasAttacked: boolean;
        hasDiscarded: boolean;
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
