import { Avatar } from '../types';

export const AVATARS: Record<string, Avatar> = {
    'warrior_god': {
        id: 'warrior_god',
        name: '戦神アレス',
        description: '武勇を司る神。高い体力と物理攻撃への適性を持つ。',
        baseHp: 50,
        baseMp: 3,
        passiveId: 'warrior_spirit',
        passiveName: '闘争心',
        passiveDescription: '物理攻撃カードのダメージ+1',
        defaultDeckId: 'deck_warrior_starter'
    },
    'mage_god': {
        id: 'mage_god',
        name: '魔神オーディン',
        description: '知識と魔法を司る神。豊富な魔力で強力な魔法を操る。',
        baseHp: 30,
        baseMp: 10,
        passiveId: 'arcane_mastery',
        passiveName: '魔力節約',
        passiveDescription: '魔法カードの消費MP-1（最低1）',
        defaultDeckId: 'deck_mage_starter'
    },
    'trickster_god': {
        id: 'trickster_god',
        name: '道化神ロキ',
        description: '変幻自在のトリックスター。バランスの取れた能力を持つ。',
        baseHp: 40,
        baseMp: 5,
        passiveId: 'lucky_charm',
        passiveName: '幸運',
        passiveDescription: 'ドロー時に低確率で追加カードを引く',
        defaultDeckId: 'deck_trickster_starter'
    }
};

export const AVATAR_LIST = Object.values(AVATARS);
