export type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'joker';

export interface Card {
    suit: Suit;
    rank: Rank;
}

export type PlayerRole = 'daifugo' | 'fugo' | 'heimin' | 'hinmin' | 'daihinmin' | 'host' | 'guest';

export interface TrumpPlayer {
    id: string;
    name: string;
    hand: Card[];
    role: PlayerRole;
    isAi: boolean;
    isReady?: boolean;
    rank?: number; // For sorting
    finishedRank?: number; // 1st, 2nd, etc.
}

export interface GameState {
    turnPlayerId: string;
    turn: string; // page.tsx uses 'turn'
    field: Card[];
    hands: Record<string, Card[]>;
    history: any[]; // simplified
    status: 'waiting' | 'playing' | 'finished';
    passCount: number;
    lastMove?: {
        cards: Card[];
        playerId: string;
        isSequence: boolean;
        isPair: boolean;
    } | null;
    isRevolution: boolean;
    is11Back: boolean;
    isShibari: boolean; // Suit binding active
    isSpade3Returned: boolean; // For special rule
    finishedPlayers?: string[];
    ranks?: Record<string, number>;
}

export interface TrumpRules {
    jokerCount: number;
    revolution: boolean;
    miyakoOchi: boolean;
    is8Cut: boolean;
    is11Back: boolean;
    isStaircase: boolean;
    isShibari: boolean;
    isSpade3: boolean;
}

export interface TrumpRoom {
    roomId: string; // Changed from id
    hostId: string;
    players: Record<string, TrumpPlayer>;
    gameState?: GameState;
    status: 'waiting' | 'playing' | 'finished';
    rules: TrumpRules;
    gameType: TrumpGameType; // Added
    createdAt: number;
}

export type TrumpGameType = 'daifugo' | 'poker' | 'speed' | 'blackjack';
