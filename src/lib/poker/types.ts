import { Card } from '../trump/types';

export type PokerPhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type HandRank =
    | 'High Card'
    | 'One Pair'
    | 'Two Pair'
    | 'Three of a Kind'
    | 'Straight'
    | 'Flush'
    | 'Full House'
    | 'Four of a Kind'
    | 'Straight Flush'
    | 'Royal Flush';

export interface PokerPlayer {
    id: string;
    name: string;
    hand: Card[]; // 2 hole cards
    chips: number;
    currentBet: number; // Amount bet in the current round
    isActive: boolean; // Not folded
    isAllIn: boolean;
    isDealer: boolean;
    isSmallBlind: boolean;
    isBigBlind: boolean;
    role: 'player' | 'spectator';
    isAi: boolean;
    lastAction?: 'fold' | 'check' | 'call' | 'raise' | 'allin' | null;
    hasActedThisRound: boolean; // Track if player acted in current betting round
}

export interface PokerGameState {
    pot: number;
    communityCards: Card[];
    deck: Card[]; // Internal use, might not be sent to client fully
    players: Record<string, PokerPlayer>;
    turnPlayerId: string;
    dealerId: string;
    smallBlindAmount: number;
    bigBlindAmount: number;
    currentBet: number; // The amount to call
    phase: PokerPhase;
    winners: string[];
    winningHand?: string; // Description of winning hand
    history: string[];
    lastAggressorId?: string | null; // Player who made last raise/bet - round ends when back to them
}

export interface PokerAction {
    type: 'fold' | 'check' | 'call' | 'raise' | 'allin';
    amount?: number; // For raise
}
