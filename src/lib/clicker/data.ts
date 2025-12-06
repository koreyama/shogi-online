import { Building, Tech, ClickDrop, Job, ExpeditionConfig } from './types';

export const CLICK_DROPS: ClickDrop[] = [
    { resource: 'food', amount: 1, chance: 1.0 },
    { resource: 'knowledge', amount: 1, chance: 0.1 }, // 10% chance for insight
    // { resource: 'wood', amount: 1, chance: 0.5, reqTech: 'stone_tools' },
    // { resource: 'stone', amount: 1, chance: 0.3, reqTech: 'mining' },
    { resource: 'knowledge', amount: 2, chance: 0.2, reqTech: 'writing' }, // Boost after Writing
    // { resource: 'gold', amount: 1, chance: 0.05, reqTech: 'currency' },
    // { resource: 'iron', amount: 1, chance: 0.1, reqTech: 'iron_working' },
    // { resource: 'coal', amount: 1, chance: 0.1, reqTech: 'industrialization' },
];

export const INITIAL_JOBS: { [key: string]: Job } = {
    gatherer: {
        id: 'gatherer',
        name: '採集者',
        description: '食料を集める',
        production: { food: 2 },
        unlocked: true
    },
    woodcutter: {
        id: 'woodcutter',
        name: '木こり',
        description: '木材を伐採する',
        production: { wood: 1 },
        unlocked: false,
        reqTech: ['stone_tools']
    },
    miner: {
        id: 'miner',
        name: '鉱夫',
        description: '石材を採掘する',
        production: { stone: 0.5 },
        unlocked: false,
        reqTech: ['mining']
    },
    scholar: {
        id: 'scholar',
        name: '学者',
        description: '知識を探求する',
        production: { knowledge: 2 },
        consumption: { gold: 0.1 },
        unlocked: false,
        reqTech: ['writing']
    },
    farmer: {
        id: 'farmer',
        name: '農民',
        description: '効率的に食料を生産',
        production: { food: 8 },
        unlocked: false,
        reqTech: ['agriculture']
    },
    merchant: {
        id: 'merchant',
        name: '商人',
        description: '交易で金を稼ぐ',
        production: { gold: 1 },
        consumption: { food: 5 },
        unlocked: false,
        reqTech: ['currency']
    },
    iron_miner: {
        id: 'iron_miner',
        name: '鉄鉱夫',
        description: '鉄を採掘する',
        production: { iron: 0.5 },
        unlocked: false,
        reqTech: ['iron_working']
    },
    coal_miner: {
        id: 'coal_miner',
        name: '炭鉱夫',
        description: '石炭を採掘する',
        production: { coal: 1 },
        unlocked: false,
        reqTech: ['steam_power']
    },
    factory_worker: {
        id: 'factory_worker',
        name: '工場労働者',
        description: '工業製品を生産',
        production: { wood: 10, stone: 10, iron: 2 },
        consumption: { coal: 0.5 },
        unlocked: false,
        reqTech: ['industrialization']
    },
    hunter: {
        id: 'hunter',
        name: '狩人',
        description: '食料を効率よく集める',
        production: { food: 4 },
        unlocked: false,
        reqTech: ['archery']
    },
    artist: {
        id: 'artist',
        name: '芸術家',
        description: '文化を生み出し幸福度を上げる',
        production: { knowledge: 3 }, // Placeholder: Happiness not a resource yet, use Knowledge for now
        consumption: { gold: 2 },
        unlocked: false,
        reqTech: ['drama']
    },
    priest: {
        id: 'priest',
        name: '聖職者',
        description: '信仰を広める',
        production: { knowledge: 4 },
        consumption: { gold: 1 },
        unlocked: false,
        reqTech: ['theology']
    }
};

export const INITIAL_BUILDINGS: { [key: string]: Building } = {
    // --- Primitive Era ---
    gatherer_hut: {
        id: 'gatherer_hut',
        name: '採集小屋',
        description: '採集者のスロット+1',
        baseCost: { food: 25 },
        jobSlots: { gatherer: 1 },
        costScaling: 1.15, // Reduced from 1.25
        count: 0,
        unlocked: true,
        reqEra: 'primitive'
    },
    tent: {
        id: 'tent',
        name: 'テント',
        description: '人口上限+2',
        baseCost: { food: 50, wood: 10 },
        costScaling: 1.15, // Reduced from 1.2
        count: 0,
        unlocked: false,
        reqEra: 'primitive',
        housing: 2,
        reqTech: ['weaving']
    },
    wood_camp: {
        id: 'wood_camp',
        name: '伐採キャンプ',
        description: '木こりのスロット+1',
        baseCost: { food: 100 },
        jobSlots: { woodcutter: 1 },
        costScaling: 1.15, // Reduced from 1.25
        count: 0,
        unlocked: false,
        reqEra: 'primitive',
        reqTech: ['stone_tools']
    },
    stone_pit: {
        id: 'stone_pit',
        name: '石切場',
        description: '鉱夫のスロット+1',
        baseCost: { food: 150, wood: 50 },
        jobSlots: { miner: 1 },
        costScaling: 1.2, // Reduced from 1.3
        count: 0,
        unlocked: false,
        reqEra: 'primitive',
        reqTech: ['mining']
    },
    stable: {
        id: 'stable',
        name: '厩舎',
        description: '狩人のスロット+1',
        baseCost: { wood: 250, food: 100 },
        jobSlots: { hunter: 1 },
        costScaling: 1.25,
        count: 0,
        unlocked: false,
        reqEra: 'primitive',
        reqTech: ['domestication']
    },

    // --- Ancient Era ---
    mud_brick_house: {
        id: 'mud_brick_house',
        name: '日干しレンガの家',
        description: '人口上限+4',
        baseCost: { wood: 50, stone: 20 },
        costScaling: 1.3,
        count: 0,
        unlocked: false,
        reqEra: 'ancient',
        housing: 4,
        reqTech: ['pottery']
    },
    farm: {
        id: 'farm',
        name: '農場',
        description: '農民のスロット+1',
        baseCost: { wood: 200, stone: 50 },
        jobSlots: { farmer: 1 },
        costScaling: 1.25,
        count: 0,
        unlocked: false,
        reqEra: 'ancient',
        reqTech: ['agriculture']
    },
    library: {
        id: 'library',
        name: '図書館',
        description: '学者のスロット+1',
        baseCost: { wood: 500, stone: 200 },
        jobSlots: { scholar: 1 },
        costScaling: 1.45,
        count: 0,
        unlocked: false,
        reqEra: 'ancient',
        reqTech: ['writing']
    },
    pyramids: {
        id: 'pyramids',
        name: 'ピラミッド',
        description: '【世界遺産】建設コスト-10% (全域)',
        baseCost: { stone: 1000, food: 500 },
        costScaling: 100, // Effectively one-time
        count: 0,
        unlocked: false,
        reqEra: 'ancient',
        reqTech: ['masonry']
    },

    // --- Classical Era ---
    market: {
        id: 'market',
        name: '市場',
        description: '商人のスロット+1',
        baseCost: { wood: 800, stone: 300 },
        jobSlots: { merchant: 1 },
        costScaling: 1.35,
        count: 0,
        unlocked: false,
        reqEra: 'classical',
        reqTech: ['currency']
    },
    academy: {
        id: 'academy',
        name: 'アカデメイア',
        description: '学者のスロット+2',
        baseCost: { wood: 1500, stone: 800, gold: 300 },
        jobSlots: { scholar: 2 },
        costScaling: 1.5,
        count: 0,
        unlocked: false,
        reqEra: 'classical',
        reqTech: ['philosophy']
    },
    iron_mine: {
        id: 'iron_mine',
        name: '鉄鉱山',
        description: '鉄鉱夫のスロット+1',
        baseCost: { wood: 1000, stone: 500 },
        jobSlots: { iron_miner: 1 },
        costScaling: 1.35,
        count: 0,
        unlocked: false,
        reqEra: 'classical',
        reqTech: ['iron_working']
    },
    theater: {
        id: 'theater',
        name: '劇場',
        description: '芸術家のスロット+1',
        baseCost: { wood: 1500, stone: 500, gold: 300 },
        jobSlots: { artist: 1 },
        costScaling: 1.35,
        count: 0,
        unlocked: false,
        reqEra: 'classical',
        reqTech: ['drama']
    },
    aqueduct: {
        id: 'aqueduct',
        name: '水道橋',
        description: '人口上限+8',
        baseCost: { stone: 800, wood: 200 },
        costScaling: 1.4,
        count: 0,
        unlocked: false,
        reqEra: 'classical',
        housing: 8,
        reqTech: ['engineering']
    },
    great_library: {
        id: 'great_library',
        name: '大図書館',
        description: '【世界遺産】知識生産+20%',
        baseCost: { wood: 2000, stone: 1000, knowledge: 1000 },
        costScaling: 100,
        count: 0,
        unlocked: false,
        reqEra: 'classical',
        reqTech: ['philosophy']
    },

    // --- Medieval Era ---
    castle: {
        id: 'castle',
        name: '城郭',
        description: '人口上限+20',
        baseCost: { stone: 1000, iron: 200, gold: 500 },
        costScaling: 1.5,
        count: 0,
        unlocked: false,
        reqEra: 'medieval',
        housing: 20,
        reqTech: ['feudalism']
    },
    windmill: {
        id: 'windmill',
        name: '風車',
        description: '農民のスロット+2',
        baseCost: { wood: 2500, stone: 1000, iron: 200 },
        jobSlots: { farmer: 2 },
        costScaling: 1.35,
        count: 0,
        unlocked: false,
        reqEra: 'medieval',
        reqTech: ['machinery']
    },
    university: {
        id: 'university',
        name: '大学',
        description: '学者のスロット+3',
        baseCost: { stone: 5000, gold: 3000, iron: 500 },
        jobSlots: { scholar: 3 },
        costScaling: 1.5,
        count: 0,
        unlocked: false,
        reqEra: 'medieval',
        reqTech: ['university_tech']
    },
    cathedral: {
        id: 'cathedral',
        name: '大聖堂',
        description: '聖職者のスロット+1',
        baseCost: { stone: 6000, gold: 3000, wood: 3000 },
        jobSlots: { priest: 1 },
        costScaling: 1.45,
        count: 0,
        unlocked: false,
        reqEra: 'medieval',
        reqTech: ['theology']
    },
    notre_dame: {
        id: 'notre_dame',
        name: 'ノートルダム大聖堂',
        description: '【世界遺産】幸福度+20',
        baseCost: { stone: 5000, gold: 2000, wood: 2000 },
        costScaling: 100,
        count: 0,
        unlocked: false,
        reqEra: 'medieval',
        reqTech: ['theology']
    },

    // --- Renaissance Era ---
    bank: {
        id: 'bank',
        name: '銀行',
        description: '商人のスロット+2',
        baseCost: { stone: 8000, iron: 2000, gold: 8000 },
        jobSlots: { merchant: 2 },
        costScaling: 1.45,
        count: 0,
        unlocked: false,
        reqEra: 'renaissance',
        reqTech: ['banking']
    },
    observatory: {
        id: 'observatory',
        name: '天文台',
        description: '学者のスロット+5',
        baseCost: { stone: 12000, iron: 5000, gold: 5000 },
        jobSlots: { scholar: 5 },
        costScaling: 1.6,
        count: 0,
        unlocked: false,
        reqEra: 'renaissance',
        reqTech: ['astronomy']
    },
    dock: {
        id: 'dock',
        name: '造船所',
        description: '商人のスロット+1',
        baseCost: { wood: 10000, iron: 2000 },
        jobSlots: { merchant: 1 },
        costScaling: 1.35,
        count: 0,
        unlocked: false,
        reqEra: 'renaissance',
        reqTech: ['navigation']
    },
    taj_mahal: {
        id: 'taj_mahal',
        name: 'タージ・マハル',
        description: '【世界遺産】金の生産+50%',
        baseCost: { stone: 10000, gold: 5000 },
        costScaling: 100,
        count: 0,
        unlocked: false,
        reqEra: 'renaissance',
        reqTech: ['banking']
    },

    // --- Industrial Era ---
    factory: {
        id: 'factory',
        name: '工場',
        description: '工場労働者のスロット+3',
        baseCost: { stone: 20000, iron: 10000, gold: 20000 },
        jobSlots: { factory_worker: 3 },
        costScaling: 1.5,
        count: 0,
        unlocked: false,
        reqEra: 'industrial',
        reqTech: ['industrialization']
    },
    coal_mine: {
        id: 'coal_mine',
        name: '炭鉱',
        description: '炭鉱夫のスロット+2',
        baseCost: { wood: 8000, iron: 5000 },
        jobSlots: { coal_miner: 2 },
        costScaling: 1.4,
        count: 0,
        unlocked: false,
        reqEra: 'industrial',
        reqTech: ['steam_power']
    },
    power_plant: {
        id: 'power_plant',
        name: '発電所',
        description: '都市に動力を供給 (要: 3人)', // Need to rethink power plant logic later, maybe just high production job
        baseCost: { stone: 10000, iron: 5000, gold: 10000 },
        jobSlots: { factory_worker: 5 }, // Placeholder
        costScaling: 1.5,
        count: 0,
        unlocked: false,
        reqEra: 'industrial',
        reqTech: ['electricity']
    },
    eiffel_tower: {
        id: 'eiffel_tower',
        name: 'エッフェル塔',
        description: '【世界遺産】クリック報酬2倍',
        baseCost: { iron: 20000, gold: 10000 },
        costScaling: 100,
        count: 0,
        unlocked: false,
        reqEra: 'industrial',
        reqTech: ['industrialization']
    },
    // --- Atomic Era Buildings ---
    oil_rig: {
        id: 'oil_rig',
        name: '油田',
        description: '地下資源を採掘する施設。石油を生産する。',
        baseCost: { wood: 50000, iron: 50000, gold: 100000 },
        passiveProduction: { oil: 1 },
        costScaling: 1.25,
        count: 0,
        unlocked: false,
        reqEra: 'atomic',
        reqTech: ['combustion']
    },
    nuclear_plant: {
        id: 'nuclear_plant',
        name: '原子力発電所',
        description: '莫大なエネルギーを生み出す。知識と金を生産する。',
        baseCost: { stone: 200000, iron: 200000, gold: 500000, oil: 50000 },
        passiveProduction: { knowledge: 50, gold: 100 },
        costScaling: 1.4,
        count: 0,
        unlocked: false,
        reqEra: 'atomic',
        reqTech: ['nuclear_fission']
    },
    // --- Information Era Buildings ---
    semiconductor_fab: {
        id: 'semiconductor_fab',
        name: '半導体工場',
        description: 'シリコンウェハーを製造する精密工場。',
        baseCost: { iron: 500000, gold: 1000000, oil: 200000 },
        passiveProduction: { silicon: 1 },
        costScaling: 1.3,
        count: 0,
        unlocked: false,
        reqEra: 'information',
        reqTech: ['computers']
    },
    data_center: {
        id: 'data_center',
        name: 'データセンター',
        description: '膨大な情報を処理する。知識の生産を加速させる。',
        baseCost: { iron: 1000000, silicon: 100000, gold: 2000000 },
        passiveProduction: { knowledge: 200 },
        costScaling: 1.35,
        count: 0,
        unlocked: false,
        reqEra: 'information',
        reqTech: ['internet']
    },
    // --- Modern/Future Buildings ---
    fusion_reactor: {
        id: 'fusion_reactor',
        name: '核融合炉',
        description: '無限のクリーンエネルギー。',
        baseCost: { iron: 5000000, silicon: 2000000, gold: 10000000, knowledge: 20000000 },
        passiveProduction: { gold: 5000, knowledge: 2000 },
        costScaling: 1.5,
        count: 0,
        unlocked: false,
        reqEra: 'modern',
        reqTech: ['fusion_power']
    },
    space_elevator: {
        id: 'space_elevator',
        name: '宇宙エレベーター',
        description: '宇宙への架け橋。',
        baseCost: { iron: 50000000, silicon: 20000000, gold: 100000000 },
        costScaling: 2.0,
        count: 0,
        unlocked: false,
        housing: 5000,
        reqEra: 'modern',
        reqTech: ['space_colonization']
    },

};

export const INITIAL_TECHS: { [key: string]: Tech } = {
    // --- Primitive Era ---
    stone_tools: {
        id: 'stone_tools',
        name: '石器',
        description: '木材の採取と伐採キャンプを可能にする',
        cost: { knowledge: 10, food: 20 },
        unlocked: true,
        researched: false,
        effects: { unlockBuilding: ['wood_camp'] },
        reqEra: 'primitive'
    },
    sturdy_axe: {
        id: 'sturdy_axe',
        name: '頑丈な斧',
        description: '木材生産効率アップ',
        cost: { knowledge: 30, wood: 10 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { wood: 1.2 } },
        reqEra: 'primitive',
        reqTech: ['stone_tools']
    },
    weaving: {
        id: 'weaving',
        name: '織物',
        description: 'テントの作成を可能にする',
        cost: { knowledge: 50, wood: 40 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['tent'] },
        reqEra: 'primitive',
        reqTech: ['stone_tools']
    },
    mining: {
        id: 'mining',
        name: '採掘',
        description: '石材の採取と石切場を可能にする',
        cost: { knowledge: 100, wood: 100 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['stone_pit'] },
        reqEra: 'primitive',
        reqTech: ['stone_tools']
    },
    domestication: {
        id: 'domestication',
        name: '家畜化',
        description: '厩舎を解放',
        cost: { knowledge: 150, food: 150 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['stable'] },
        reqEra: 'primitive',
        reqTech: ['stone_tools']
    },
    archery: {
        id: 'archery',
        name: '弓術',
        description: '狩猟効率アップ (仮)',
        cost: { knowledge: 200, wood: 200 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { food: 1.1 } },
        reqEra: 'primitive',
        reqTech: ['stone_tools']
    },
    fire: {
        id: 'fire',
        name: '火の発見',
        description: '食料生産効率アップ',
        cost: { knowledge: 300, wood: 300 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { food: 1.2 } },
        reqEra: 'primitive',
        reqTech: ['stone_tools']
    },

    // --- Ancient Era ---
    agriculture: {
        id: 'agriculture',
        name: '農耕',
        description: '農場を解放し、古代へ',
        cost: { knowledge: 1000, wood: 500, stone: 200 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['farm'] },
        reqEra: 'primitive',
        reqTech: ['fire', 'mining']
    },
    pottery: {
        id: 'pottery',
        name: '陶芸',
        description: '日干しレンガの家を解放',
        cost: { knowledge: 800, stone: 500 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['mud_brick_house'] },
        reqEra: 'ancient',
        reqTech: ['agriculture']
    },
    writing: {
        id: 'writing',
        name: '文字',
        description: '知識のドロップと図書館を解放',
        cost: { knowledge: 1500, wood: 1000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['library'] },
        reqEra: 'ancient',
        reqTech: ['pottery']
    },
    paper: {
        id: 'paper',
        name: '紙',
        description: '知識の伝達を加速し、学者の生産力を向上',
        cost: { wood: 500, knowledge: 500 },
        unlocked: false,
        researched: false,
        reqEra: 'ancient',
        reqTech: ['writing']
    },
    wheel: {
        id: 'wheel',
        name: '車輪',
        description: '建設効率アップ',
        cost: { knowledge: 600, wood: 400 },
        unlocked: false,
        researched: false,
        effects: { buildingCostMultiplier: 0.9 },
        reqEra: 'ancient',
        reqTech: ['pottery']
    },
    lumber_mill: {
        id: 'lumber_mill',
        name: '製材技術',
        description: '木材生産効率を強化',
        cost: { knowledge: 1500, gold: 500 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { wood: 1.5 } },
        reqEra: 'ancient',
        reqTech: ['wheel', 'stone_tools']
    },
    masonry: {
        id: 'masonry',
        name: '石工',
        description: 'ピラミッドを解放',
        cost: { knowledge: 1000, stone: 1000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['pyramids'] },
        reqEra: 'ancient',
        reqTech: ['pottery']
    },
    calendar: {
        id: 'calendar',
        name: '暦',
        description: '食料生産効率アップ',
        cost: { knowledge: 1200 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { food: 1.2 } },
        reqEra: 'ancient',
        reqTech: ['writing']
    },

    // --- Classical Era ---
    currency: {
        id: 'currency',
        name: '貨幣',
        description: '金のドロップと市場を解放',
        cost: { knowledge: 5000, food: 3000, wood: 2000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['market'] },
        reqEra: 'ancient',
        reqTech: ['writing']
    },
    philosophy: {
        id: 'philosophy',
        name: '哲学',
        description: 'アカデメイアを解放',
        cost: { knowledge: 8000, gold: 2000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['academy', 'great_library'] },
        reqEra: 'classical',
        reqTech: ['currency']
    },
    iron_working: {
        id: 'iron_working',
        name: '鉄器',
        description: '鉄の採掘を可能にする',
        cost: { knowledge: 10000, wood: 3000, stone: 3000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['iron_mine'] },
        reqEra: 'classical',
        reqTech: ['currency']
    },
    mathematics: {
        id: 'mathematics',
        name: '数学',
        description: '建設効率アップ',
        cost: { knowledge: 12000, gold: 3000 },
        unlocked: false,
        researched: false,
        effects: { clickMultiplier: 1.5 },
        reqEra: 'classical',
        reqTech: ['philosophy']
    },
    drama: {
        id: 'drama',
        name: '演劇',
        description: '劇場を解放',
        cost: { knowledge: 10000, gold: 2500 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['theater'] },
        reqEra: 'classical',
        reqTech: ['philosophy']
    },
    engineering: {
        id: 'engineering',
        name: '工学',
        description: '水道橋を解放',
        cost: { knowledge: 15000, stone: 5000, wood: 3000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['aqueduct'] },
        reqEra: 'classical',
        reqTech: ['mathematics']
    },
    law: {
        id: 'law',
        name: '法律',
        description: '社会の安定化 (幸福度ボーナス)',
        cost: { knowledge: 18000, gold: 5000 },
        unlocked: false,
        researched: false,
        // effects: { happinessBonus: 5 }, // Not implemented yet
        reqEra: 'classical',
        reqTech: ['philosophy']
    },

    // --- Medieval Era ---
    feudalism: {
        id: 'feudalism',
        name: '封建制',
        description: '城郭を解放し、中世へ',
        cost: { knowledge: 25000, food: 15000, iron: 2000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['castle'] },
        reqEra: 'classical',
        reqTech: ['iron_working', 'philosophy']
    },
    machinery: {
        id: 'machinery',
        name: '機械工学',
        description: '風車を解放',
        cost: { knowledge: 30000, wood: 15000, iron: 3000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['windmill'] },
        reqEra: 'medieval',
        reqTech: ['feudalism']
    },
    university_tech: {
        id: 'university_tech',
        name: '大学制度',
        description: '大学を解放',
        cost: { knowledge: 40000, gold: 15000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['university'] },
        reqEra: 'medieval',
        reqTech: ['feudalism']
    },
    guilds: {
        id: 'guilds',
        name: 'ギルド',
        description: '生産効率アップ',
        cost: { knowledge: 35000, gold: 10000 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { wood: 1.5, stone: 1.5, iron: 1.5 } }, // Buffed to 1.5
        reqEra: 'medieval',
        reqTech: ['feudalism']
    },
    steel_tools: {
        id: 'steel_tools',
        name: '鋼鉄の道具',
        description: '伐採・採掘効率を大幅向上',
        cost: { knowledge: 45000, iron: 5000, gold: 5000 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { wood: 1.5, stone: 1.5 } },
        reqEra: 'medieval',
        reqTech: ['iron_working', 'guilds']
    },
    compass: {
        id: 'compass',
        name: '羅針盤',
        description: '探索効率アップ (仮)',
        cost: { knowledge: 50000, iron: 8000 },
        unlocked: false,
        researched: false,
        // effects: { expeditionSpeed: 1.2 }, // Not implemented
        reqEra: 'medieval',
        reqTech: ['machinery']
    },
    theology: {
        id: 'theology',
        name: '神学',
        description: '大聖堂を解放',
        cost: { knowledge: 60000, gold: 20000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['cathedral', 'notre_dame'] },
        reqEra: 'medieval',
        reqTech: ['university_tech']
    },

    // --- Renaissance Era ---
    printing_press: {
        id: 'printing_press',
        name: '活版印刷',
        description: '知識生産を大幅強化し、ルネサンスへ',
        cost: { knowledge: 80000, wood: 30000, iron: 8000 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { knowledge: 1.5 } },
        reqEra: 'medieval',
        reqTech: ['machinery', 'university_tech']
    },
    astronomy: {
        id: 'astronomy',
        name: '天文学',
        description: '天文台を解放',
        cost: { knowledge: 100000, gold: 30000, stone: 15000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['observatory'] },
        reqEra: 'renaissance',
        reqTech: ['printing_press']
    },
    banking: {
        id: 'banking',
        name: '銀行制度',
        description: '銀行を解放',
        cost: { knowledge: 150000, gold: 60000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['bank', 'taj_mahal'] },
        reqEra: 'renaissance',
        reqTech: ['printing_press']
    },
    navigation: {
        id: 'navigation',
        name: '航海術',
        description: '造船所を解放',
        cost: { knowledge: 180000, wood: 50000, iron: 10000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['dock'] },
        reqEra: 'renaissance',
        reqTech: ['astronomy']
    },
    metallurgy: {
        id: 'metallurgy',

        name: '冶金学',
        description: '金属生産効率アップ',
        cost: { knowledge: 200000, iron: 20000, coal: 5000 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { iron: 1.5, gold: 1.2 } },
        reqEra: 'renaissance',
        reqTech: ['printing_press']
    },
    gunpowder: {
        id: 'gunpowder',
        name: '火薬',
        description: '軍事力の革命',
        cost: { knowledge: 250000, wood: 80000, iron: 20000 },
        unlocked: false,
        researched: false,
        effects: { clickMultiplier: 2.0 },
        reqEra: 'renaissance',
        reqTech: ['astronomy']
    },

    // --- Industrial Era ---
    steam_power: {
        id: 'steam_power',
        name: '蒸気機関',
        description: '炭鉱を解放し、産業時代へ',
        cost: { knowledge: 500000, iron: 50000, wood: 200000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['coal_mine'] },
        reqEra: 'renaissance',
        reqTech: ['astronomy', 'banking']
    },
    industrialization: {
        id: 'industrialization',
        name: '工業化',
        description: '工場を解放し、生産力を爆発的に向上',
        cost: { knowledge: 1000000, iron: 100000, coal: 30000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['factory'], resourceMultiplier: { wood: 2.0, stone: 2.0, iron: 2.0 } },
        reqEra: 'industrial',
        reqTech: ['steam_power']
    },
    explosives: {
        id: 'explosives',
        name: '爆薬',
        description: '採掘効率を劇的に向上',
        cost: { knowledge: 600000, coal: 10000, gold: 20000 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { stone: 3.0, coal: 3.0, iron: 2.0 } },
        reqEra: 'industrial',
        reqTech: ['steam_power']
    },
    electricity: {
        id: 'electricity',
        name: '電気',
        description: '発電所を解放',
        cost: { knowledge: 2000000, gold: 200000, coal: 100000 },
        unlocked: false,
        researched: false,
        effects: { unlockBuilding: ['power_plant', 'eiffel_tower'] },
        reqEra: 'industrial',
        reqTech: ['industrialization']
    },
    chemistry: {
        id: 'chemistry',
        name: '化学',
        description: '科学の発展 (知識生産アップ)',
        cost: { knowledge: 1500000, gold: 50000, coal: 30000 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { knowledge: 1.2 } },
        reqEra: 'industrial',
        reqTech: ['industrialization']
    },
    railroad: {
        id: 'railroad',
        name: '鉄道',
        description: '物流革命 (生産効率アップ)',
        cost: { knowledge: 2500000, iron: 150000, coal: 50000 },
        unlocked: false,
        researched: false,
        effects: { resourceMultiplier: { wood: 1.2, stone: 1.2, iron: 1.2, coal: 1.2 } },
    },
    // --- Atomic Era Techs ---
    combustion: {
        id: 'combustion',
        name: '内燃機関',
        description: '石油を動力源とする技術。原子力の前提。',
        cost: { knowledge: 3000000, iron: 200000 },
        unlocked: false,
        researched: false,
        effects: {
            unlockBuilding: ['oil_rig']
        },
        reqEra: 'industrial',
        reqTech: ['steam_power']
    },
    plastics: {
        id: 'plastics',
        name: 'プラスチック',
        description: '石油化学製品。様々な産業に応用される。',
        cost: { knowledge: 4000000, oil: 10000 },
        unlocked: false,
        researched: false,
        effects: {
            resourceMultiplier: { wood: 1.5, food: 1.5 }
        },
        reqEra: 'atomic',
        reqTech: ['combustion']
    },
    nuclear_fission: {
        id: 'nuclear_fission',
        name: '核分裂',
        description: '原子の力を利用する。原子力時代へ。',
        cost: { knowledge: 5000000, gold: 500000 },
        unlocked: false,
        researched: false,
        effects: {
            unlockBuilding: ['nuclear_plant']
        },
        reqEra: 'atomic',
        reqTech: ['combustion']
    },
    mass_media: {
        id: 'mass_media',
        name: 'マスメディア',
        description: '情報の拡散。',
        cost: { knowledge: 4500000, gold: 300000 },
        unlocked: false,
        researched: false,
        effects: {
            clickMultiplier: 2.0
        },
        reqEra: 'atomic',
        reqTech: ['printing_press']
    },
    // --- Information Era Techs ---
    computers: {
        id: 'computers',
        name: 'コンピュータ',
        description: '情報処理の革命。情報化時代へ。',
        cost: { knowledge: 15000000, gold: 1000000, oil: 50000 },
        unlocked: false,
        researched: false,
        effects: {
            unlockBuilding: ['semiconductor_fab']
        },
        reqEra: 'information',
        reqTech: ['plastics', 'mass_media']
    },
    internet: {
        id: 'internet',
        name: 'インターネット',
        description: '世界を繋ぐネットワーク。',
        cost: { knowledge: 25000000, silicon: 20000 },
        unlocked: false,
        researched: false,
        effects: {
            unlockBuilding: ['data_center'],
            resourceMultiplier: { knowledge: 2.0 }
        },
        reqEra: 'information',
        reqTech: ['computers']
    },
    globalization: {
        id: 'globalization',
        name: 'グローバリゼーション',
        description: '世界経済の統合。',
        cost: { knowledge: 30000000, gold: 5000000 },
        unlocked: false,
        researched: false,
        effects: {
            resourceMultiplier: { gold: 2.0 }
        },
        reqEra: 'information',
        reqTech: ['internet']
    },
    // --- Modern/Future Techs ---
    ai: {
        id: 'ai',
        name: '人工知能 (AI)',
        description: '自律的な知性。現代・未来へ。',
        cost: { knowledge: 100000000, silicon: 100000 },
        unlocked: false,
        researched: false,
        effects: {
            clickMultiplier: 5.0,
            resourceMultiplier: { knowledge: 1.5, gold: 1.5 }
        },
        reqEra: 'modern',
        reqTech: ['computers', 'internet']
    },
    fusion_power: {
        id: 'fusion_power',
        name: '核融合',
        description: '夢のエネルギー。',
        cost: { knowledge: 500000000, silicon: 500000, gold: 10000000 },
        unlocked: false,
        researched: false,
        effects: {
            unlockBuilding: ['fusion_reactor'],
            resourceMultiplier: { iron: 2.0, stone: 2.0, wood: 2.0, coal: 2.0 }
        },
        reqEra: 'modern',
        reqTech: ['nuclear_fission', 'ai']
    },
    space_colonization: {
        id: 'space_colonization',
        name: '宇宙開拓',
        description: '地球の外へ。',
        cost: { knowledge: 1000000000, silicon: 1000000, oil: 500000 },
        unlocked: false,
        researched: false,
        effects: {
            unlockBuilding: ['space_elevator']
        },
        reqEra: 'modern',
        reqTech: ['ai']
    }
};

export const EXPEDITIONS: Record<string, ExpeditionConfig> = {
    scout: {
        id: 'scout',
        title: '周辺調査',
        description: '近隣を探索し、基本的な資源や食料を探します。',
        cost: { food: 200 },
        rewardDesc: '食料, 木材, 石材',
        risk: '低',
        duration: 10,
    },
    research: {
        id: 'research',
        title: '古代遺跡の探索',
        description: '失われた知識を求めて、遠方の遺跡を調査します。',
        cost: { food: 500 },
        rewardDesc: '知識 (中)',
        risk: '中',
        duration: 30,
    },
    trade: {
        id: 'trade',
        title: '交易路の開拓',
        description: '他の集落との交易路を開き、金を得ます。',
        cost: { food: 500, wood: 300 },
        rewardDesc: '金 (中)',
        risk: '高',
        duration: 60,
    }
    // End of EXPEDITIONS
};

export const RESOURCE_VALUES: Record<string, number> = {
    food: 1,
    wood: 1,
    stone: 2,
    coal: 4,
    iron: 5,
    oil: 8,
    gold: 10,
    silicon: 15,
    knowledge: 20,
    population: 50 // High value, maybe not tradable?
};

// Preserved for legacy/examples, but UI will mainly use dynamic creation
export const AVAILABLE_TRADE_ROUTES = [
    { id: 'wood_to_gold', from: 'wood', to: 'gold', rate: 0.08, name: '木材輸出' }, // 10 Wood (10 val) -> 0.8 Gold (8 val). 20% tax.
    { id: 'stone_to_gold', from: 'stone', to: 'gold', rate: 0.16, name: '石材輸出' },
];
