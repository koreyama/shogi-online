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
        statusEffects: [],
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

            // Enchantment: Attack Up
            if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'buff_atk_2') {
                damage += 2;
            }

            // Check opponent armor & Elemental Advantage
            if (!opponent.equipment) opponent.equipment = {};
            let multiplier = 1.0;

            if (opponent.equipment.armor) {
                const armor = CARDS[opponent.equipment.armor];

                // Calculate Elemental Multiplier
                multiplier = getElementalMultiplier(card.element, armor.element);
                if (multiplier > 1.0) addLog(state, `効果抜群！ (${card.element} -> ${armor.element})`);
                if (multiplier < 1.0) addLog(state, `効果はいまひとつのようだ... (${card.element} -> ${armor.element})`);

                damage = Math.floor(damage * multiplier);

                let reduction = armor.value;
                // Enchantment: Defense Up (Opponent)
                if (opponent.equipment?.enchantment && CARDS[opponent.equipment.enchantment].effectId === 'buff_def_2') {
                    reduction += 2;
                }

                damage = Math.max(0, damage - reduction);
                addLog(state, `${opponent.name}の「${armor.name}」がダメージを${reduction}軽減した！`);

                // Reduce Durability
                if (opponent.equipment.armorDurability !== undefined) {
                    opponent.equipment.armorDurability -= 1;
                    if (opponent.equipment.armorDurability <= 0) {
                        addLog(state, `${opponent.name}の「${armor.name}」は壊れてしまった！`);
                        if (!opponent.discardPile) opponent.discardPile = [];
                        opponent.discardPile.push(opponent.equipment.armor);
                        opponent.equipment.armor = undefined;
                        opponent.equipment.armorDurability = undefined;
                    }
                }
            } else {
                // No armor
                // Enchantment: Defense Up (Opponent) even without armor?
                // Usually defense up implies better resilience. Let's apply it even without armor if we want,
                // but usually it boosts armor. Let's say it adds flat reduction.
                if (opponent.equipment?.enchantment && CARDS[opponent.equipment.enchantment].effectId === 'buff_def_2') {
                    const reduction = 2;
                    damage = Math.max(0, damage - reduction);
                    addLog(state, `${opponent.name}の防御強化がダメージを${reduction}軽減した！`);
                }
            }

            // Vampiric Aura
            if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'drain_1') {
                player.hp = Math.min(player.maxHp, player.hp + 1);
                addLog(state, `${player.name}はHPを1回復した。`);
            }

            // Apply Status Effects from Weapons
            if (card.id === 'w006') { // Poison Blade
                if (!opponent.statusEffects) opponent.statusEffects = [];
                opponent.statusEffects.push({ id: `poison-${Date.now()}`, type: 'poison', name: '毒', value: 1, duration: 3 });
                addLog(state, `${opponent.name}に毒を与えた！`);
            }

            opponent.hp = Math.max(0, opponent.hp - damage);
            addLog(state, `${opponent.name}に${damage}のダメージ！`);
            break;

        case 'magic':
            if (card.effectId === 'def_dmg') {
                // Shield Bash
                let armorVal = player.equipment?.armor ? CARDS[player.equipment.armor].value : 0;
                // Enchantment: Defense Up (Player) - Shield Bash scales with defense
                if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'buff_def_2') {
                    armorVal += 2;
                }

                let bashDmg = armorVal;
                opponent.hp = Math.max(0, opponent.hp - bashDmg);
                addLog(state, `${opponent.name}に${bashDmg}のダメージ（防御力依存）！`);

            } else if (card.effectId === 'buff_atk_3') {
                // Berserk
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
            } else if (card.id === 'm008') { // Poison
                if (!opponent.statusEffects) opponent.statusEffects = [];
                opponent.statusEffects.push({ id: `poison-${Date.now()}`, type: 'poison', name: '毒', value: 2, duration: 3 });
                addLog(state, `${opponent.name}に毒を与えた！`);
            } else {
                // Attack Magic
                let magicDamage = card.value;

                // Enchantment: Magic Up
                if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'buff_magic_2') {
                    magicDamage += 2;
                }

                // Elemental Multiplier for Magic
                if (opponent.equipment?.armor) {
                    const armor = CARDS[opponent.equipment.armor];
                    const multiplier = getElementalMultiplier(card.element, armor.element);
                    if (multiplier > 1.0) addLog(state, `効果抜群！ (${card.element} -> ${armor.element})`);
                    if (multiplier < 1.0) addLog(state, `効果はいまひとつのようだ... (${card.element} -> ${armor.element})`);
                    magicDamage = Math.floor(magicDamage * multiplier);
                }

                // Status Effects for Magic
                if (card.element === 'fire' && Math.random() < 0.3) { // 30% chance to burn
                    if (!opponent.statusEffects) opponent.statusEffects = [];
                    opponent.statusEffects.push({ id: `burn-${Date.now()}`, type: 'burn', name: '火傷', value: 2, duration: 2 });
                    addLog(state, `${opponent.name}は火傷を負った！`);
                }
                if (card.element === 'water' && card.id === 'm002' && Math.random() < 0.3) { // Blizzard 30% freeze
                    if (!opponent.statusEffects) opponent.statusEffects = [];
                    opponent.statusEffects.push({ id: `freeze-${Date.now()}`, type: 'freeze', name: '凍結', value: 0, duration: 1 });
                    addLog(state, `${opponent.name}は凍りついた！`);
                }

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
            } else if (card.effectId === 'buff_next_2') {
                // Whetstone: Draw 1 card (Effect says "Sharpen weapon (Draw 1)")
                drawCards(state, playerId, 1);
                addLog(state, `${player.name}は武器を研いだ（1枚ドロー）。`);
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
            player.equipment.armorDurability = card.durability !== undefined ? card.durability : 3; // Default 3
            player.discardPile.pop(); // Remove from discard pile because it's now equipped
            addLog(state, `${player.name}は「${card.name}」を装備した。(耐久:${player.equipment.armorDurability})`);
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

    // Handle Status Effects
    if (!currentPlayer.statusEffects) currentPlayer.statusEffects = [];
    const activeEffects: typeof currentPlayer.statusEffects = [];

    currentPlayer.statusEffects.forEach(effect => {
        if (effect.duration > 0) {
            switch (effect.type) {
                case 'poison':
                    currentPlayer.hp = Math.max(0, currentPlayer.hp - effect.value);
                    addLog(state, `${currentPlayer.name}は毒で${effect.value}のダメージ！`);
                    break;
                case 'burn':
                    currentPlayer.hp = Math.max(0, currentPlayer.hp - effect.value);
                    addLog(state, `${currentPlayer.name}は火傷で${effect.value}のダメージ！`);
                    break;
                case 'regen':
                    currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + effect.value);
                    addLog(state, `${currentPlayer.name}はリジェネでHPが${effect.value}回復した。`);
                    break;
            }
            effect.duration--;
            if (effect.duration > 0) {
                activeEffects.push(effect);
            } else {
                addLog(state, `${currentPlayer.name}の${effect.name}効果が切れた。`);
            }
        }
    });
    currentPlayer.statusEffects = activeEffects;

    // Check for Freeze
    const isFrozen = currentPlayer.statusEffects.some(e => e.type === 'freeze');
    if (isFrozen) {
        addLog(state, `${currentPlayer.name}は凍結していて動けない！`);
        state.turnState.hasAttacked = true; // Prevent attack
    }

    // Regen MP
    currentPlayer.mp = Math.min(currentPlayer.maxMp, currentPlayer.mp + 1);

    // Draw card
    let drawCount = 1;
    // Enchantment: Speed Up (Draw +1)
    if (currentPlayer.equipment?.enchantment && CARDS[currentPlayer.equipment.enchantment].effectId === 'draw_plus_1') {
        drawCount += 1;
        addLog(state, `${currentPlayer.name}は疾風のブーツの効果で追加ドロー！`);
    }

    // Avatar Passive: Trickster's Luck
    if (AVATARS[currentPlayer.avatarId].passiveId === 'lucky_charm' && Math.random() < 0.2) {
        drawCount += 1;
        addLog(state, `${currentPlayer.name}の幸運が発動！追加ドロー！`);
    }

    drawCards(state, nextPlayerId, drawCount);

    addLog(state, `${currentPlayer.name}のターン (${state.turnCount}ターン目)`);

    return { ...state };
}

function getElementalMultiplier(attackElem: string, defenseElem: string): number {
    const cycle = ['fire', 'wind', 'earth', 'water'];
    if (attackElem === 'none' || defenseElem === 'none') return 1.0;

    // Holy <-> Dark
    if (attackElem === 'holy' && defenseElem === 'dark') return 1.5;
    if (attackElem === 'dark' && defenseElem === 'holy') return 1.5;

    // 4 Elements Cycle
    const atkIdx = cycle.indexOf(attackElem);
    const defIdx = cycle.indexOf(defenseElem);

    if (atkIdx === -1 || defIdx === -1) return 1.0;

    // Strong: Fire(0) > Wind(1) > Earth(2) > Water(3) > Fire(0)
    // Wait, typical is Fire > Wind? Or Fire > Earth?
    // User said: Fire > Wind > Earth > Water > Fire
    // So 0 > 1 > 2 > 3 > 0

    // Check Strong
    if ((atkIdx + 1) % 4 === defIdx) return 1.5; // e.g. Fire(0) vs Wind(1) -> 0+1 = 1. Match.

    // Check Weak (Reverse)
    if ((defIdx + 1) % 4 === atkIdx) return 0.5; // e.g. Water(3) vs Fire(0) -> 3+1 = 4%4=0. Match.

    return 1.0;
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
