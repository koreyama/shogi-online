import { Card } from '../types';

export const CARDS: Record<string, Card> = {
    // Weapons
    w001: { id: 'w001', name: '銅の剣', type: 'weapon', cost: 1, value: 1, element: 'none', description: '一般的な剣。', rarity: 'common' }, // Nerfed value 2->1
    w002: { id: 'w002', name: '鉄の剣', type: 'weapon', cost: 2, value: 3, element: 'none', description: '鋭い切れ味の剣。', rarity: 'common' },
    w003: { id: 'w003', name: '鋼の剣', type: 'weapon', cost: 3, value: 5, element: 'none', description: '熟練の戦士が使う剣。', rarity: 'rare' }, // Buffed value 4->5
    w004: { id: 'w004', name: '魔法の杖', type: 'weapon', cost: 2, value: 2, element: 'none', description: '魔力を帯びた杖。', rarity: 'common' },
    w005: { id: 'w005', name: '短剣', type: 'weapon', cost: 1, value: 2, element: 'none', description: '素早い攻撃が可能。', rarity: 'common' },
    w006: { id: 'w006', name: '毒塗りの刃', type: 'weapon', cost: 3, value: 2, element: 'none', description: '攻撃時、相手を毒状態にする。', rarity: 'rare' },
    w007: { id: 'w007', name: 'ロングボウ', type: 'weapon', cost: 3, value: 3, element: 'wind', description: '遠距離から攻撃できる弓。風属性。', rarity: 'rare' },
    w008: { id: 'w008', name: 'バトルアックス', type: 'weapon', cost: 4, value: 5, element: 'none', description: '重い一撃を放つ斧。', rarity: 'common' },
    // w009 Removed (Redundant Dagger)
    w010: { id: 'w010', name: 'ミスリルソード', type: 'weapon', cost: 5, value: 6, element: 'none', description: '伝説の金属で作られた剣。', rarity: 'legendary' },
    w011: { id: 'w011', name: 'ウォーハンマー', type: 'weapon', cost: 4, value: 5, element: 'earth', description: '巨大なハンマー。土属性。', rarity: 'rare' },

    // Elemental Weapons
    w012: { id: 'w012', name: 'フレイムソード', type: 'weapon', cost: 3, value: 4, element: 'fire', description: '炎を纏った剣。火属性。', rarity: 'rare' },
    w013: { id: 'w013', name: 'アイススピア', type: 'weapon', cost: 3, value: 4, element: 'water', description: '冷気を放つ槍。水属性。', rarity: 'rare' },
    w014: { id: 'w014', name: 'ゲイルダガー', type: 'weapon', cost: 2, value: 3, element: 'wind', description: '風のように素早い短剣。風属性。', rarity: 'rare' },
    w015: { id: 'w015', name: 'ガイアハンマー', type: 'weapon', cost: 4, value: 6, element: 'earth', description: '大地を揺るがすハンマー。土属性。', rarity: 'rare' },
    w016: { id: 'w016', name: 'ホーリーランス', type: 'weapon', cost: 5, value: 5, element: 'holy', description: '聖なる光を宿した槍。聖属性。', rarity: 'legendary' },
    w017: { id: 'w017', name: 'カースサイズ', type: 'weapon', cost: 5, value: 6, element: 'dark', description: '呪われた大鎌。闇属性。', rarity: 'legendary' },
    w018: { id: 'w018', name: 'ドラゴンキラー', type: 'weapon', cost: 4, value: 5, element: 'none', description: '竜族に大ダメージを与える剣。', rarity: 'rare' },
    w019: { id: 'w019', name: 'アサシンダガー', type: 'weapon', cost: 3, value: 4, element: 'dark', description: '急所を狙う短剣。稀に即死効果。', rarity: 'rare' },

    // New Weapons
    w020: { id: 'w020', name: 'ヴァンパイアソード', type: 'weapon', cost: 4, value: 4, element: 'dark', description: '攻撃時にHPを1回復する。', effectId: 'drain_attack', rarity: 'rare' },
    w021: { id: 'w021', name: '忍者刀', type: 'weapon', cost: 2, value: 3, element: 'none', description: '攻撃時、20%の確率で毒を与える。', effectId: 'poison_chance_20', rarity: 'common' },
    w022: { id: 'w022', name: '貫通の槍', type: 'weapon', cost: 3, value: 3, element: 'none', description: '相手の防御力を無視してダメージを与える。', effectId: 'pierce', rarity: 'rare' },
    w023: { id: 'w023', name: '巨人の斧', type: 'weapon', cost: 5, value: 8, element: 'earth', description: '強力だが、攻撃時に自分も2ダメージ受ける。', effectId: 'recoil_2', rarity: 'rare' },
    w024: { id: 'w024', name: '聖騎士の剣', type: 'weapon', cost: 4, value: 4, element: 'holy', description: '装備中、ターン終了時にHP1回復。', effectId: 'regen_equip', rarity: 'rare' },

    // Armors
    a001: { id: 'a001', name: '皮の盾', type: 'armor', cost: 1, value: 1, element: 'none', description: '簡易的な盾。', durability: 3, rarity: 'common' },
    a002: { id: 'a002', name: '鉄の盾', type: 'armor', cost: 2, value: 2, element: 'none', description: '頑丈な鉄の盾。', durability: 4, rarity: 'common' },
    a003: { id: 'a003', name: '魔法のローブ', type: 'armor', cost: 2, value: 1, element: 'none', description: '魔法防御に優れたローブ。', durability: 3, rarity: 'rare' },
    a004: { id: 'a004', name: '騎士の鎧', type: 'armor', cost: 4, value: 4, element: 'none', description: '全身を守る鎧。', durability: 5, rarity: 'rare' },
    a005: { id: 'a005', name: 'ドラゴンスケイル', type: 'armor', cost: 6, value: 5, element: 'fire', description: '竜の鱗で作られた鎧。火属性。', durability: 6, rarity: 'legendary' },
    a006: { id: 'a006', name: '皮の鎧', type: 'armor', cost: 2, value: 2, element: 'none', description: '動きやすい鎧。', durability: 3, rarity: 'common' },
    a007: { id: 'a007', name: 'プレートメイル', type: 'armor', cost: 5, value: 5, element: 'none', description: '分厚い板金鎧。', durability: 5, rarity: 'rare' },

    // Elemental Armors
    a008: { id: 'a008', name: 'フレイムメイル', type: 'armor', cost: 3, value: 3, element: 'fire', description: '炎の加護を受けた鎧。火属性。', durability: 4, rarity: 'rare' },
    a009: { id: 'a009', name: 'アイスプレート', type: 'armor', cost: 3, value: 3, element: 'water', description: '氷の結晶で作られた鎧。水属性。', durability: 4, rarity: 'rare' },
    a010: { id: 'a010', name: 'ウィンドローブ', type: 'armor', cost: 2, value: 2, element: 'wind', description: '風を纏うローブ。風属性。', durability: 3, rarity: 'rare' },
    a011: { id: 'a011', name: 'アースアーマー', type: 'armor', cost: 4, value: 5, element: 'earth', description: '大地の力を宿した鎧。土属性。', durability: 5, rarity: 'rare' },
    a012: { id: 'a012', name: 'イージスの盾', type: 'armor', cost: 5, value: 4, element: 'holy', description: 'あらゆる魔法を防ぐ盾。聖属性。', durability: 5, rarity: 'legendary' },
    a013: { id: 'a013', name: '幻影のマント', type: 'armor', cost: 3, value: 2, element: 'wind', description: '攻撃を回避しやすくなるマント。風属性。', durability: 3, rarity: 'rare' },

    // New Armors
    a014: { id: 'a014', name: 'スパイクシールド', type: 'armor', cost: 3, value: 3, element: 'none', description: '攻撃してきた相手に1ダメージを与える。', durability: 4, effectId: 'thorns', rarity: 'rare' },
    a015: { id: 'a015', name: 'リジェネアーマー', type: 'armor', cost: 4, value: 2, element: 'holy', description: 'ターン終了時にHPを1回復する。', durability: 5, effectId: 'regen_equip', rarity: 'rare' },

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
    m014: { id: 'm014', name: 'インフェルノ', type: 'magic', cost: 6, value: 8, element: 'fire', description: '地獄の業火で焼き尽くす。火属性。', rarity: 'legendary' },
    m015: { id: 'm015', name: 'ブリザード', type: 'magic', cost: 6, value: 6, element: 'water', description: '猛吹雪。凍結効果あり。水属性。', rarity: 'legendary' },
    m016: { id: 'm016', name: 'トルネード', type: 'magic', cost: 4, value: 4, element: 'wind', description: '巨大な竜巻。風属性。', rarity: 'rare' },
    m017: { id: 'm017', name: 'クエイク', type: 'magic', cost: 5, value: 7, element: 'earth', description: '大地を割る。土属性。', rarity: 'rare' },
    m018: { id: 'm018', name: 'ジャッジメント', type: 'magic', cost: 7, value: 10, element: 'holy', description: '神の裁き。聖属性。', rarity: 'legendary' },
    m019: { id: 'm019', name: 'アビス', type: 'magic', cost: 7, value: 10, element: 'dark', description: '深淵の闇。闇属性。', rarity: 'legendary' },
    m020: { id: 'm020', name: 'リフレク', type: 'magic', cost: 3, value: 0, element: 'none', description: '魔法を跳ね返すバリアを張る。', effectId: 'buff_reflect', rarity: 'rare' },
    m021: { id: 'm021', name: 'グラビデ', type: 'magic', cost: 4, value: 0, element: 'dark', description: '相手のHPを半分にする。', effectId: 'gravity', rarity: 'rare' },
    m022: { id: 'm022', name: 'ヘイスト', type: 'magic', cost: 3, value: 0, element: 'wind', description: '行動速度が上がる（2回行動）。', effectId: 'buff_haste', rarity: 'rare' },

    // New Magic
    m023: { id: 'm023', name: '血の儀式', type: 'magic', cost: 0, value: 0, element: 'dark', description: 'HPを3消費して、MPを3回復する。', effectId: 'blood_ritual', rarity: 'rare' },
    m024: { id: 'm024', name: 'ライフスティール', type: 'magic', cost: 3, value: 3, element: 'dark', description: '相手にダメージを与え、同じ量だけ回復する。', effectId: 'life_steal', rarity: 'rare' },
    m025: { id: 'm025', name: 'ギャンブル', type: 'magic', cost: 2, value: 0, element: 'none', description: '1〜10のランダムなダメージを与える。', effectId: 'gamble', rarity: 'common' },
    m026: { id: 'm026', name: '鉄壁', type: 'magic', cost: 2, value: 0, element: 'earth', description: '次のターンまで防御力が+5される。', effectId: 'buff_armor_5', rarity: 'common' },
    m027: { id: 'm027', name: '瞑想', type: 'magic', cost: 0, value: 0, element: 'none', description: 'MPを2回復する。', effectId: 'meditate', rarity: 'common' },
    m028: { id: 'm028', name: '浄化', type: 'magic', cost: 1, value: 0, element: 'holy', description: '自身の状態異常を全て解除する。', effectId: 'cleanse', rarity: 'common' },
    m029: { id: 'm029', name: 'ファイアストーム', type: 'magic', cost: 5, value: 4, element: 'fire', description: '全体を焼き尽くす。相手に火傷を与える。', effectId: 'burn_all', rarity: 'rare' },
    m030: { id: 'm030', name: '絶対零度', type: 'magic', cost: 5, value: 4, element: 'water', description: '相手を凍結させる。', effectId: 'freeze_hit', rarity: 'rare' },
    m031: { id: 'm031', name: 'マインドブラスト', type: 'magic', cost: 3, value: 2, element: 'wind', description: '相手のHPとMPに2ダメージを与える。', effectId: 'mp_drain', rarity: 'rare' },

    // m042 Time Warp (Rejected)
    m043: { id: 'm043', name: 'ソウルエクスチェンジ', type: 'magic', cost: 6, value: 0, element: 'dark', description: '自分と相手のHPを入れ替える（最大HPまで）。', effectId: 'swap_hp', rarity: 'legendary' },
    // m044 Acid Rain (Rejected)
    m045: { id: 'm045', name: 'マインドクラッシュ', type: 'magic', cost: 3, value: 0, element: 'dark', description: '相手の手札を1枚捨てさせる。', effectId: 'hand_destruct_1', rarity: 'rare' },
    m046: { id: 'm046', name: '神の恵み', type: 'magic', cost: 4, value: 0, element: 'holy', description: '手札が5枚になるまで引く。', effectId: 'draw_until_5', rarity: 'rare' },

    // Items
    i001: { id: 'i001', name: '薬草', type: 'item', cost: 1, value: 2, element: 'none', description: 'HPを2回復する。', rarity: 'common' },
    i002: { id: 'i002', name: 'ポーション', type: 'item', cost: 2, value: 5, element: 'none', description: 'HPを5回復する。', rarity: 'common' },
    i003: { id: 'i003', name: 'マナ水', type: 'item', cost: 0, value: 1, element: 'none', description: 'MPを1回復する。', rarity: 'common' }, // Cost 1->0, Val 2->1
    i004: { id: 'i004', name: 'エリクサー', type: 'item', cost: 5, value: 99, element: 'none', description: 'HPとMPを全回復する。', rarity: 'legendary' },
    i005: { id: 'i005', name: '煙玉', type: 'item', cost: 1, value: 0, element: 'none', description: '緊急回避（HP1回復）。', rarity: 'common' },
    i006: { id: 'i006', name: '砥石', type: 'item', cost: 1, value: 0, element: 'none', description: '武器を研ぐ（1枚ドロー）。', effectId: 'buff_next_2', rarity: 'common' },
    i007: { id: 'i007', name: '万能薬', type: 'item', cost: 2, value: 0, element: 'none', description: '全ての状態異常を回復する。', effectId: 'cure_all', rarity: 'common' },
    i008: { id: 'i008', name: 'フェニックスの尾', type: 'item', cost: 4, value: 0, element: 'holy', description: 'HP0になった時に一度だけ復活する。', effectId: 'auto_revive', rarity: 'rare' },

    // New Items
    i009: { id: 'i009', name: '毒消し草', type: 'item', cost: 1, value: 2, element: 'none', description: '毒を解除し、HPを2回復する。', effectId: 'cure_poison', rarity: 'common' },
    i010: { id: 'i010', name: '爆弾', type: 'item', cost: 2, value: 5, element: 'fire', description: '相手に5ダメージを与える。使い捨て。', effectId: 'bomb', rarity: 'common' },

    // Enchantments
    e001: { id: 'e001', name: '攻撃強化', type: 'enchantment', cost: 2, value: 0, element: 'none', description: '攻撃力が2上がる。', effectId: 'buff_atk_2', rarity: 'rare' },
    e002: { id: 'e002', name: '魔法強化', type: 'enchantment', cost: 2, value: 0, element: 'none', description: '魔法威力が2上がる。', effectId: 'buff_magic_2', rarity: 'rare' },
    e003: { id: 'e003', name: '防御強化', type: 'enchantment', cost: 2, value: 0, element: 'none', description: '受けるダメージを2軽減する。', effectId: 'buff_def_2', rarity: 'rare' },
    e004: { id: 'e004', name: '吸血の指輪', type: 'enchantment', cost: 4, value: 0, element: 'dark', description: '攻撃時にHPを1回復する。', effectId: 'drain_1', rarity: 'legendary' },
    e005: { id: 'e005', name: '疾風のブーツ', type: 'enchantment', cost: 3, value: 0, element: 'wind', description: '毎ターンカードを1枚多く引く。', effectId: 'draw_plus_1', rarity: 'legendary' },

    // New Enchantments
    e006: { id: 'e006', name: '猛毒のエンチャント', type: 'enchantment', cost: 3, value: 0, element: 'dark', description: '武器攻撃時に相手を毒状態にする。', effectId: 'enchant_poison', rarity: 'rare' },
    e007: { id: 'e007', name: '吸魔の指輪', type: 'enchantment', cost: 4, value: 0, element: 'dark', description: '攻撃時にMPを1回復する。', effectId: 'drain_mp_1', rarity: 'rare' },

    // Field Cards
    f001: { id: 'f001', name: '火山', type: 'field', cost: 3, value: 0, element: 'fire', description: 'フィールドを火山にする。炎属性ダメージ+2、水属性ダメージ-2。', effectId: 'field_volcano', rarity: 'rare' },
    f002: { id: 'f002', name: '聖域', type: 'field', cost: 4, value: 0, element: 'holy', description: 'フィールドを聖域にする。ターン終了時にお互いのHPが1回復する。', effectId: 'field_sanctuary', rarity: 'rare' },
    f003: { id: 'f003', name: '濃霧', type: 'field', cost: 2, value: 0, element: 'wind', description: 'フィールドを濃霧にする。物理攻撃のダメージを-1する。', effectId: 'field_fog', rarity: 'common' },
    f004: { id: 'f004', name: 'マナの泉', type: 'field', cost: 3, value: 0, element: 'water', description: 'フィールドをマナの泉にする。ターン終了時にお互いのMPが1回復する。', effectId: 'field_mana_spring', rarity: 'rare' },

    // Trap Cards
    t001: { id: 't001', name: 'カウンタースタンス', type: 'trap', cost: 2, value: 0, element: 'none', description: '【罠】相手が武器攻撃をした時、それを無効化し3ダメージを与える。', effectId: 'trap_counter_attack', rarity: 'rare' },
    t002: { id: 't002', name: '魔法の鏡', type: 'trap', cost: 3, value: 0, element: 'none', description: '【罠】相手が魔法を使用した時、それを無効化し相手に跳ね返す。', effectId: 'trap_reflect_magic', rarity: 'rare' },
    t003: { id: 't003', name: '爆裂ルーン', type: 'trap', cost: 2, value: 0, element: 'fire', description: '【罠】相手がカードを使用した時、相手に3ダメージを与える。', effectId: 'trap_explosive_rune', rarity: 'common' },

    // Necromancy Cards
    m032: { id: 'm032', name: 'ネクロマンシー', type: 'magic', cost: 4, value: 0, element: 'dark', description: '捨て札からランダムな武器を1つ手札に加える。', effectId: 'necromancy_weapon', rarity: 'rare' },
    m033: { id: 'm033', name: 'ソウルバースト', type: 'magic', cost: 3, value: 6, element: 'dark', description: '捨て札を3枚消滅させ、相手に6ダメージを与える。', effectId: 'soul_burst', rarity: 'rare' },
    m034: { id: 'm034', name: '怨念', type: 'magic', cost: 4, value: 0, element: 'dark', description: '捨て札の枚数の半分（切り上げ）のダメージを与える。', effectId: 'grudge_damage', rarity: 'rare' },

    // Combo Cards
    w025: { id: 'w025', name: 'コンボダガー', type: 'weapon', cost: 2, value: 2, element: 'wind', description: 'このターン2枚目以降にプレイすると、ダメージ+2。', effectId: 'combo_dagger', rarity: 'common' },
    m035: { id: 'm035', name: 'チェインライトニング', type: 'magic', cost: 3, value: 3, element: 'wind', description: 'このターン2枚目以降にプレイすると、ダメージが2倍になる。', effectId: 'combo_lightning', rarity: 'rare' },
    m036: { id: 'm036', name: 'フィニッシングムーブ', type: 'magic', cost: 5, value: 5, element: 'fire', description: 'このターン3枚目以降にプレイすると、ダメージが3倍になる。', effectId: 'combo_finisher', rarity: 'legendary' },

    // Graveyard Strategy Cards
    m037: { id: 'm037', name: 'ダークエコー', type: 'magic', cost: 2, value: 2, element: 'dark', description: '墓地にある間、あなたの闇属性魔法のダメージ+1。', effectId: 'passive_dark_boost', rarity: 'rare' },
    m038: { id: 'm038', name: '再生するスライム', type: 'magic', cost: 2, value: 3, element: 'water', description: 'HPを3回復。墓地にある間、ターン開始時にHP1回復。', effectId: 'passive_regen_slime', rarity: 'rare' },
    w026: { id: 'w026', name: 'ボーンブレイド', type: 'weapon', cost: 3, value: 2, element: 'dark', description: '墓地のカード3枚につき攻撃力+1。', effectId: 'scale_grave_3', rarity: 'rare' },
    m039: { id: 'm039', name: '死者への手向け', type: 'magic', cost: 1, value: 0, element: 'holy', description: '墓地のカードを全て山札に戻しシャッフルする。戻した数x1回復。', effectId: 'reshuffle_grave', rarity: 'rare' },

    // Retrieval Cards
    m040: { id: 'm040', name: 'ネクロサルベージ', type: 'magic', cost: 1, value: 0, element: 'dark', description: '墓地からカードを1枚選び、手札に戻す。', effectId: 'necro_salvage', rarity: 'rare' },
    m041: { id: 'm041', name: 'マナリコール', type: 'magic', cost: 1, value: 0, element: 'none', description: 'マナゾーンからカードを1枚選び、手札に戻す。', effectId: 'mana_recall', rarity: 'rare' },

    // Secret Traps
    t004: { id: 't004', name: '沈黙の仮面', type: 'trap', cost: 2, value: 0, element: 'dark', description: '【罠】相手が魔法を使用した時、それを無効化し相手のMPを5減らす。', effectId: 'trap_silence', rarity: 'rare' },
    t005: { id: 't005', name: '落とし穴', type: 'trap', cost: 2, value: 0, element: 'earth', description: '【罠】相手が武器攻撃をした時、5ダメージを与え攻撃を無効化する。', effectId: 'trap_pitfall', rarity: 'common' },

    // New Traps (Phase 2)
    t006: { id: 't006', name: '氷の足枷', type: 'trap', cost: 3, value: 0, element: 'water', description: '【罠】相手が武器攻撃をした時、攻撃を無効化し相手を凍結させる。', effectId: 'trap_frozen_shackles', rarity: 'rare' },
    t007: { id: 't007', name: 'マナバーン', type: 'trap', cost: 2, value: 0, element: 'fire', description: '【罠】相手が魔法を使用した時、それを無効化しコスト分のダメージを与える。', effectId: 'trap_mana_burn', rarity: 'rare' },
    t008: { id: 't008', name: '突風の罠', type: 'trap', cost: 2, value: 0, element: 'wind', description: '【罠】相手がカードを使用した時、それを手札に戻させ、効果を無効化する。', effectId: 'trap_gale', rarity: 'rare' },
    // Spike Pit (t005 was already added as Earth Trap earlier, let's keep it or refine it if needed. Actually t005 'falling pit' was Earth. Let's stick with these 3 new specific ones and maybe a generic one).
    // Let's add one more generic or different element.
    t009: { id: 't009', name: '光の封印', type: 'trap', cost: 4, value: 0, element: 'holy', description: '【罠】相手がアルティメットを使用した時、それを無効化する。', effectId: 'trap_anti_ultimate', rarity: 'legendary' },

    // Resonance (Union) Weapons
    w027: { id: 'w027', name: '共鳴の炎剣', type: 'weapon', cost: 3, value: 3, element: 'fire', description: '火属性の防具装備時、攻撃力+2。', effectId: 'union_fire_atk', rarity: 'rare' },
    w028: { id: 'w028', name: '共鳴の氷槍', type: 'weapon', cost: 3, value: 3, element: 'water', description: '水属性の防具装備時、攻撃力+2。', effectId: 'union_water_atk', rarity: 'rare' },
    w029: { id: 'w029', name: '疾風の双剣', type: 'weapon', cost: 3, value: 3, element: 'wind', description: '風属性の防具装備時、攻撃力+2。', effectId: 'union_wind_atk', rarity: 'rare' },
    w030: { id: 'w030', name: '大地の戦鎚', type: 'weapon', cost: 3, value: 3, element: 'earth', description: '土属性の防具装備時、攻撃力+2。', effectId: 'union_earth_atk', rarity: 'rare' },

    // Special Cards
    special_stone: { id: 'special_stone', name: '石ころ', type: 'weapon', cost: 0, value: 1, element: 'none', description: 'ただの石ころ。山札が尽きた時に拾う。', rarity: 'common' },
};

export const CARD_LIST = Object.values(CARDS);
