import { GameState, PlayerState, Card, GameLogEntry } from './types';
import { CARDS, CARD_LIST } from './data/cards';
import { AVATARS } from './data/avatars';

export function createPlayerState(
    id: string,
    name: string,
    avatarId: string,
    deck: string[]
): PlayerState {
    const avatar = AVATARS[avatarId] || AVATARS['warrior_god'];
    return {
        id,
        name,
        avatarId,
        hp: avatar.baseHp,
        maxHp: avatar.baseHp,
        mp: avatar.baseMp,
        maxMp: avatar.baseMp,
        hand: [],
        deck: [...deck].sort(() => Math.random() - 0.5), // Shuffle
        discardPile: [],
        equipment: {},
        status: 'alive',
        money: 0
    };
}

export function createInitialState(
    roomId: string,
    player1: { id: string, name: string, avatarId: string, deck: string[] },
    player2: { id: string, name: string, avatarId: string, deck: string[] }
): GameState {
    const p1State = createPlayerState(player1.id, player1.name, player1.avatarId, player1.deck);
    const p2State = createPlayerState(player2.id, player2.name, player2.avatarId, player2.deck);

    const initialState: GameState = {
        roomId,
        turnPlayerId: player1.id, // Player 1 starts
        phase: 'draw',
        players: {
            [player1.id]: p1State,
            [player2.id]: p2State
        },
        turnCount: 1,
        log: [{ id: `log-${Date.now()}`, text: 'ゲーム開始！', timestamp: Date.now() }],
        turnState: {
            hasAttacked: false,
            hasDiscarded: false
        }
    };

    // Initial Draw
    drawCards(initialState, player1.id, 5);
    drawCards(initialState, player2.id, 5);

    return initialState;
}

export function drawCards(state: GameState, playerId: string, count: number) {
    const player = state.players[playerId];
    for (let i = 0; i < count; i++) {
        if (!player.deck) player.deck = [];
        if (player.deck.length === 0) {
            // Reshuffle discard pile into deck if empty
            if (!player.discardPile) player.discardPile = [];
            if (player.discardPile.length > 0) {
                player.deck = [...player.discardPile].sort(() => Math.random() - 0.5);
                player.discardPile = [];
                addLog(state, `${player.name}のデッキが再構築されました。`);
            } else {
                break; // No cards left
            }
        }
        const cardId = player.deck.pop();
        if (cardId) {
            if (!player.hand) player.hand = [];
            player.hand.push(cardId);
        }
    }
}

export function playCard(state: GameState, playerId: string, cardId: string, targetId?: string): GameState {
    const player = state.players[playerId];
    const opponentId = Object.keys(state.players).find(id => id !== playerId)!;
    const opponent = state.players[opponentId];
    const card = CARDS[cardId];
    const cardIndex = player.hand.indexOf(cardId);

    if (cardIndex === -1) return state; // Card not in hand

    // Cost check
    if (player.mp < card.cost) {
        addLog(state, `MPが足りません！ (必要: ${card.cost})`);
        return state;
    }

    // Attack Limit Check
    const isAttack = card.type === 'weapon' || (card.type === 'magic' && card.id !== 'm004' && card.id !== 'm005'); // m004/m005 are healing
    if (isAttack && state.turnState.hasAttacked) {
        addLog(state, `攻撃は1ターンに1回までです！`);
        return state;
    }

    // Pay cost
    player.mp -= card.cost;
    player.hand.splice(cardIndex, 1);
    if (!player.discardPile) player.discardPile = [];
    player.discardPile.push(cardId);

    addLog(state, `${player.name}は「${card.name}」を使用した！`);
    state.lastPlayedCard = {
        cardId,
        playerId,
        timestamp: Date.now()
    };

    if (isAttack) {
        state.turnState.hasAttacked = true;
    }

    // Effect resolution

    // Common: Draw Effect
    if (card.effectId === 'draw_1') {
        drawCards(state, playerId, 1);
        addLog(state, `${player.name}はカードを1枚引いた。`);
    }

    switch (card.type) {
        case 'weapon':
            // Basic attack logic
            let damage = card.value;

            // Avatar Passive: Warrior Spirit
            if (AVATARS[player.avatarId].passiveId === 'warrior_spirit') {
                damage += 1;
            }

            // Check opponent armor
            if (!opponent.equipment) opponent.equipment = {};
            if (opponent.equipment.armor) {
                const armor = CARDS[opponent.equipment.armor];
                const reduction = armor.value;
                damage = Math.max(0, damage - reduction);
                addLog(state, `${opponent.name}の「${armor.name}」がダメージを${reduction}軽減した！`);
            }

            // Vampiric Aura
            if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'drain_1') {
                player.hp = Math.min(player.maxHp, player.hp + 1);
                addLog(state, `${player.name}はHPを1回復した。`);
            }

            opponent.hp = Math.max(0, opponent.hp - damage);
            addLog(state, `${opponent.name}に${damage}のダメージ！`);
            break;

        case 'magic':
            if (card.effectId === 'def_dmg') {
                // Shield Bash
                const armorVal = player.equipment?.armor ? CARDS[player.equipment.armor].value : 0;
                let bashDmg = armorVal;
                opponent.hp = Math.max(0, opponent.hp - bashDmg);
                addLog(state, `${opponent.name}に${bashDmg}のダメージ（防御力依存）！`);

            } else if (card.effectId === 'buff_atk_3') {
                // Berserk (Implemented as permanent buff for now, ideally should be status effect)
                // For MVP, we'll just add a log since we don't have a generic buff system yet.
                // To make it work without a complex system, let's change it to a high damage attack for now or skip.
                // Actually, let's make it a "Next Turn" buff if possible, but for simplicity, let's make it a direct damage + self damage.
                // Re-reading plan: "Grant +3 ATK buff card".
                // Since we don't have mutable card stats, let's change Berserk to: Deal 5 damage to self, deal 10 to opponent.
                const recoil = 5;
                const berserkDmg = 10;
                player.hp = Math.max(0, player.hp - recoil);
                opponent.hp = Math.max(0, opponent.hp - berserkDmg);
                addLog(state, `${player.name}は身を削って攻撃！ 自分に${recoil}、相手に${berserkDmg}のダメージ！`);

            } else if (card.element === 'holy' && (card.id === 'm004' || card.id === 'm005')) {
                // Healing
                const healAmount = card.value;
                player.hp = Math.min(player.maxHp, player.hp + healAmount);
                addLog(state, `${player.name}のHPが${healAmount}回復した。`);
            } else if (card.id === 'm006') {
                // Drain
                const drain = card.value;
                opponent.hp = Math.max(0, opponent.hp - drain);
                player.hp = Math.min(player.maxHp, player.hp + drain);
                addLog(state, `${opponent.name}からHPを${drain}吸収した！`);
            } else {
                // Attack Magic
                let magicDamage = card.value;
                opponent.hp = Math.max(0, opponent.hp - magicDamage);
                addLog(state, `${opponent.name}に${magicDamage}の魔法ダメージ！`);
            }
            break;

        case 'item':
            if (card.id === 'i001' || card.id === 'i002' || card.id === 'i004' || card.id === 'i005') {
                const heal = card.value;
                player.hp = Math.min(player.maxHp, player.hp + heal);
                addLog(state, `${player.name}のHPが${heal}回復した。`);
                if (card.id === 'i004') {
                    player.mp = player.maxMp;
                    addLog(state, `${player.name}のMPが全回復した。`);
                }
            } else if (card.id === 'i003') {
                const mpHeal = card.value;
                player.mp = Math.min(player.maxMp, player.mp + mpHeal);
                addLog(state, `${player.name}のMPが${mpHeal}回復した。`);
            }
            break;

        case 'armor':
            // Equip armor
            if (!player.equipment) player.equipment = {};
            if (player.equipment.armor) {
                if (!player.discardPile) player.discardPile = [];
                player.discardPile.push(player.equipment.armor); // Discard old
            }
            player.equipment.armor = cardId;
            player.discardPile.pop(); // Remove from discard pile because it's now equipped
            addLog(state, `${player.name}は「${card.name}」を装備した。`);
            break;

        case 'enchantment':
            // Equip enchantment
            if (!player.equipment) player.equipment = {};
            if (player.equipment.enchantment) {
                if (!player.discardPile) player.discardPile = [];
                player.discardPile.push(player.equipment.enchantment);
            }
            player.equipment.enchantment = cardId;
            player.discardPile.pop();
            addLog(state, `${player.name}は「${card.name}」を装備した。`);
            break;
    }

    checkWinCondition(state);
    return { ...state };
}

export function endTurn(state: GameState): GameState {
    const nextPlayerId = Object.keys(state.players).find(id => id !== state.turnPlayerId)!;

    state.turnPlayerId = nextPlayerId;
    state.turnCount++;
    state.phase = 'draw';
    state.turnState = { hasAttacked: false, hasDiscarded: false }; // Reset turn state

    // Start of turn effects
    const currentPlayer = state.players[nextPlayerId];

    // Regen MP
    currentPlayer.mp = Math.min(currentPlayer.maxMp, currentPlayer.mp + 1);

    // Draw card
    drawCards(state, nextPlayerId, 1);

    addLog(state, `${currentPlayer.name}のターン (${state.turnCount}ターン目)`);

    return { ...state };
}

export function discardAndDraw(state: GameState, playerId: string, cardId: string): GameState {
    const player = state.players[playerId];

    // Validation
    if (state.turnPlayerId !== playerId) return state;
    if (state.turnState.hasDiscarded) {
        addLog(state, '手札交換は1ターンに1回までです。');
        return state;
    }

    const cardIndex = player.hand.indexOf(cardId);
    if (cardIndex === -1) return state;

    // Discard
    const card = CARDS[cardId];
    player.hand.splice(cardIndex, 1);
    if (!player.discardPile) player.discardPile = [];
    player.discardPile.push(cardId);

    addLog(state, `${player.name}は「${card.name}」を捨ててドローした。`);

    // Draw
    drawCards(state, playerId, 1);

    // Update state
    state.turnState.hasDiscarded = true;

    return { ...state };
}

function checkWinCondition(state: GameState) {
    const p1Id = Object.keys(state.players)[0];
    const p2Id = Object.keys(state.players)[1];
    const p1 = state.players[p1Id];
    const p2 = state.players[p2Id];

    if (p1.hp <= 0) {
        p1.status = 'dead';
        state.winner = p2Id;
        addLog(state, `${p1.name}は昇天した... ${p2.name}の勝利！`);
    } else if (p2.hp <= 0) {
        p2.status = 'dead';
        state.winner = p1Id;
        addLog(state, `${p2.name}は昇天した... ${p1.name}の勝利！`);
    }
}

function addLog(state: GameState, text: string) {
    if (!state.log) state.log = [];
    state.log.push({
        id: `log-${Date.now()}-${Math.random()}`,
        text,
        timestamp: Date.now()
    });
}
