import { Card, Rank, Suit } from './types';

export class Deck {
    private cards: Card[];

    constructor(jokerCount: number = 2) {
        this.cards = [];
        this.initialize(jokerCount);
    }

    private initialize(jokerCount: number) {
        const suits: Suit[] = ['spade', 'heart', 'diamond', 'club'];
        const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        // Add standard 52 cards
        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push({ suit, rank });
            }
        }

        // Add Jokers
        for (let i = 0; i < jokerCount; i++) {
            this.cards.push({ suit: 'joker', rank: 'joker' });
        }
    }

    public shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    public draw(): Card | undefined {
        return this.cards.pop();
    }

    public deal(playerCount: number): Card[][] {
        const hands: Card[][] = Array.from({ length: playerCount }, () => []);
        let currentPlayer = 0;

        while (this.cards.length > 0) {
            const card = this.draw();
            if (card) {
                hands[currentPlayer].push(card);
                currentPlayer = (currentPlayer + 1) % playerCount;
            }
        }

        return hands;
    }

    public getCards(): Card[] {
        return [...this.cards];
    }

    public get remaining(): number {
        return this.cards.length;
    }
}

export const getSuitSymbol = (suit: Suit): string => {
    switch (suit) {
        case 'spade': return '♠';
        case 'heart': return '♥';
        case 'diamond': return '♦';
        case 'club': return '♣';
        case 'joker': return 'JOKER';
        default: return '';
    }
};

export const getRankSymbol = (rank: Rank): string => {
    if (rank === 'joker') return '';
    return rank;
};

export const getCardColor = (suit: Suit): string => {
    if (suit === 'heart' || suit === 'diamond') return '#e53e3e'; // Red
    if (suit === 'joker') return '#805ad5'; // Purple for Joker
    return '#2d3748'; // Black
};
