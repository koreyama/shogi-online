import { Card, Rank } from '../trump/types';

export interface BlackjackHand {
    cards: Card[];
    value: number;
    isSoft: boolean; // Has an Ace counted as 11
    isBusted: boolean;
    isBlackjack: boolean;
}

export type BlackjackAction = 'hit' | 'stand' | 'double' | 'split' | 'insurance';

export interface BlackjackGameState {
    playerHands: BlackjackHand[];
    dealerHand: BlackjackHand;
    currentHandIndex: number;
    deck: Card[];
    phase: 'betting' | 'playing' | 'dealer_turn' | 'finished';
    results: ('win' | 'lose' | 'push' | 'blackjack' | 'pending')[];
}

export class BlackjackEngine {
    private static readonly CARD_VALUES: Record<Rank, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11, 'joker': 0
    };

    /**
     * Calculate the value of a hand
     */
    public calculateHandValue(cards: Card[]): BlackjackHand {
        let value = 0;
        let aceCount = 0;

        for (const card of cards) {
            const cardValue = BlackjackEngine.CARD_VALUES[card.rank];
            value += cardValue;
            if (card.rank === 'A') aceCount++;
        }

        // Adjust for Aces (count as 1 instead of 11 if busting)
        while (value > 21 && aceCount > 0) {
            value -= 10;
            aceCount--;
        }

        const isSoft = aceCount > 0 && value <= 21;
        const isBusted = value > 21;
        const isBlackjack = cards.length === 2 && value === 21;

        return {
            cards,
            value,
            isSoft,
            isBusted,
            isBlackjack
        };
    }

    /**
     * Check if player can hit
     */
    public canHit(hand: BlackjackHand): boolean {
        return !hand.isBusted && !hand.isBlackjack && hand.value < 21;
    }

    /**
     * Check if player can double down (only on first two cards)
     */
    public canDouble(hand: BlackjackHand): boolean {
        return hand.cards.length === 2 && !hand.isBusted && !hand.isBlackjack;
    }

    /**
     * Check if player can split (same rank cards)
     */
    public canSplit(hand: BlackjackHand): boolean {
        if (hand.cards.length !== 2) return false;
        return hand.cards[0].rank === hand.cards[1].rank;
    }

    /**
     * Dealer plays according to standard rules (hit until 17+)
     */
    public dealerShouldHit(dealerHand: BlackjackHand): boolean {
        // Dealer must hit on soft 17 in some variants, stand in others
        // We'll use the common rule: stand on all 17s
        return dealerHand.value < 17;
    }

    /**
     * Determine the result of a hand vs dealer
     */
    public determineResult(playerHand: BlackjackHand, dealerHand: BlackjackHand): 'win' | 'lose' | 'push' | 'blackjack' {
        // Player busted
        if (playerHand.isBusted) return 'lose';

        // Dealer busted
        if (dealerHand.isBusted) return 'win';

        // Both have Blackjack
        if (playerHand.isBlackjack && dealerHand.isBlackjack) return 'push';

        // Player has Blackjack
        if (playerHand.isBlackjack) return 'blackjack';

        // Dealer has Blackjack
        if (dealerHand.isBlackjack) return 'lose';

        // Compare values
        if (playerHand.value > dealerHand.value) return 'win';
        if (playerHand.value < dealerHand.value) return 'lose';
        return 'push';
    }

    /**
     * Create initial game state
     */
    public createInitialState(deck: Card[]): BlackjackGameState {
        // Deal 2 cards to player, 2 to dealer
        const playerCards = [deck.pop()!, deck.pop()!];
        const dealerCards = [deck.pop()!, deck.pop()!];

        const playerHand = this.calculateHandValue(playerCards);
        const dealerHand = this.calculateHandValue(dealerCards);

        return {
            playerHands: [playerHand],
            dealerHand,
            currentHandIndex: 0,
            deck,
            phase: playerHand.isBlackjack || dealerHand.isBlackjack ? 'finished' : 'playing',
            results: [playerHand.isBlackjack ? 'blackjack' : 'pending']
        };
    }

    /**
     * Execute a hit action
     */
    public hit(state: BlackjackGameState): BlackjackGameState {
        const newState = { ...state };
        const hand = newState.playerHands[newState.currentHandIndex];

        const newCard = newState.deck.pop()!;
        const newHand = this.calculateHandValue([...hand.cards, newCard]);
        newState.playerHands[newState.currentHandIndex] = newHand;

        // Check if busted or 21
        if (newHand.isBusted || newHand.value === 21) {
            newState.results[newState.currentHandIndex] = newHand.isBusted ? 'lose' : 'pending';
            // Move to next hand or dealer turn
            if (newState.currentHandIndex < newState.playerHands.length - 1) {
                newState.currentHandIndex++;
            } else {
                newState.phase = 'dealer_turn';
            }
        }

        return newState;
    }

    /**
     * Execute a stand action
     */
    public stand(state: BlackjackGameState): BlackjackGameState {
        const newState = { ...state };

        // Move to next hand or dealer turn
        if (newState.currentHandIndex < newState.playerHands.length - 1) {
            newState.currentHandIndex++;
        } else {
            newState.phase = 'dealer_turn';
        }

        return newState;
    }

    /**
     * Execute dealer's turn
     */
    public playDealerTurn(state: BlackjackGameState): BlackjackGameState {
        const newState = { ...state };
        let dealerHand = newState.dealerHand;

        // Dealer draws until 17+
        while (this.dealerShouldHit(dealerHand)) {
            const newCard = newState.deck.pop()!;
            dealerHand = this.calculateHandValue([...dealerHand.cards, newCard]);
        }
        newState.dealerHand = dealerHand;

        // Determine results for all hands
        newState.results = newState.playerHands.map((hand, i) => {
            if (newState.results[i] === 'lose') return 'lose'; // Already busted
            return this.determineResult(hand, dealerHand);
        });

        newState.phase = 'finished';
        return newState;
    }
}
