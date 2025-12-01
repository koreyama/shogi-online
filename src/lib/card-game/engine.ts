import { GameState, PlayerState, Card, GameLogEntry, Field, Trap } from './types';
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
        money: 0,
        ultimateUsed: false
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
            hasDiscarded: false,
            cardsPlayedCount: 0
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

    // Effect resolution

    // Common: Draw Effect
    if (card.effectId === 'draw_1') {
        drawCards(state, playerId, 1);
        addLog(state, `${player.name}はカードを1枚引いた。`);
    }

    // New: Blood Ritual (Pay HP, Gain MP)
    if (card.effectId === 'blood_ritual') {
        const hpCost = 3;
        const mpGain = 3;
        player.hp = Math.max(0, player.hp - hpCost);
        player.mp = Math.min(player.maxMp, player.mp + mpGain);
        addLog(state, `${player.name}は血を捧げ、MPを${mpGain}回復した！(HP-${hpCost})`);
    }

    // New: Meditate (Gain MP)
    if (card.effectId === 'meditate') {
        const mpGain = 2;
        player.mp = Math.min(player.maxMp, player.mp + mpGain);
        addLog(state, `${player.name}は瞑想し、MPを${mpGain}回復した。`);
    }

    // New: Cleanse
    if (card.effectId === 'cleanse') {
        player.statusEffects = [];
        addLog(state, `${player.name}は全ての状態異常を浄化した！`);
    }

    // Increment cards played count
    state.turnState.cardsPlayedCount++;

    // Trap Check: Explosive Rune (Triggers on ANY card play)
    if (state.traps) {
        const explosiveRuneIndex = state.traps.findIndex(t => t.ownerId === opponentId && t.effectId === 'trap_explosive_rune');
        if (explosiveRuneIndex !== -1) {
            const trap = state.traps[explosiveRuneIndex];
            state.traps.splice(explosiveRuneIndex, 1); // Remove trap
            player.hp = Math.max(0, player.hp - 3);
            addLog(state, `罠発動！「${trap.name}」が${player.name}に3ダメージを与えた！`);
        }
    }

    switch (card.type) {
        case 'weapon':
            // Trap Check: Counter Stance
            if (state.traps) {
                const counterIndex = state.traps.findIndex(t => t.ownerId === opponentId && t.effectId === 'trap_counter_attack');
                if (counterIndex !== -1) {
                    const trap = state.traps[counterIndex];
                    state.traps.splice(counterIndex, 1); // Remove trap
                    player.hp = Math.max(0, player.hp - 3);
                    addLog(state, `罠発動！「${trap.name}」が攻撃を無効化し、${player.name}に3ダメージを与えた！`);
                    break; // Stop attack processing
                }
            }

            // Basic attack logic
            let damage = card.value;

            // Combo Dagger
            if (card.effectId === 'combo_dagger') {
                if (state.turnState.cardsPlayedCount >= 2) {
                    damage += 2;
                    addLog(state, `コンボ成立！ダメージ+2！`);
                }
            }

            // Avatar Passive: Warrior Spirit
            if (AVATARS[player.avatarId].passiveId === 'warrior_spirit') {
                damage += 1;
            }

            // Enchantment: Attack Up
            if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'buff_atk_2') {
                damage += 2;
            }

            // Field Effect: Volcano (Fire +2, Water -2)
            if (state.field?.effectId === 'field_volcano') {
                if (card.element === 'fire') damage += 2;
                if (card.element === 'water') damage -= 2;
            }
            // Field Effect: Fog (Physical -1)
            if (state.field?.effectId === 'field_fog') {
                damage -= 1;
            }

            // New: Recoil (Self Damage)
            if (card.effectId === 'recoil_2') {
                player.hp = Math.max(0, player.hp - 2);
                addLog(state, `${player.name}は反動で2ダメージを受けた！`);
            }

            // Check opponent armor & Elemental Advantage
            if (!opponent.equipment) opponent.equipment = {};
            let multiplier = 1.0;

            // New: Pierce (Ignore Armor)
            const isPierce = card.effectId === 'pierce';

            if (opponent.equipment.armor && !isPierce) {
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

                // Status Effect: Iron Will (Buff Armor)
                const armorBuff = opponent.statusEffects?.find(e => e.type === 'buff_armor');
                if (armorBuff) {
                    reduction += armorBuff.value;
                }

                damage = Math.max(0, damage - reduction);
                addLog(state, `${opponent.name}の「${armor.name}」がダメージを${reduction}軽減した！`);

                // New: Thorns (Spike Shield)
                if (armor.effectId === 'thorns') {
                    player.hp = Math.max(0, player.hp - 1);
                    addLog(state, `${player.name}は棘で1ダメージを受けた！`);
                }

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
                if (isPierce && opponent.equipment.armor) {
                    addLog(state, `貫通攻撃！ 相手の防具を無視した！`);
                }
                // No armor or Pierce
                // Enchantment: Defense Up (Opponent) even without armor?
                if (!isPierce && opponent.equipment?.enchantment && CARDS[opponent.equipment.enchantment].effectId === 'buff_def_2') {
                    const reduction = 2;
                    damage = Math.max(0, damage - reduction);
                    addLog(state, `${opponent.name}の防御強化がダメージを${reduction}軽減した！`);
                }

                // Status Effect: Iron Will (Buff Armor) - Works without armor too
                const armorBuff = opponent.statusEffects?.find(e => e.type === 'buff_armor');
                if (!isPierce && armorBuff) {
                    const reduction = armorBuff.value;
                    damage = Math.max(0, damage - reduction);
                    addLog(state, `${opponent.name}の鉄壁がダメージを${reduction}軽減した！`);
                }
            }

            // Vampiric Aura / Drain Attack
            if ((player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'drain_1') || card.effectId === 'drain_attack') {
                player.hp = Math.min(player.maxHp, player.hp + 1);
                addLog(state, `${player.name}はHPを1回復した。`);
            }

            // New: MP Drain Ring
            if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'drain_mp_1') {
                player.mp = Math.min(player.maxMp, player.mp + 1);
                addLog(state, `${player.name}はMPを1回復した。`);
            }

            // Apply Status Effects from Weapons
            if (card.id === 'w006') { // Poison Blade
                if (!opponent.statusEffects) opponent.statusEffects = [];
                opponent.statusEffects.push({ id: `poison-${Date.now()}`, type: 'poison', name: '毒', value: 1, duration: 3 });
                addLog(state, `${opponent.name}に毒を与えた！`);
            }
            // New: Ninja Sword (20% Poison)
            if (card.effectId === 'poison_chance_20' && Math.random() < 0.2) {
                if (!opponent.statusEffects) opponent.statusEffects = [];
                opponent.statusEffects.push({ id: `poison-${Date.now()}`, type: 'poison', name: '毒', value: 1, duration: 3 });
                addLog(state, `${opponent.name}に毒を与えた！`);
            }
            // New: Enchant Poison
            if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'enchant_poison') {
                if (!opponent.statusEffects) opponent.statusEffects = [];
                opponent.statusEffects.push({ id: `poison-${Date.now()}`, type: 'poison', name: '毒', value: 1, duration: 3 });
                addLog(state, `${opponent.name}に毒を与えた！`);
            }

            opponent.hp = Math.max(0, opponent.hp - damage);
            addLog(state, `${opponent.name}に${damage}のダメージ！`);
            break;

        case 'magic':
            // Trap Check: Magic Mirror
            if (state.traps) {
                const mirrorIndex = state.traps.findIndex(t => t.ownerId === opponentId && t.effectId === 'trap_reflect_magic');
                if (mirrorIndex !== -1) {
                    const trap = state.traps[mirrorIndex];
                    state.traps.splice(mirrorIndex, 1); // Remove trap
                    addLog(state, `罠発動！「${trap.name}」が魔法を跳ね返す！`);

                    // Reflect logic: Swap target to player (caster)
                    // We need to handle this carefully. For now, let's just make the magic hit the caster.
                    // But we need to execute the magic logic with swapped targets.
                    // Simplification: Just deal the magic's value as damage to caster and stop processing.
                    // This doesn't perfectly reflect complex effects, but works for damage.

                    let reflectDmg = card.value;
                    if (card.element === 'holy' && (card.id === 'm004' || card.id === 'm005')) {
                        // Reflecting heal? Maybe it heals the opponent (trap owner) instead?
                        // Let's say it heals the trap owner.
                        opponent.hp = Math.min(opponent.maxHp, opponent.hp + reflectDmg);
                        addLog(state, `魔法は反射され、${opponent.name}を回復した！`);
                    } else {
                        player.hp = Math.max(0, player.hp - reflectDmg);
                        addLog(state, `魔法は反射され、${player.name}に${reflectDmg}のダメージ！`);
                    }
                    break; // Stop magic processing
                }
            }

            if (card.effectId === 'def_dmg') {
                // Shield Bash
                let armorVal = player.equipment?.armor ? CARDS[player.equipment.armor].value : 0;
                // Enchantment: Defense Up (Player) - Shield Bash scales with defense
                if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'buff_def_2') {
                    armorVal += 2;
                }
                // New: Iron Will (Temp Armor) - Not implemented as state yet, but could check status effects if we added it properly.
                // For now, simple implementation.

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
            } else if (card.effectId === 'life_steal') {
                // New: Life Steal
                const drain = card.value;
                opponent.hp = Math.max(0, opponent.hp - drain);
                player.hp = Math.min(player.maxHp, player.hp + drain);
                addLog(state, `${opponent.name}から生命力を${drain}奪った！`);
            } else if (card.effectId === 'mp_drain') {
                // New: Mind Blast
                const dmg = card.value;
                opponent.hp = Math.max(0, opponent.hp - dmg);
                opponent.mp = Math.max(0, opponent.mp - dmg);
                addLog(state, `${opponent.name}のHPとMPに${dmg}ダメージ！`);
            } else if (card.effectId === 'gamble') {
                // New: Gamble
                drawCards(state, playerId, 1);
                addLog(state, `${player.name}は武器を研いだ（1枚ドロー）。`);
            } else if (card.effectId === 'cure_all') {
                player.statusEffects = [];
                addLog(state, `${player.name}の状態異常が全て回復した。`);
            } else if (card.effectId === 'bomb') {
                opponent.hp = Math.max(0, opponent.hp - 5);
                addLog(state, `爆弾投擲！ ${opponent.name}に5ダメージ！`);

            } else if (card.effectId === 'buff_armor_5') {
                // Iron Will
                if (!player.statusEffects) player.statusEffects = [];
                player.statusEffects.push({ id: `armor-${Date.now()}`, type: 'buff_armor', name: '鉄壁', value: 5, duration: 1 });
                addLog(state, `${player.name}の防御力が大幅に上がった！`);

            } else if (card.effectId === 'necromancy_weapon') {
                // Necromancy: Retrieve weapon from discard
                if (player.discardPile) {
                    const weapons = player.discardPile.filter(id => CARDS[id].type === 'weapon');
                    if (weapons.length > 0) {
                        const recovered = weapons[Math.floor(Math.random() * weapons.length)];
                        player.hand.push(recovered);
                        // Remove from discard
                        const idx = player.discardPile.lastIndexOf(recovered);
                        player.discardPile.splice(idx, 1);
                        addLog(state, `${player.name}は墓地から「${CARDS[recovered].name}」を回収した！`);
                    } else {
                        addLog(state, `墓地に武器がありませんでした。`);
                    }
                }

            } else if (card.effectId === 'soul_burst') {
                // Soul Burst: Banish 3 cards for 6 damage
                if (player.discardPile && player.discardPile.length >= 3) {
                    player.discardPile.splice(0, 3); // Remove 3 oldest (or random? simple splice is fine)
                    opponent.hp = Math.max(0, opponent.hp - 6);
                    addLog(state, `${player.name}は魂を爆発させ、${opponent.name}に6ダメージ！`);
                } else {
                    addLog(state, `墓地のカードが足りず、不発に終わった...`);
                }

            } else if (card.effectId === 'grudge_damage') {
                const graveCount = player.discardPile ? player.discardPile.length : 0;
                const grudgeDmg = Math.ceil(graveCount / 2);
                opponent.hp = Math.max(0, opponent.hp - grudgeDmg);
                addLog(state, `${player.name}の怨念！墓地の数(${graveCount})に応じて${grudgeDmg}ダメージ！`);

            } else if (card.effectId === 'combo_lightning') {
                let lightningDmg = card.value;
                if (state.turnState.cardsPlayedCount >= 2) {
                    lightningDmg *= 2;
                    addLog(state, `コンボ成立！ダメージ2倍！`);
                }
                opponent.hp = Math.max(0, opponent.hp - lightningDmg);
                addLog(state, `${opponent.name}に${lightningDmg}のダメージ！`);

            } else if (card.effectId === 'combo_finisher') {
                let finisherDmg = card.value;
                if (state.turnState.cardsPlayedCount >= 3) {
                    finisherDmg *= 3;
                    addLog(state, `コンボ成立！ダメージ3倍！`);
                }
                opponent.hp = Math.max(0, opponent.hp - finisherDmg);
                addLog(state, `${opponent.name}に${finisherDmg}のダメージ！`);
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

        case 'field':
            // Set Field
            state.field = {
                cardId: card.id,
                name: card.name,
                effectId: card.effectId || '',
                element: card.element
            };
            addLog(state, `フィールドが「${card.name}」に書き換えられた！`);
            break;

        case 'trap':
            // Set Trap
            if (!state.traps) state.traps = [];
            state.traps.push({
                id: `trap-${Date.now()}`,
                cardId: card.id,
                name: card.name,
                ownerId: playerId,
                effectId: card.effectId || ''
            });
            addLog(state, `${player.name}はカードを伏せた...`);
            break;
    }

    checkWinCondition(state);
    return { ...state };
}

export function useUltimate(state: GameState, playerId: string): GameState {
    const player = state.players[playerId];
    const opponentId = Object.keys(state.players).find(id => id !== playerId)!;
    const opponent = state.players[opponentId];
    const avatar = AVATARS[player.avatarId];

    // Validation
    if (state.turnPlayerId !== playerId) return state;
    if (player.ultimateUsed) {
        addLog(state, 'アルティメットスキルは1ゲームに1回しか使えません。');
        return state;
    }
    if (player.mp < avatar.ultimateCost) {
        addLog(state, `MPが足りません！ (必要: ${avatar.ultimateCost})`);
        return state;
    }

    // Pay Cost
    player.mp -= avatar.ultimateCost;
    player.ultimateUsed = true;
    addLog(state, `${player.name}はアルティメットスキル「${avatar.ultimateName}」を発動した！`);

    // Execute Effect
    if (avatar.ultimateId === 'ultimate_divine_strike') {
        // Ares: 15 Damage
        opponent.hp = Math.max(0, opponent.hp - 15);
        addLog(state, `${opponent.name}に15の大ダメージ！`);

    } else if (avatar.ultimateId === 'ultimate_gungnir') {
        // Odin: 12 Piercing Damage (Ignore Armor/Defense)
        // Since we don't have a complex damage pipeline function exposed, we just subtract HP directly.
        // Normal attacks check armor, but here we skip it.
        opponent.hp = Math.max(0, opponent.hp - 12);
        addLog(state, `${opponent.name}に12の貫通ダメージ！`);

    } else if (avatar.ultimateId === 'ultimate_trickster_gift') {
        // Loki: Draw 3, Recover 5 MP
        drawCards(state, playerId, 3);
        player.mp = Math.min(player.maxMp, player.mp + 5);
        addLog(state, `${player.name}はカードを3枚引き、MPを5回復した！`);
    }

    checkWinCondition(state);
    return { ...state };
}

export function endTurn(state: GameState): GameState {
    const nextPlayerId = Object.keys(state.players).find(id => id !== state.turnPlayerId)!;

    state.turnPlayerId = nextPlayerId;
    state.turnCount++;
    state.phase = 'draw';
    state.turnState = { hasAttacked: false, hasDiscarded: false, cardsPlayedCount: 0 }; // Reset turn state

    // Start of turn effects
    const currentPlayer = state.players[nextPlayerId];

    // Field Effects (Start of Turn / End of Turn)
    // Sanctuary: Heal 1 HP
    if (state.field?.effectId === 'field_sanctuary') {
        currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + 1);
        addLog(state, `聖域の効果で${currentPlayer.name}のHPが1回復した。`);
    }
    // Mana Spring: Heal 1 MP
    if (state.field?.effectId === 'field_mana_spring') {
        currentPlayer.mp = Math.min(currentPlayer.maxMp, currentPlayer.mp + 1);
        addLog(state, `マナの泉の効果で${currentPlayer.name}のMPが1回復した。`);
    }

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

function getElementalMultiplier(attackElem: string, defenseElem: string, field?: Field): number {
    const cycle = ['fire', 'wind', 'earth', 'water'];
    if (attackElem === 'none' || defenseElem === 'none') return 1.0;

    // Holy <-> Dark
    if (attackElem === 'holy' && defenseElem === 'dark') return 1.5;
    if (attackElem === 'dark' && defenseElem === 'holy') return 1.5;

    // 4 Elements Cycle
    const atkIdx = cycle.indexOf(attackElem);
    const defIdx = cycle.indexOf(defenseElem);

    if (atkIdx === -1 || defIdx === -1) return 1.0;

    // Field Effect: Volcano (Fire Up, Water Down) - Wait, logic says Fire Dmg +2, not multiplier.
    // But let's check if we want multiplier changes too.
    // The prompt said "Fire Dmg +2", so let's handle that in damage calc, not multiplier.
    // But if we wanted to boost Fire vs Wind even more?
    // Let's stick to simple multiplier logic here.

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
