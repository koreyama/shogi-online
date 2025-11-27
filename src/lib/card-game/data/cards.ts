import { Card } from '../types';

export const CARDS: Record<string, Card> = {
    // WEAPONS
    'w001': { id: 'w001', name: '銅の剣', type: 'weapon', element: 'none', value: 3, cost: 0, description: '一般的な剣。', rarity: 'common' },
    'w002': { id: 'w002', name: '鉄の斧', type: 'weapon', element: 'none', value: 5, cost: 0, description: '重いが威力のある斧。', rarity: 'common' },
    'w003': { id: 'w003', name: '炎の剣', type: 'weapon', element: 'fire', value: 6, cost: 1, description: '炎を纏った剣。', rarity: 'rare' },
    'w004': { id: 'w004', name: '氷の槍', type: 'weapon', element: 'water', value: 6, cost: 1, description: '凍てつく槍。', rarity: 'rare' },
    'w005': { id: 'w005', name: '聖なる弓', type: 'weapon', element: 'holy', value: 4, cost: 0, description: '邪悪を射抜く弓。', rarity: 'rare' },
    'w006': { id: 'w006', name: '魔剣グラム', type: 'weapon', element: 'dark', value: 10, cost: 3, description: '伝説の魔剣。', rarity: 'legendary' },
    'w007': { id: 'w007', name: 'エクスカリバー', type: 'weapon', element: 'holy', value: 12, cost: 4, description: '選ばれし者の剣。', rarity: 'legendary' },

    'w008': { id: 'w008', name: '大斧', type: 'weapon', element: 'none', value: 8, cost: 3, description: '威力は高いが隙が大きい斧。', rarity: 'common' },
    'w009': { id: 'w009', name: 'ダガー', type: 'weapon', element: 'none', value: 2, cost: 0, description: '素早い攻撃。カードを1枚引く。', rarity: 'common', effectId: 'draw_1' },

    // ARMORS
    'a001': { id: 'a001', name: '木の盾', type: 'armor', element: 'none', value: 2, cost: 0, description: '簡易的な盾。', rarity: 'common' },
    'a002': { id: 'a002', name: '鉄の盾', type: 'armor', element: 'none', value: 4, cost: 0, description: '頑丈な盾。', rarity: 'common' },
    'a003': { id: 'a003', name: '魔法のローブ', type: 'armor', element: 'none', value: 3, cost: 1, description: '魔法防御に優れる。', rarity: 'rare' },
    'a004': { id: 'a004', name: '炎の盾', type: 'armor', element: 'fire', value: 5, cost: 1, description: '炎を防ぐ盾。', rarity: 'rare' },
    'a005': { id: 'a005', name: 'イージスの盾', type: 'armor', element: 'holy', value: 10, cost: 3, description: 'あらゆる厄災を防ぐ神の盾。', rarity: 'legendary' },

    // MAGIC
    'm001': { id: 'm001', name: 'ファイア', type: 'magic', element: 'fire', value: 5, cost: 2, description: '敵に炎ダメージを与える。', rarity: 'common' },
    'm002': { id: 'm002', name: 'ブリザド', type: 'magic', element: 'water', value: 5, cost: 2, description: '敵に氷ダメージを与える。', rarity: 'common' },
    'm003': { id: 'm003', name: 'サンダー', type: 'magic', element: 'wind', value: 6, cost: 3, description: '敵に雷ダメージを与える。', rarity: 'common' },
    'm004': { id: 'm004', name: 'ヒール', type: 'magic', element: 'holy', value: 5, cost: 3, description: 'HPを5回復する。', rarity: 'common' },
    'm005': { id: 'm005', name: 'ハイヒール', type: 'magic', element: 'holy', value: 10, cost: 5, description: 'HPを10回復する。', rarity: 'rare' },
    'm006': { id: 'm006', name: 'ドレイン', type: 'magic', element: 'dark', value: 4, cost: 3, description: '敵のHPを吸収する。', rarity: 'rare' },
    'm007': { id: 'm007', name: 'メテオ', type: 'magic', element: 'fire', value: 15, cost: 8, description: '隕石を落とし大ダメージ。', rarity: 'legendary' },
    'm008': { id: 'm008', name: 'ポイズン', type: 'magic', element: 'dark', value: 2, cost: 2, description: '毒霧で攻撃。カードを1枚引く。', rarity: 'common', effectId: 'draw_1' },
    'm009': { id: 'm009', name: 'シールドバッシュ', type: 'magic', element: 'earth', value: 0, cost: 2, description: '防御力分のダメージを与える。', rarity: 'rare', effectId: 'def_dmg' },
    'm010': { id: 'm010', name: 'バーサク', type: 'magic', element: 'fire', value: 3, cost: 2, description: '攻撃力を3上げる（永続）。', rarity: 'rare', effectId: 'buff_atk_3' },

    // ITEMS
    'i001': { id: 'i001', name: '薬草', type: 'item', element: 'none', value: 3, cost: 0, description: 'HPを3回復する。', rarity: 'common' },
    'i002': { id: 'i002', name: 'ポーション', type: 'item', element: 'none', value: 5, cost: 0, description: 'HPを5回復する。', rarity: 'common' },
    'i003': { id: 'i003', name: 'マジックウォーター', type: 'item', element: 'none', value: 3, cost: 0, description: 'MPを3回復する。', rarity: 'common' },
    'i004': { id: 'i004', name: 'エリクサー', type: 'item', element: 'none', value: 99, cost: 0, description: 'HPとMPを全回復する。', rarity: 'legendary' },
    'i005': { id: 'i005', name: '煙玉', type: 'item', element: 'wind', value: 2, cost: 1, description: 'HPを2回復し、カードを1枚引く。', rarity: 'common', effectId: 'draw_1' },

    // ENCHANTMENTS
    'e001': { id: 'e001', name: '力の指輪', type: 'enchantment', element: 'none', value: 2, cost: 0, description: '物理攻撃力が2上がる。', rarity: 'rare', effectId: 'buff_atk_2' },
    'e002': { id: 'e002', name: '守りの指輪', type: 'enchantment', element: 'none', value: 2, cost: 0, description: '防御力が2上がる。', rarity: 'rare', effectId: 'buff_def_2' },
    'e003': { id: 'e003', name: 'リジェネ', type: 'enchantment', element: 'holy', value: 1, cost: 2, description: '毎ターンHPが1回復する。', rarity: 'rare', effectId: 'regen_1' },
    'e004': { id: 'e004', name: '吸血の指輪', type: 'enchantment', element: 'dark', value: 1, cost: 2, description: '攻撃時にHPを1回復する。', rarity: 'rare', effectId: 'drain_1' },
};

export const CARD_LIST = Object.values(CARDS);
