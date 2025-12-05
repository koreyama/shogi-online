import { Card } from '../trump/types';
import { BlackjackEngine, BlackjackHand, BlackjackAction } from './engine';

export class BlackjackAI {
    private engine: BlackjackEngine;

    constructor() {
        this.engine = new BlackjackEngine();
    }

    /**
     * Get the best action based on basic strategy
     */
    public getAction(playerHand: BlackjackHand, dealerUpCard: Card): BlackjackAction {
        const playerValue = playerHand.value;
        const isSoft = playerHand.isSoft;
        const dealerValue = this.getCardValue(dealerUpCard);

        // Can't act if busted or blackjack
        if (playerHand.isBusted || playerHand.isBlackjack) {
            return 'stand';
        }

        // Basic Strategy
        if (isSoft) {
            return this.getSoftHandAction(playerValue, dealerValue, playerHand.cards.length === 2);
        } else {
            return this.getHardHandAction(playerValue, dealerValue, playerHand.cards.length === 2);
        }
    }

    private getCardValue(card: Card): number {
        if (card.rank === 'A') return 11;
        if (['K', 'Q', 'J', '10'].includes(card.rank)) return 10;
        return parseInt(card.rank);
    }

    /**
     * Strategy for hard hands (no Ace counted as 11)
     */
    private getHardHandAction(playerValue: number, dealerValue: number, canDouble: boolean): BlackjackAction {
        // Always hit on 8 or less
        if (playerValue <= 8) return 'hit';

        // 9: Double against 3-6, otherwise hit
        if (playerValue === 9) {
            if (canDouble && dealerValue >= 3 && dealerValue <= 6) return 'double';
            return 'hit';
        }

        // 10: Double against 2-9, otherwise hit
        if (playerValue === 10) {
            if (canDouble && dealerValue >= 2 && dealerValue <= 9) return 'double';
            return 'hit';
        }

        // 11: Always double if possible, otherwise hit
        if (playerValue === 11) {
            if (canDouble) return 'double';
            return 'hit';
        }

        // 12: Stand against 4-6, otherwise hit
        if (playerValue === 12) {
            if (dealerValue >= 4 && dealerValue <= 6) return 'stand';
            return 'hit';
        }

        // 13-16: Stand against 2-6, otherwise hit
        if (playerValue >= 13 && playerValue <= 16) {
            if (dealerValue >= 2 && dealerValue <= 6) return 'stand';
            return 'hit';
        }

        // 17+: Always stand
        return 'stand';
    }

    /**
     * Strategy for soft hands (Ace counted as 11)
     */
    private getSoftHandAction(playerValue: number, dealerValue: number, canDouble: boolean): BlackjackAction {
        // Soft 13-14 (A,2 or A,3): Double against 5-6, otherwise hit
        if (playerValue === 13 || playerValue === 14) {
            if (canDouble && dealerValue >= 5 && dealerValue <= 6) return 'double';
            return 'hit';
        }

        // Soft 15-16 (A,4 or A,5): Double against 4-6, otherwise hit
        if (playerValue === 15 || playerValue === 16) {
            if (canDouble && dealerValue >= 4 && dealerValue <= 6) return 'double';
            return 'hit';
        }

        // Soft 17 (A,6): Double against 3-6, otherwise hit
        if (playerValue === 17) {
            if (canDouble && dealerValue >= 3 && dealerValue <= 6) return 'double';
            return 'hit';
        }

        // Soft 18 (A,7): Stand against 2,7,8; Double against 3-6; Hit against 9,10,A
        if (playerValue === 18) {
            if (dealerValue === 2 || dealerValue === 7 || dealerValue === 8) return 'stand';
            if (canDouble && dealerValue >= 3 && dealerValue <= 6) return 'double';
            if (dealerValue >= 9) return 'hit';
            return 'stand';
        }

        // Soft 19-21: Always stand
        return 'stand';
    }

    /**
     * Simplified decision for dealer AI (follows house rules)
     */
    public dealerShouldHit(dealerHand: BlackjackHand): boolean {
        return dealerHand.value < 17;
    }
}
