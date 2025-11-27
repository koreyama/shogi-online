import { Card } from '../types';

export const CARDS: Record<string, Card> = {
    // Weapons
    w001: { id: 'w001', name: '銅の剣', type: 'weapon', cost: 1, value: 2, element: 'none', description: '一般的な剣。', rarity: 'common' },
    w002: { id: 'w002', name: '鉄の剣', type: 'weapon', cost: 2, value: 3, element: 'none', description: '鋭い切れ味の剣。', rarity: 'common' },
    w003: { id: 'w003', name: '鋼の剣', type: 'weapon', cost: 3, value: 4, element: 'none', description: '熟練の戦士が使う剣。', rarity: 'rare' },
    w004: { id: 'w004', name: '魔法の杖', type: 'weapon', cost: 2, value: 2, element: 'none', description: '魔力を帯びた杖。', rarity: 'common' },
    w005: { id: 'w005', name: '短剣', type: 'weapon', cost: 1, value: 2, element: 'none', description: '素早い攻撃が可能。', rarity: 'common' },
    w006: { id: 'w006', name: '毒塗りの刃', type: 'weapon', cost: 3, value: 2, element: 'none', description: '攻撃時、相手を毒状態にする。', rarity: 'rare' },
    w007: { id: 'w007', name: 'ロングボウ', type: 'weapon', cost: 3, value: 3, element: 'wind', description: '遠距離から攻撃できる弓。風属性。', rarity: 'rare' },
    w008: { id: 'w008', name: 'バトルアックス', type: 'weapon', cost: 4, value: 5, element: 'none', description: '重い一撃を放つ斧。', rarity: 'common' },
    w009: { id: 'w009', name: 'ダガー', type: 'weapon', cost: 1, value: 1, element: 'none', description: '扱いやすい短剣。コストが低い。', rarity: 'common' },
    w010: { id: 'w010', name: 'ミスリルソード', type: 'weapon', cost: 5, value: 6, element: 'none', description: '伝説の金属で作られた剣。', rarity: 'legendary' },
    w011: { id: 'w011', name: 'ウォーハンマー', type: 'weapon', cost: 4, value: 5, element: 'earth', description: '巨大なハンマー。土属性。', rarity: 'rare' },

    // New Elemental Weapons
    w012: { id: 'w012', name: 'フレイムソード', type: 'weapon', cost: 3, value: 4, element: 'fire', description: '炎を纏った剣。火属性。', rarity: 'rare' },
    w013: { id: 'w013', name: 'アイススピア', type: 'weapon', cost: 3, value: 4, element: 'water', description: '冷気を放つ槍。水属性。', rarity: 'rare' },
    w014: { id: 'w014', name: 'ゲイルダガー', type: 'weapon', cost: 2, value: 3, element: 'wind', description: '風のように素早い短剣。風属性。', rarity: 'rare' },
    w015: { id: 'w015', name: 'ガイアハンマー', type: 'weapon', cost: 4, value: 6, element: 'earth', description: '大地を揺るがすハンマー。土属性。', rarity: 'rare' },
    w016: { id: 'w016', name: 'ホーリーランス', type: 'weapon', cost: 5, value: 5, element: 'holy', description: '聖なる光を宿した槍。聖属性。', rarity: 'legendary' },
    w017: { id: 'w017', name: 'カースサイズ', type: 'weapon', cost: 5, value: 6, element: 'dark', description: '呪われた大鎌。闇属性。', rarity: 'legendary' },

    // Armors
    a001: { id: 'a001', name: '皮の盾', type: 'armor', cost: 1, value: 1, element: 'none', description: '簡易的な盾。', durability: 3, rarity: 'common' },
    a002: { id: 'a002', name: '鉄の盾', type: 'armor', cost: 2, value: 2, element: 'none', description: '頑丈な鉄の盾。', durability: 4, rarity: 'common' },
    a003: { id: 'a003', name: '魔法のローブ', type: 'armor', cost: 2, value: 1, element: 'none', description: '魔法防御に優れたローブ。', durability: 3, rarity: 'rare' },
    a004: { id: 'a004', name: '騎士の鎧', type: 'armor', cost: 4, value: 4, element: 'none', description: '全身を守る鎧。', durability: 5, rarity: 'rare' },
    a005: { id: 'a005', name: 'ドラゴンスケイル', type: 'armor', cost: 6, value: 5, element: 'fire', description: '竜の鱗で作られた鎧。火属性。', durability: 6, rarity: 'legendary' },
    a006: { id: 'a006', name: '皮の鎧', type: 'armor', cost: 2, value: 2, element: 'none', description: '動きやすい鎧。', durability: 3, rarity: 'common' },
    a007: { id: 'a007', name: 'プレートメイル', type: 'armor', cost: 5, value: 5, element: 'none', description: '分厚い板金鎧。', durability: 5, rarity: 'rare' },

    // New Elemental Armors
    a008: { id: 'a008', name: 'フレイムメイル', type: 'armor', cost: 3, value: 3, element: 'fire', description: '炎の加護を受けた鎧。火属性。', durability: 4, rarity: 'rare' },
    a009: { id: 'a009', name: 'アイスプレート', type: 'armor', cost: 3, value: 3, element: 'water', description: '氷の結晶で作られた鎧。水属性。', durability: 4, rarity: 'rare' },
    a010: { id: 'a010', name: 'ウィンドローブ', type: 'armor', cost: 2, value: 2, element: 'wind', description: '風を纏うローブ。風属性。', durability: 3, rarity: 'rare' },
    a011: { id: 'a011', name: 'アースアーマー', type: 'armor', cost: 4, value: 5, element: 'earth', description: '大地の力を宿した鎧。土属性。', durability: 5, rarity: 'rare' },

    // Magic
    m001: { id: 'm001', name: 'ファイアボール', type: 'magic', cost: 2, value: 3, element: 'fire', description: '火の玉を放つ。火属性。', rarity: 'common' },
    m002: { id: 'm002', name: 'アイスランス', type: 'magic', cost: 2, value: 3, element: 'water', description: '氷の槍を放つ。水属性。', rarity: 'common' },
    m003: { id: 'm003', name: 'サンダーボルト', type: 'magic', cost: 3, value: 4, element: 'wind', description: '雷を落とす。風属性。', rarity: 'common' },
    m004: { id: 'm004', name: 'ヒール', type: 'magic', cost: 2, value: 3, element: 'holy', description: 'HPを3回復する。', rarity: 'common' },
    m005: { id: 'm005', name: 'ホーリーライト', type: 'magic', cost: 4, value: 5, element: 'holy', description: '聖なる光で攻撃/回復。聖属性。', rarity: 'rare' },
    m006: { id: 'm006', name: 'ドレイン', type: 'magic', cost: 3, value: 2, element: 'dark', description: '相手のHPを吸収する。闇属性。', rarity: 'rare' },
    m007: { id: 'm007', name: 'メテオ', type: 'magic', cost: 7, value: 8, element: 'fire', description: '隕石を落とす強力な魔法。火属性。', rarity: 'legendary' },
    m008: { id: 'm008', name: 'ポイズン', type: 'magic', cost: 2, value: 0, element: 'dark', description: '相手を毒状態にする。', rarity: 'common' },
    m009: { id: 'm009', name: 'シールドバッシュ', type: 'magic', cost: 2, value: 0, element: 'none', description: '防御力分のダメージを与える。', effectId: 'def_dmg', rarity: 'rare' },
    m010: { id: 'm010', name: 'バーサク', type: 'magic', cost: 3, value: 0, element: 'none', description: '自分に5ダメージ、相手に10ダメージ。', effectId: 'buff_atk_3', rarity: 'rare' },
    m011: { id: 'm011', name: 'ウィンドカッター', type: 'magic', cost: 2, value: 3, element: 'wind', description: '風の刃で切り裂く。風属性。', rarity: 'common' },
    m012: { id: 'm012', name: 'アースクエイク', type: 'magic', cost: 5, value: 6, element: 'earth', description: '地震を起こす。土属性。', rarity: 'rare' },
    m013: { id: 'm013', name: 'ホーリーレイ', type: 'magic', cost: 5, value: 6, element: 'holy', description: '聖なる光線。聖属性。', rarity: 'rare' },

    // New High Tier Magic
    m014: { id: 'm014', name: 'インフェルノ', type: 'magic', cost: 6, value: 8, element: 'fire', description: '地獄の業火で焼き尽くす。火属性。', rarity: 'legendary' },
    m015: { id: 'm015', name: 'ブリザード', type: 'magic', cost: 6, value: 6, element: 'water', description: '猛吹雪。凍結効果あり。水属性。', rarity: 'legendary' },
    m016: { id: 'm016', name: 'トルネード', type: 'magic', cost: 4, value: 4, element: 'wind', description: '巨大な竜巻。風属性。', rarity: 'rare' },
    m017: { id: 'm017', name: 'クエイク', type: 'magic', cost: 5, value: 7, element: 'earth', description: '大地を割る。土属性。', rarity: 'rare' },
    m018: { id: 'm018', name: 'ジャッジメント', type: 'magic', cost: 7, value: 10, element: 'holy', description: '神の裁き。聖属性。', rarity: 'legendary' },
    m019: { id: 'm019', name: 'アビス', type: 'magic', cost: 7, value: 10, element: 'dark', description: '深淵の闇。闇属性。', rarity: 'legendary' },

    // Items
    i001: { id: 'i001', name: '薬草', type: 'item', cost: 1, value: 2, element: 'none', description: 'HPを2回復する。', rarity: 'common' },
    i002: { id: 'i002', name: 'ポーション', type: 'item', cost: 2, value: 5, element: 'none', description: 'HPを5回復する。', rarity: 'common' },
    i003: { id: 'i003', name: 'マナ水', type: 'item', cost: 1, value: 2, element: 'none', description: 'MPを2回復する。', rarity: 'common' },
    i004: { id: 'i004', name: 'エリクサー', type: 'item', cost: 5, value: 99, element: 'none', description: 'HPとMPを全回復する。', rarity: 'legendary' },
    i005: { id: 'i005', name: '煙玉', type: 'item', cost: 1, value: 0, element: 'none', description: '緊急回避（HP1回復）。', rarity: 'common' },
    i006: { id: 'i006', name: '砥石', type: 'item', cost: 1, value: 0, element: 'none', description: '武器を研ぐ（1枚ドロー）。', effectId: 'buff_next_2', rarity: 'common' },

    // Enchantments
    e001: { id: 'e001', name: '攻撃強化', type: 'enchantment', cost: 2, value: 0, element: 'none', description: '攻撃力が2上がる。', effectId: 'buff_atk_2', rarity: 'rare' },
    e002: { id: 'e002', name: '魔法強化', type: 'enchantment', cost: 2, value: 0, element: 'none', description: '魔法威力が2上がる。', effectId: 'buff_magic_2', rarity: 'rare' },
    e003: { id: 'e003', name: '防御強化', type: 'enchantment', cost: 2, value: 0, element: 'none', description: '受けるダメージを2軽減する。', effectId: 'buff_def_2', rarity: 'rare' },
    e004: { id: 'e004', name: '吸血の指輪', type: 'enchantment', cost: 4, value: 0, element: 'dark', description: '攻撃時にHPを1回復する。', effectId: 'drain_1', rarity: 'legendary' },
    e005: { id: 'e005', name: '疾風のブーツ', type: 'enchantment', cost: 3, value: 0, element: 'wind', description: '毎ターンカードを1枚多く引く。', effectId: 'draw_plus_1', rarity: 'legendary' },

    // New Cards
    w018: { id: 'w018', name: 'ドラゴンキラー', type: 'weapon', cost: 4, value: 5, element: 'none', description: '竜族に大ダメージを与える剣。', rarity: 'rare' },
    w019: { id: 'w019', name: 'アサシンダガー', type: 'weapon', cost: 3, value: 4, element: 'dark', description: '急所を狙う短剣。稀に即死効果。', rarity: 'rare' },

    a012: { id: 'a012', name: 'イージスの盾', type: 'armor', cost: 5, value: 4, element: 'holy', description: 'あらゆる魔法を防ぐ盾。聖属性。', durability: 5, rarity: 'legendary' },
    a013: { id: 'a013', name: '幻影のマント', type: 'armor', cost: 3, value: 2, element: 'wind', description: '攻撃を回避しやすくなるマント。風属性。', durability: 3, rarity: 'rare' },

    m020: { id: 'm020', name: 'リフレク', type: 'magic', cost: 3, value: 0, element: 'none', description: '魔法を跳ね返すバリアを張る。', effectId: 'buff_reflect', rarity: 'rare' },
    m021: { id: 'm021', name: 'グラビデ', type: 'magic', cost: 4, value: 0, element: 'dark', description: '相手のHPを半分にする。', effectId: 'gravity', rarity: 'rare' },
    m022: { id: 'm022', name: 'ヘイスト', type: 'magic', cost: 3, value: 0, element: 'wind', description: '行動速度が上がる（2回行動）。', effectId: 'buff_haste', rarity: 'rare' },

    i007: { id: 'i007', name: '万能薬', type: 'item', cost: 2, value: 0, element: 'none', description: '全ての状態異常を回復する。', effectId: 'cure_all', rarity: 'common' },
    i008: { id: 'i008', name: 'フェニックスの尾', type: 'item', cost: 4, value: 0, element: 'holy', description: 'HP0になった時に一度だけ復活する。', effectId: 'auto_revive', rarity: 'rare' }
};

export const CARD_LIST = Object.values(CARDS);
