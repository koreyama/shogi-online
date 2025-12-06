import { GameState } from './types';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    condition: (state: GameState) => boolean;
    reward?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    // --- Resource Milestones: Food ---
    { id: 'gatherer_100', title: '初めの一歩', description: '食料を100個集める', condition: (state) => state.resources.food >= 100 },
    { id: 'gatherer_1k', title: '備蓄の開始', description: '食料を1,000個集める', condition: (state) => state.resources.food >= 1000 },
    { id: 'gatherer_10k', title: '豊作', description: '食料を10,000個集める', condition: (state) => state.resources.food >= 10000 },
    { id: 'gatherer_100k', title: '食料庫の主', description: '食料を100,000個集める', condition: (state) => state.resources.food >= 100000 },

    // --- Resource Milestones: Wood ---
    { id: 'wood_100', title: '森の恵み', description: '木材を100個集める', condition: (state) => state.resources.wood >= 100 },
    { id: 'wood_1k', title: '木こりの達人', description: '木材を1,000個集める', condition: (state) => state.resources.wood >= 1000 },
    { id: 'wood_10k', title: '森林管理', description: '木材を10,000個集める', condition: (state) => state.resources.wood >= 10000 },
    { id: 'wood_100k', title: '材木王', description: '木材を100,000個集める', condition: (state) => state.resources.wood >= 100000 },

    // --- Resource Milestones: Stone ---
    { id: 'stone_100', title: '石の時代', description: '石材を100個集める', condition: (state) => state.resources.stone >= 100 },
    { id: 'stone_1k', title: '石工の誇り', description: '石材を1,000個集める', condition: (state) => state.resources.stone >= 1000 },
    { id: 'stone_10k', title: '城塞の礎', description: '石材を10,000個集める', condition: (state) => state.resources.stone >= 10000 },
    { id: 'stone_100k', title: '巨石文化', description: '石材を100,000個集める', condition: (state) => state.resources.stone >= 100000 },

    // --- Resource Milestones: Knowledge ---
    { id: 'knowledge_1k', title: '賢者への道', description: '知識を1,000貯める', condition: (state) => state.resources.knowledge >= 1000 },
    { id: 'knowledge_10k', title: '図書館長', description: '知識を10,000貯める', condition: (state) => state.resources.knowledge >= 10000 },
    { id: 'knowledge_100k', title: '全知', description: '知識を100,000貯める', condition: (state) => state.resources.knowledge >= 100000 },

    // --- Resource Milestones: Gold ---
    { id: 'gold_1k', title: '富の蓄積', description: '金を1,000貯める', condition: (state) => state.resources.gold >= 1000 },
    { id: 'gold_10k', title: '大富豪', description: '金を10,000貯める', condition: (state) => state.resources.gold >= 10000 },
    { id: 'gold_100k', title: '黄金卿', description: '金を100,000貯める', condition: (state) => state.resources.gold >= 100000 },
    { id: 'gold_1m', title: '世界の支配者', description: '金を1,000,000貯める', condition: (state) => state.resources.gold >= 1000000 },

    // --- Resource Milestones: Industrial ---
    { id: 'iron_500', title: '鉄の時代', description: '鉄を500個集める', condition: (state) => state.resources.iron >= 500 },
    { id: 'iron_5k', title: '製鉄所', description: '鉄を5,000個集める', condition: (state) => state.resources.iron >= 5000 },
    { id: 'coal_500', title: '黒いダイヤ', description: '石炭を500個集める', condition: (state) => state.resources.coal >= 500 },
    { id: 'coal_5k', title: 'エネルギー革命', description: '石炭を5,000個集める', condition: (state) => state.resources.coal >= 5000 },

    // --- Tech Milestones ---
    { id: 'tech_fire', title: '文明の灯火', description: '「火の発見」を研究する', condition: (state) => state.techs['fire']?.researched },
    { id: 'tech_agriculture', title: '定住の始まり', description: '「農耕」を研究する', condition: (state) => state.techs['agriculture']?.researched },
    { id: 'tech_writing', title: '歴史の記録', description: '「文字」を研究する', condition: (state) => state.techs['writing']?.researched },
    { id: 'tech_industrialization', title: '産業革命', description: '「工業化」を研究する', condition: (state) => state.techs['industrialization']?.researched },
    { id: 'tech_steam', title: '蒸気の力', description: '「蒸気機関」を研究する', condition: (state) => state.techs['steam_power']?.researched },
    { id: 'tech_electricity', title: '光ある世界', description: '「電気」を研究する', condition: (state) => state.techs['electricity']?.researched },
    { id: 'railroad_tycoon', title: '鉄道王', description: '「鉄道」を研究する', condition: (state) => state.techs['railroad']?.researched },

    // --- Population Milestones ---
    { id: 'pop_10', title: '小さな集落', description: '人口が10人に到達する', condition: (state) => state.resources.population >= 10 },
    { id: 'pop_50', title: '村の発展', description: '人口が50人に到達する', condition: (state) => state.resources.population >= 50 },
    { id: 'pop_100', title: '賑やかな街', description: '人口が100人に到達する', condition: (state) => state.resources.population >= 100 },
    { id: 'pop_200', title: '都市国家', description: '人口が200人に到達する', condition: (state) => state.resources.population >= 200 },
    { id: 'pop_500', title: '大帝国', description: '人口が500人に到達する', condition: (state) => state.resources.population >= 500 },

    // --- Building Milestones ---
    { id: 'basic_shelter', title: '雨風をしのぐ', description: 'テントを10軒建設する', condition: (state) => (state.buildings['tent']?.count || 0) >= 10 },
    { id: 'village_houses', title: '定住生活', description: '家を20軒建設する', condition: (state) => (state.buildings['house']?.count || 0) >= 20 },
    { id: 'farming_community', title: '豊かな実り', description: '畑を10面開墾する', condition: (state) => (state.buildings['farm']?.count || 0) >= 10 },
    { id: 'mining_ops', title: '地下資源', description: '鉱山を10箇所建設する', condition: (state) => (state.buildings['mine']?.count || 0) >= 10 },
    { id: 'factory_owner', title: '工場長', description: '工場を建設する', condition: (state) => (state.buildings['factory']?.count || 0) > 0 },
    { id: 'industrial_complex', title: '工業地帯', description: '工場を10軒建設する', condition: (state) => (state.buildings['factory']?.count || 0) >= 10 },

    // --- Wonder Milestones ---
    { id: 'wonder_pyramids', title: '永遠の安息', description: 'ピラミッドを建設する', condition: (state) => state.buildings['pyramids']?.count > 0 },
    { id: 'wonder_eiffel', title: '鉄の貴婦人', description: 'エッフェル塔を建設する', condition: (state) => state.buildings['eiffel_tower']?.count > 0 },
    { id: 'wonder_space_elevator', title: '天への架け橋', description: '宇宙エレベーターを建設する', condition: (state) => state.buildings['space_elevator']?.count > 0 },

    // --- Advanced Resource Milestones ---
    { id: 'culture_100', title: '文化の萌芽', description: '文化を100蓄積する', condition: (state) => state.resources.culture >= 100 },
    { id: 'culture_1k', title: '文明開化', description: '文化を1,000蓄積する', condition: (state) => state.resources.culture >= 1000 },
    { id: 'culture_10k', title: '文化的覇権', description: '文化を10,000蓄積する', condition: (state) => state.resources.culture >= 10000 },

    { id: 'oil_100', title: '黒い黄金', description: '石油を100バレル確保する', condition: (state) => state.resources.oil >= 100 },
    { id: 'oil_5k', title: '石油王', description: '石油を5,000バレル確保する', condition: (state) => state.resources.oil >= 5000 },

    { id: 'silicon_100', title: '半導体の夜明け', description: 'シリコンを100個製造する', condition: (state) => state.resources.silicon >= 100 },
    { id: 'silicon_5k', title: 'シリコンバレー', description: 'シリコンを5,000個製造する', condition: (state) => state.resources.silicon >= 5000 },

    // --- Advanced Tech Milestones ---
    { id: 'tech_computers', title: '情報革命', description: '「コンピュータ」を研究する', condition: (state) => state.techs['computers']?.researched },
    { id: 'tech_nuclear', title: '原子の力', description: '「核分裂」を研究する', condition: (state) => state.techs['nuclear_fission']?.researched },
    { id: 'tech_fusion', title: '人工太陽', description: '「核融合」を研究する', condition: (state) => state.techs['fusion_power']?.researched },
    { id: 'tech_space', title: '星々の海へ', description: '「宇宙入植」を研究する', condition: (state) => state.techs['space_colonization']?.researched },

    // --- Policy Milestones ---
    { id: 'policy_code_of_laws', title: '法の支配', description: '「法典」を採用する', condition: (state) => state.policies['code_of_laws']?.active },
    { id: 'policy_welfare', title: 'ゆりかごから墓場まで', description: '「福祉国家」を採用する', condition: (state) => state.policies['welfare_state']?.active },

    // --- Era Milestones ---
    { id: 'era_medieval', title: '暗黒時代を超えて', description: '中世に到達する', condition: (state) => ['medieval', 'renaissance', 'industrial', 'atomic', 'information', 'modern'].includes(state.era) },
    { id: 'era_industrial', title: '機械の時代', description: '産業革命時代に到達する', condition: (state) => ['industrial', 'atomic', 'information', 'modern'].includes(state.era) },
    { id: 'era_information', title: '情報の時代', description: '情報化時代に到達する', condition: (state) => ['information', 'modern'].includes(state.era) },
    { id: 'era_future', title: '未来へ', description: '現代(最終時代)に到達する', condition: (state) => state.era === 'modern' },

    // --- Economy Milestones ---
    { id: 'trade_route_master', title: 'シルクロード', description: '全ての交易路を開通させる', condition: (state) => Object.values(state.tradeRoutes || {}).filter(t => t.active).length >= 2 } // Assuming 2 routes currently

];
