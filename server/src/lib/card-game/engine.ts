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
        ultimateUsed: false,
        fatigueDamage: 0
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
            cardsPlayedCount: 0,
            manaChargeCount: 0
        }
    };

    // Initial Draw
    drawCards(initialState, player1.id, 5);
    drawCards(initialState, player2.id, 5);

    // Start Main Phase
    initialState.phase = 'main';

    return initialState;
}

export function drawCards(state: GameState, playerId: string, count: number) {
    const player = state.players[playerId];
    for (let i = 0; i < count; i++) {
        if (!player.deck) player.deck = [];

        // Deck Depletion Logic
        if (player.deck.length === 0) {
            // Try to Recycle Discard Pile
            if (player.discardPile && player.discardPile.length > 0) {
                // Recycle
                player.deck = [...player.discardPile];
                player.discardPile = [];
                // Shuffle
                player.deck.sort(() => Math.random() - 0.5);

                // Fatigue Damage
                player.fatigueDamage = (player.fatigueDamage || 0) + 1;
                const damage = player.fatigueDamage;
                player.hp = Math.max(0, player.hp - damage);

                addLog(state, `山札が尽きたため、墓地をリサイクルしました。(${player.fatigueDamage}回目の再構築)`);
                addLog(state, `${player.name}は疲労で${damage}ダメージを受けた！`);

                // Draw from new deck
                const cardId = player.deck.pop();
                if (cardId) {
                    if (!player.hand) player.hand = [];
                    player.hand.push(cardId);
                }
            } else {
                // Total Exhaustion (No Deck, No Grave): Draw "Stone"
                const stoneId = 'special_stone';
                if (!player.hand) player.hand = [];
                player.hand.push(stoneId);
                addLog(state, `山札も墓地も尽きた！${player.name}は「石ころ」を拾った。`);
            }
            continue;
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

    // Calculate Effective Cost
    let effectiveCost = card.cost;
    if (card.type === 'magic' && AVATARS[player.avatarId].passiveId === 'arcane_mastery') {
        effectiveCost = Math.max(1, effectiveCost - 1); // Minimum 1
    }

    // Check for Free Cast (Loki's Ultimate)
    let isFree = false;
    if (state.turnState.freeCardIds) {
        const freeIdx = state.turnState.freeCardIds.indexOf(cardId);
        if (freeIdx !== -1) {
            effectiveCost = 0;
            isFree = true;
        }
    }

    // Cost check
    if (player.mp < effectiveCost) {
        addLog(state, `MPが足りません！ (必要: ${effectiveCost})`);
        return state;
    }

    // Attack Limit Check
    const isAttack = card.type === 'weapon' || (card.type === 'magic' && card.id !== 'm004' && card.id !== 'm005'); // m004/m005 are healing
    const isCombo = card.effectId?.startsWith('combo_');

    // Loki's Ultimate (isFree) bypasses attack limit and doesn't count as an attack
    if (isAttack && !isFree) {
        if (state.turnState.hasAttacked) {
            // Already attacked. Only allow if it's a Combo Chain AND this is a Combo Card.
            if (state.turnState.isComboChain && isCombo) {
                // Allowed. Continue chain.
            } else {
                addLog(state, `攻撃は1ターンに1回までです！(コンボ中はコンボのみ可)`);
                return state;
            }
        } else {
            // First attack.
            state.turnState.hasAttacked = true;
            if (isCombo) {
                state.turnState.isComboChain = true;
            }
        }
    }

    // Pay cost
    player.mp -= effectiveCost;
    player.hand.splice(cardIndex, 1);

    // Consume Free Cast
    if (isFree && state.turnState.freeCardIds) {
        const freeIdx = state.turnState.freeCardIds.indexOf(cardId);
        if (freeIdx !== -1) {
            state.turnState.freeCardIds.splice(freeIdx, 1);
        }
    }

    // Only add to discard pile if it's a consumable (Weapon, Magic, Item)
    // Armor, Enchantment, and Trap go to their respective slots/field.
    if (card.type === 'weapon' || card.type === 'magic' || card.type === 'item') {
        if (!player.discardPile) player.discardPile = [];
        player.discardPile.push(cardId);
    }

    addLog(state, `${player.name}は「${card.name}」を使用した！`);
    state.lastPlayedCard = {
        cardId,
        playerId,
        timestamp: Date.now()
    };

    if (isAttack) {
        state.turnState.hasAttacked = true;
    }

    // Shared Effect Logic (Helper function or inline)
    const applySharedEffect = (effectId: string) => {
        if (effectId === 'cure_all') {
            player.statusEffects = [];
            addLog(state, `${player.name}の状態異常が全て回復した。`);
        } else if (effectId === 'cure_poison') {
            // Remove poison
            if (player.statusEffects) {
                const initialLength = player.statusEffects.length;
                player.statusEffects = player.statusEffects.filter(e => e.type !== 'poison');
                if (player.statusEffects.length < initialLength) {
                    addLog(state, `${player.name}の毒が消えた！`);
                }
            }
        } else if (effectId === 'bomb') {
            opponent.hp = Math.max(0, opponent.hp - 5);
            addLog(state, `爆弾投擲！ ${opponent.name}に5ダメージ！`);
        } else if (effectId === 'burn_all') {
            // Firestorm: Damage + Burn
            const dmg = 4;
            opponent.hp = Math.max(0, opponent.hp - dmg);
            if (!opponent.statusEffects) opponent.statusEffects = [];
            opponent.statusEffects.push({ id: `burn-${Date.now()}`, type: 'burn', name: '火傷', value: 1, duration: 3 });
            addLog(state, `${opponent.name}を焼き尽くす！${dmg}ダメージと火傷を与えた！`);
        } else if (effectId === 'freeze_hit') {
            // Absolute Zero: Damage + Freeze
            const dmg = 4;
            opponent.hp = Math.max(0, opponent.hp - dmg);
            if (!opponent.statusEffects) opponent.statusEffects = [];
            opponent.statusEffects.push({ id: `freeze-${Date.now()}`, type: 'freeze', name: '凍結', value: 0, duration: 1 });
            addLog(state, `${opponent.name}を凍結させた！(次のターン行動不能)`);
        }
    };

    // Apply shared effects first if present
    if (card.effectId) {
        applySharedEffect(card.effectId);
    }

    // Trap Check: Explosive Rune (Triggers on ANY card usage)
    if (state.traps) {
        const runeIndex = state.traps.findIndex(t => t.ownerId === opponentId && t.effectId === 'trap_explosive_rune');
        if (runeIndex !== -1) {
            const trap = state.traps[runeIndex];
            state.traps.splice(runeIndex, 1); // Remove trap
            player.hp = Math.max(0, player.hp - 3);
            addLog(state, `罠発動！「${trap.name}」が${player.name}に3ダメージを与えた！`);
            // Explosive Rune does NOT negate the card, so we continue.
        }
    }

    switch (card.type) {
        case 'weapon':
            // Trap Check: Counter Stance, Pitfall, Frozen Shackles, Gale
            if (state.traps) {
                const trapIndex = state.traps.findIndex(t => t.ownerId === opponentId && (t.effectId === 'trap_counter_attack' || t.effectId === 'trap_pitfall' || t.effectId === 'trap_frozen_shackles' || t.effectId === 'trap_gale'));
                if (trapIndex !== -1) {
                    const trap = state.traps[trapIndex];
                    state.traps.splice(trapIndex, 1); // Remove trap

                    if (trap.effectId === 'trap_gale') {
                        addLog(state, `罠発動！「${trap.name}」がカードを吹き飛ばした！(手札に戻る)`);
                        player.hand.push(cardId); // Return to hand
                        // Refund MP? Usually 'Counter' implies cost is paid. Duel Masters rules say effect is negated but card is used?
                        // "Return to hand" suggests valid play but no effect. 
                        // If we push back to hand, player essentially lost MP for nothing.
                        // Let's keep MP cost paid (punishment).

                        // Stop processing (Effect negated)
                        break;
                    }

                    if (trap.effectId === 'trap_frozen_shackles') {
                        addLog(state, `罠発動！「${trap.name}」が攻撃を止め、${player.name}を凍りつかせた！`);
                        if (!player.statusEffects) player.statusEffects = [];
                        player.statusEffects.push({ id: `freeze-${Date.now()}`, type: 'freeze', name: '凍結', value: 0, duration: 1 });
                        break;
                    }

                    let trapDmg = 3;
                    if (trap.effectId === 'trap_pitfall') trapDmg = 5;

                    player.hp = Math.max(0, player.hp - trapDmg);
                    addLog(state, `罠発動！「${trap.name}」が攻撃を無効化し、${player.name}に${trapDmg}ダメージを与えた！`);
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

            // Bone Blade: Scale with Graveyard
            if (card.effectId === 'scale_grave_3') {
                const graveCount = player.discardPile ? player.discardPile.length : 0;
                const bonus = Math.floor(graveCount / 3);
                if (bonus > 0) {
                    damage += bonus;
                    addLog(state, `墓地の力で攻撃力+${bonus}！`);
                }
            }

            // Bone Blade: Scale with Graveyard
            if (card.effectId === 'scale_grave_3') {
                const graveCount = player.discardPile ? player.discardPile.length : 0;
                const bonus = Math.floor(graveCount / 3);
                if (bonus > 0) {
                    damage += bonus;
                    addLog(state, `墓地の力で攻撃力+${bonus}！`);
                }
            }

            // Avatar Passive: Warrior Spirit
            if (AVATARS[player.avatarId].passiveId === 'warrior_spirit') {
                damage += 1;
            }

            // Resonance (Union) Logic
            // If card has 'union_<element>_<effect>' and player has matching equipment
            if (card.effectId && card.effectId.startsWith('union_')) {
                const parts = card.effectId.split('_'); // e.g. union, fire, atk
                if (parts.length >= 3) {
                    const reqElement = parts[1];
                    const effectType = parts[2];

                    // Check Equipment Elements
                    const armorElem = player.equipment?.armor ? CARDS[player.equipment.armor].element : 'none';
                    // const weaponElem = ... (Weapon is self, can't be used for requirement, usually Union requires *other* gear)
                    // Let's assume Union checks Armor or Enchantment.

                    if (armorElem === reqElement) {
                        if (effectType === 'atk') {
                            damage += 2; // Bonus Damage
                            addLog(state, `共鳴(ユニオン)発動！${reqElement}の力でダメージ+2！`);
                        }
                    }
                }
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
            // Trap Check: Magic Mirror, Silence, Mana Burn, Gale
            if (state.traps) {
                const trapIndex = state.traps.findIndex(t => t.ownerId === opponentId && (t.effectId === 'trap_reflect_magic' || t.effectId === 'trap_silence' || t.effectId === 'trap_mana_burn' || t.effectId === 'trap_gale'));
                if (trapIndex !== -1) {
                    const trap = state.traps[trapIndex];
                    state.traps.splice(trapIndex, 1); // Remove trap

                    if (trap.effectId === 'trap_gale') {
                        addLog(state, `罠発動！「${trap.name}」が魔法を吹き飛ばした！(手札に戻る)`);
                        player.hand.push(cardId);
                        break;
                    }

                    if (trap.effectId === 'trap_silence') {
                        addLog(state, `罠発動！「${trap.name}」が魔法を無効化し、MPを5奪う！`);
                        player.mp = Math.max(0, player.mp - 5);
                        break;
                    }

                    if (trap.effectId === 'trap_mana_burn') {
                        const burnDmg = effectiveCost; // Use calculated effective cost
                        player.hp = Math.max(0, player.hp - burnDmg);
                        addLog(state, `罠発動！「${trap.name}」が魔法を無効化し、コスト分(${burnDmg})のダメージ！`);
                        break;
                    }

                    addLog(state, `罠発動！「${trap.name}」が魔法を跳ね返す！`);
                    // Reflect logic...
                    let reflectDmg = card.value;
                    if (card.element === 'holy' && (card.id === 'm004' || card.id === 'm005')) {
                        opponent.hp = Math.min(opponent.maxHp, opponent.hp + reflectDmg);
                        addLog(state, `魔法は反射され、${opponent.name}を回復した！`);
                    } else {
                        player.hp = Math.max(0, player.hp - reflectDmg);
                        addLog(state, `魔法は反射され、${player.name}に${reflectDmg}のダメージ！`);
                    }
                    break; // Stop magic processing
                }
            }

            // Passive Graveyard Effect: Dark Echo
            let darkBoost = 0;
            if (card.element === 'dark' && player.discardPile) {
                darkBoost = player.discardPile.filter(id => CARDS[id].effectId === 'passive_dark_boost').length;
            }

            if (card.effectId === 'reshuffle_grave') {
                // Reshuffle Grave
                if (player.discardPile && player.discardPile.length > 0) {
                    const count = player.discardPile.length;
                    // Move all to deck
                    if (!player.deck) player.deck = [];
                    player.deck.push(...player.discardPile);
                    player.discardPile = [];
                    // Shuffle
                    player.deck.sort(() => Math.random() - 0.5);

                    player.hp = Math.min(player.maxHp, player.hp + count);
                    addLog(state, `${player.name}は墓地を山札に戻し、HPを${count}回復した！`);
                } else {
                    addLog(state, `墓地が空だった...`);
                }

            } else if (card.effectId === 'def_dmg') {
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
                // New: Gamble (Fixed: Random Damage)
                const gambleDmg = Math.floor(Math.random() * 10) + 1;
                opponent.hp = Math.max(0, opponent.hp - gambleDmg);
                addLog(state, `ギャンブル！ ${opponent.name}に${gambleDmg}のダメージ！`);
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

            } else if (card.effectId === 'necro_salvage') {
                // Necro-Salvage: Return card from Grave to Hand
                // For simplicity in this engine, we'll just pick a random card from grave if no target selection UI exists for grave yet.
                // Ideally, this should open a selection modal.
                // Given current constraints, let's implement as "Randomly retrieve a card" or "Retrieve last discarded card".
                // Let's go with "Random" for now to keep it simple without UI changes, or "Last" as a deterministic fallback.
                // Actually, let's try to be smart. If we can't select, random is fair.
                if (player.discardPile && player.discardPile.length > 0) {
                    const recovered = player.discardPile[Math.floor(Math.random() * player.discardPile.length)];
                    player.hand.push(recovered);
                    const idx = player.discardPile.lastIndexOf(recovered);
                    player.discardPile.splice(idx, 1);
                    addLog(state, `${player.name}は墓地から「${CARDS[recovered].name}」をサルベージした！`);
                } else {
                    addLog(state, `墓地が空だった...`);
                }

            } else if (card.effectId === 'mana_recall') {
                // Mana Recall: Return card from Mana Zone to Hand
                // Similar to Salvage, we'll pick random for now as we lack Mana Zone selection UI.
                if (player.manaZone && player.manaZone.length > 0) {
                    const recovered = player.manaZone[Math.floor(Math.random() * player.manaZone.length)];
                    player.hand.push(recovered);
                    const idx = player.manaZone.lastIndexOf(recovered);
                    player.manaZone.splice(idx, 1);
                    // Reduce MP max? No, Mana Zone card removal reduces max MP implicitly if we recalculate.
                    // But currently maxMp is state. We should probably reduce maxMp.
                    player.maxMp = Math.max(0, player.maxMp - 1);
                    player.mp = Math.min(player.mp, player.maxMp); // Clamp current MP
                    addLog(state, `${player.name}はマナゾーンから「${CARDS[recovered].name}」を回収した！(最大MP-1)`);
                } else {
                    addLog(state, `マナゾーンが空だった...`);
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
            } else if (card.effectId === 'blood_ritual') {
                // Blood Ritual: HP -3, MP +3
                player.hp = Math.max(0, player.hp - 3);
                player.mp = Math.min(player.maxMp, player.mp + 3);
                addLog(state, `${player.name}は血の儀式を行った。(HP-3, MP+3)`);

            } else if (card.effectId === 'meditate') {
                // Meditate: MP +2
                player.mp = Math.min(player.maxMp, player.mp + 2);
                addLog(state, `${player.name}は瞑想した。(MP+2)`);

            } else if (card.effectId === 'cleanse') {
                // Cleanse: Remove all status effects
                player.statusEffects = [];
                addLog(state, `${player.name}は浄化の光で身を清めた！(状態異常解除)`);

            } else if (card.effectId === 'swap_hp') {
                // Soul Exchange
                // Swap HP values but clamp to their respective Max HPs
                const myOldHp = player.hp;
                const opOldHp = opponent.hp;
                player.hp = Math.min(player.maxHp, opOldHp);
                opponent.hp = Math.min(opponent.maxHp, myOldHp);
                addLog(state, `ソウルエクスチェンジ発動！二人のHPが入れ替わった！`);

            } else if (card.effectId === 'hand_destruct_1') {
                // Mind Crush
                if (opponent.hand && opponent.hand.length > 0) {
                    const rndIdx = Math.floor(Math.random() * opponent.hand.length);
                    const discarded = opponent.hand.splice(rndIdx, 1)[0];
                    if (!opponent.discardPile) opponent.discardPile = [];
                    opponent.discardPile.push(discarded);
                    addLog(state, `${opponent.name}の手札「${CARDS[discarded].name}」を捨てさせた！`);
                    // Trigger discard effects? Usually user-initiated discard triggers, forced discard might not. Keeps simple.
                } else {
                    addLog(state, `しかし、${opponent.name}の手札は空だった！`);
                }

            } else if (card.effectId === 'draw_until_5') {
                // Divine Grace
                const drawCount = 5 - player.hand.length;
                if (drawCount > 0) {
                    drawCards(state, playerId, drawCount);
                    addLog(state, `${player.name}は神の恵みにより${drawCount}枚ドローした！`);
                } else {
                    addLog(state, `手札は既に充分だった。`);
                }

            } else if (card.element === 'fire' || card.element === 'water' || card.element === 'wind' || card.element === 'earth' || card.element === 'dark') {
                // Basic Magic Damage (if not handled by special effects)
                // ... (existing logic)
                const handledEffects = ['burn_all', 'freeze_hit', 'mp_drain', 'life_steal', 'def_dmg', 'buff_atk_3', 'gamble', 'bomb', 'soul_burst', 'grudge_damage', 'combo_lightning', 'combo_finisher', 'blood_ritual', 'meditate', 'cleanse', 'reshuffle_grave', 'passive_regen_slime', 'passive_dark_boost', 'swap_hp', 'hand_destruct_1', 'draw_until_5'];
                if (!card.effectId || !handledEffects.includes(card.effectId)) {
                    let magicDmg = card.value + darkBoost; // Apply Dark Boost
                    if (darkBoost > 0) addLog(state, `墓地の闇の反響でダメージ+${darkBoost}！`);

                    // Enchantment: Magic Up
                    if (player.equipment?.enchantment && CARDS[player.equipment.enchantment].effectId === 'buff_magic_2') {
                        magicDmg += 2;
                    }
                    opponent.hp = Math.max(0, opponent.hp - magicDmg);
                    addLog(state, `${opponent.name}に${magicDmg}の魔法ダメージ！`);
                }
            }
            break;

        case 'item':
            // Healing Items
            if (card.value > 0 && (card.id === 'i001' || card.id === 'i002' || card.effectId === 'cure_poison')) {
                // Herb, Potion, Antidote (Heal part)
                const heal = card.value;
                player.hp = Math.min(player.maxHp, player.hp + heal);
                addLog(state, `${player.name}はHPを${heal}回復した。`);
            }

            // MP Recovery
            if (card.id === 'i003') { // Mana Water
                player.mp = Math.min(player.maxMp, player.mp + card.value);
                addLog(state, `${player.name}はMPを${card.value}回復した。`);
            }

            // Elixir (Full Restore)
            if (card.id === 'i004') {
                player.hp = player.maxHp;
                player.mp = player.maxMp;
                player.statusEffects = []; // Cure all too? Usually Elixir does.
                addLog(state, `${player.name}は全回復した！`);
            }

            // Smoke Bomb (Heal 1? Description says "Emergency Evasion (Heal 1)")
            if (card.id === 'i005') {
                player.hp = Math.min(player.maxHp, player.hp + 1);
                addLog(state, `${player.name}は煙玉を使って体制を立て直した。(HP+1)`);
            }

            // Whetstone (Draw 1)
            if (card.effectId === 'buff_next_2') { // Reusing effectId for "Draw 1" logic here as per description in cards.ts
                drawCards(state, playerId, 1);
                addLog(state, `${player.name}は武器を研いだ（1枚ドロー）。`);
            }

            // Phoenix Down (Auto Revive)
            if (card.effectId === 'auto_revive') {
                if (!player.statusEffects) player.statusEffects = [];
                player.statusEffects.push({ id: `revive-${Date.now()}`, type: 'auto_revive', name: 'リレイズ', value: 1, duration: 99 });
                addLog(state, `${player.name}にリレイズ効果が付与された！`);
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
            player.equipment.armorDurability = card.durability !== undefined ? card.durability : 3; // Default 3
            // player.discardPile.pop(); // Removed because we no longer add armor to discard pile by default
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

        case 'field':
            // Set Field
            state.field = {
                cardId: card.id,
                effectId: card.effectId || '',
                name: card.name
            };
            addLog(state, `フィールドが「${card.name}」になった！`);
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

    // Trap Check: Anti-Ultimate (Light Seal)
    if (state.traps) {
        const trapIndex = state.traps.findIndex(t => t.ownerId === opponentId && t.effectId === 'trap_anti_ultimate');
        if (trapIndex !== -1) {
            const trap = state.traps[trapIndex];
            state.traps.splice(trapIndex, 1); // Remove trap
            addLog(state, `罠発動！「${trap.name}」がアルティメットを封じた！`);
            checkWinCondition(state);
            return { ...state }; // Stop processing
        }
    }

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

    } else if (avatar.ultimateId === 'ultimate_trickster_showtime') {
        // Loki: Draw 3, Cost 0 for those cards
        const initialHandSize = player.hand.length;
        drawCards(state, playerId, 3);
        const newCards = player.hand.slice(initialHandSize);

        if (!state.turnState.freeCardIds) state.turnState.freeCardIds = [];
        state.turnState.freeCardIds.push(...newCards);

        addLog(state, `${player.name}はショータイムを開始した！(3枚ドロー＆そのカードはコスト0)`);
    }

    checkWinCondition(state);
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

    // Check Strong
    if ((atkIdx + 1) % 4 === defIdx) return 2.0; // e.g. Fire(0) vs Wind(1) -> Strong!

    // Check Weak (Reverse)
    if ((defIdx + 1) % 4 === atkIdx) return 0.5; // e.g. Water(3) vs Fire(0) -> Weak.

    return 1.0;
}

export function endTurn(state: GameState): GameState {
    if (state.winner) return state;

    const playerIds = Object.keys(state.players);
    const currentIdx = playerIds.indexOf(state.turnPlayerId);
    const nextPlayerId = playerIds[(currentIdx + 1) % playerIds.length];

    state.turnPlayerId = nextPlayerId;
    state.turnCount++;

    // Reset Turn State
    state.turnState = {
        hasAttacked: false,
        hasDiscarded: false,
        cardsPlayedCount: 0,
        manaChargeCount: 0,
        freeCardIds: []
    };

    const currentPlayer = state.players[nextPlayerId];
    if (!currentPlayer.manaZone) currentPlayer.manaZone = [];

    // Field Effects
    if (state.field?.effectId === 'field_sanctuary') {
        currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + 1);
        addLog(state, `聖域の効果で${currentPlayer.name}のHPが1回復した。`);
    }
    if (state.field?.effectId === 'field_mana_spring') {
        currentPlayer.mp = Math.min(currentPlayer.maxMp, currentPlayer.mp + 1);
        addLog(state, `マナの泉の効果で${currentPlayer.name}のMPが1回復した。`);
    }

    // Passive Graveyard Effect: Regenerating Slime
    if (currentPlayer.discardPile) {
        const slimeCount = currentPlayer.discardPile.filter(id => CARDS[id].effectId === 'passive_regen_slime').length;
        if (slimeCount > 0) {
            currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + slimeCount);
            addLog(state, `${currentPlayer.name}は墓地のスライムの効果でHPが${slimeCount}回復した。`);
        }
    }

    // Equipment Regen
    if (
        (currentPlayer.equipment?.weapon && CARDS[currentPlayer.equipment.weapon].effectId === 'regen_equip') ||
        (currentPlayer.equipment?.armor && CARDS[currentPlayer.equipment.armor].effectId === 'regen_equip')
    ) {
        currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + 1);
        addLog(state, `${currentPlayer.name}は装備の効果でHPが1回復した。`);
    }

    // Status Effects
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
    if (currentPlayer.equipment?.enchantment && CARDS[currentPlayer.equipment.enchantment].effectId === 'draw_plus_1') {
        drawCount += 1;
        addLog(state, `${currentPlayer.name}は疾風のブーツの効果で追加ドロー！`);
    }
    if (AVATARS[currentPlayer.avatarId].passiveId === 'lucky_charm' && Math.random() < 0.2) {
        drawCount += 1;
        addLog(state, `${currentPlayer.name}の幸運が発動！追加ドロー！`);
    }

    drawCards(state, nextPlayerId, drawCount);
    addLog(state, `${currentPlayer.name}のターン (${state.turnCount}ターン目)`);

    return { ...state };
}

export function manaCharge(state: GameState, playerId: string, cardIndices: number[]): GameState {
    const newState = JSON.parse(JSON.stringify(state));
    const player = newState.players[playerId];

    if (!player || !player.hand) return state;

    // Check limit
    const currentChargeCount = newState.turnState.manaChargeCount || 0;
    if (currentChargeCount + cardIndices.length > 3) {
        return state; // Exceeds limit
    }

    // Sort indices descending to remove from end first (prevents shifting issues)
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);

    // Process each card
    sortedIndices.forEach((index) => {
        if (index >= 0 && index < player.hand.length) {
            const cardId = player.hand[index]; // Get ID before splicing
            player.hand.splice(index, 1); // Remove from hand

            // Add to Mana Zone
            if (!player.manaZone) player.manaZone = [];
            player.manaZone.push(cardId);

            player.mp += 1;
            // if (player.mp > player.maxMp) player.mp = player.maxMp; // Allow MP to exceed max? Usually no, but mana charge increases capacity in some games. Here let's stick to maxMp or maybe increase maxMp?
            // "Mana Charge" usually implies increasing capacity in Duel Masters, but here it says "MP+1". 
            // If it's just restoring MP, it shouldn't exceed max. 
            // But if it's "Charge", maybe it increases Max MP too?
            // Let's assume it increases Max MP for now as that's typical for "Mana Zone" mechanics.
            // Wait, previous code was `player.mp += 1`.
            // Let's check `mana_recall` effect (line 541): `player.maxMp = Math.max(0, player.maxMp - 1)`.
            // This implies Mana Zone cards *represent* Max MP.
            // So adding to Mana Zone should increase Max MP.
            // player.maxMp += 1; // Removed as per user request (Recovery only)
            // player.mp += 1; // Removed duplicate increment

            // Update charge count
            newState.turnState.manaChargeCount = (newState.turnState.manaChargeCount || 0) + 1;
        }
    });

    addLog(newState, `${player.name}は${cardIndices.length}枚のカードをマナに変換した。(最大MP+${cardIndices.length})`);

    // Reset mode and selection
    player.isManaChargeMode = false;
    player.selectedForCharge = [];

    return newState;
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

export function toggleManaChargeMode(state: GameState, playerId: string): GameState {
    const newState = JSON.parse(JSON.stringify(state));
    const player = newState.players[playerId];
    if (!player) return state;

    player.isManaChargeMode = !player.isManaChargeMode;
    player.selectedForCharge = []; // Reset selection when toggling

    return newState;
}

export function selectCardForCharge(state: GameState, playerId: string, handIndex: number): GameState {
    const newState = JSON.parse(JSON.stringify(state));
    const player = newState.players[playerId];
    if (!player || !player.isManaChargeMode) return state;

    if (!player.selectedForCharge) player.selectedForCharge = [];

    const index = player.selectedForCharge.indexOf(handIndex);
    if (index === -1) {
        // Add if not selected (Max 3)
        if (player.selectedForCharge.length < 3) {
            player.selectedForCharge.push(handIndex);
        }
    } else {
        // Remove if already selected
        player.selectedForCharge.splice(index, 1);
    }

    return newState;
}
