import { Region, Trait } from './types';

export const INITIAL_REGIONS: Region[] = [
    {
        id: 'asia_east',
        name: '東アジア',
        population: 1600000000,
        infected: 0,
        dead: 0,
        climate: 'temperate',
        density: 'urban',
        neighbors: ['asia_se', 'russia', 'asia_central'],
        borderClosed: false
    },
    {
        id: 'asia_se',
        name: '東南アジア',
        population: 650000000,
        infected: 0,
        dead: 0,
        climate: 'humid',
        density: 'rural',
        neighbors: ['asia_east', 'asia_south', 'oceania'],
        borderClosed: false
    },
    {
        id: 'asia_south',
        name: '南アジア',
        population: 1800000000,
        infected: 0,
        dead: 0,
        climate: 'hot',
        density: 'urban',
        neighbors: ['asia_se', 'asia_central', 'middle_east'],
        borderClosed: false
    },
    {
        id: 'europe',
        name: 'ヨーロッパ',
        population: 750000000,
        infected: 0,
        dead: 0,
        climate: 'cold',
        density: 'urban',
        neighbors: ['russia', 'middle_east', 'africa_north', 'usa'],
        borderClosed: false
    },
    {
        id: 'usa',
        name: '北アメリカ',
        population: 580000000,
        infected: 0,
        dead: 0,
        climate: 'temperate',
        density: 'urban',
        neighbors: ['europe', 'south_america', 'asia_east'],
        borderClosed: false
    },
    {
        id: 'south_america',
        name: '南アメリカ',
        population: 430000000,
        infected: 0,
        dead: 0,
        climate: 'humid',
        density: 'rural',
        neighbors: ['usa', 'africa_west'],
        borderClosed: false
    },
    {
        id: 'africa_north',
        name: '北アフリカ',
        population: 250000000,
        infected: 0,
        dead: 0,
        climate: 'arid',
        density: 'rural',
        neighbors: ['europe', 'middle_east', 'africa_south'],
        borderClosed: false
    },
    {
        id: 'africa_south',
        name: 'サハラ以南',
        population: 1100000000,
        infected: 0,
        dead: 0,
        climate: 'hot',
        density: 'rural',
        neighbors: ['africa_north'],
        borderClosed: false
    },
    {
        id: 'russia',
        name: 'ロシア',
        population: 145000000,
        infected: 0,
        dead: 0,
        climate: 'cold',
        density: 'rural',
        neighbors: ['europe', 'asia_east', 'asia_central'],
        borderClosed: false
    },
    {
        id: 'middle_east',
        name: '中東',
        population: 400000000,
        infected: 0,
        dead: 0,
        climate: 'arid',
        density: 'urban',
        neighbors: ['europe', 'asia_south', 'africa_north', 'asia_central'],
        borderClosed: false
    }
];

// Note: Values are now Multipliers or Probabilities
// infectivity: R0 multiplier (Base 1.0)
// lethality: Probability of death per tick (0.0 - 1.0 logic)
// severity: Global visibility and Cure speed factor
export const TRAITS: Trait[] = [
    // --- Transmission ---
    {
        id: 'water_1',
        name: '水系感染 I',
        type: 'transmission',
        description: '船による移動での感染確率をアンロック。湿潤地域で拡散+20%。',
        cost: 9,
        effects: { infectivity: 0.2, waterTransmission: 0.05 }
    },
    {
        id: 'water_2',
        name: '水系感染 II',
        type: 'transmission',
        description: '船による感染拡大が大幅に強化。',
        cost: 16,
        reqTraits: ['water_1'],
        effects: { infectivity: 0.3, waterTransmission: 0.15 }
    },
    {
        id: 'air_1',
        name: '空気感染 I',
        type: 'transmission',
        description: '飛行機移動での感染確率をアンロック。乾燥地域で拡散+20%。',
        cost: 12,
        effects: { infectivity: 0.2, airTransmission: 0.05, aridResist: 0.2 }
    },
    {
        id: 'air_2',
        name: '空気感染 II',
        type: 'transmission',
        description: '飛行機による長距離感染が脅威となる。',
        cost: 18,
        reqTraits: ['air_1'],
        effects: { infectivity: 0.4, airTransmission: 0.2, aridResist: 0.3 }
    },
    {
        id: 'insect_1',
        name: '昆虫媒介 I',
        type: 'transmission',
        description: '暑い地域での拡散力+30%。',
        cost: 15,
        effects: { infectivity: 0.3, heatResist: 0.3 }
    },
    {
        id: 'insect_2',
        name: '昆虫媒介 II',
        type: 'transmission',
        description: '暑い地域での拡散力+50%。変異しやすくなる。',
        cost: 22,
        reqTraits: ['insect_1'],
        effects: { infectivity: 0.5, heatResist: 0.5 }
    },
    {
        id: 'bird_1',
        name: '鳥類媒介',
        type: 'transmission',
        description: '陸続きの国境越え確率が大幅アップ。',
        cost: 14,
        effects: { infectivity: 0.3, landTransmission: 0.2 }
    },
    {
        id: 'rodent_1',
        name: '齧歯類媒介',
        type: 'transmission',
        description: '都市部での拡散スピードが倍増。',
        cost: 13,
        effects: { infectivity: 0.4 } // Logic will check for Urban
    },

    // --- Symptoms ---
    {
        id: 'coughing',
        name: '咳',
        type: 'symptom',
        description: '基本感染力 +10%。わずかに危険視される。',
        cost: 4,
        effects: { infectivity: 0.1, severity: 1 }
    },
    {
        id: 'sneezing',
        name: 'くしゃみ',
        type: 'symptom',
        description: '基本感染力 +20%。',
        cost: 6,
        reqTraits: ['coughing'],
        effects: { infectivity: 0.2, severity: 2 }
    },
    {
        id: 'pneumonia',
        name: '肺炎',
        type: 'symptom',
        description: '寒冷地で強い。致死性が発生し始める。',
        cost: 12,
        reqTraits: ['sneezing'],
        effects: { infectivity: 0.1, lethality: 0.005, severity: 8, coldResist: 0.2 }
    },

    // Neuro Tree
    {
        id: 'insomnia',
        name: '不眠症',
        type: 'symptom',
        description: '調査を遅らせる効果がある。',
        cost: 5,
        effects: { severity: 2, cureSlow: 0.1 }
    },
    {
        id: 'paranoia',
        name: 'パラノイア',
        type: 'symptom',
        description: '治療への協力を拒む。',
        cost: 9,
        reqTraits: ['insomnia'],
        effects: { severity: 4, cureSlow: 0.2 }
    },
    {
        id: 'seizures',
        name: '発作',
        type: 'symptom',
        description: '致死性が大幅に上がる。',
        cost: 18,
        reqTraits: ['paranoia'],
        effects: { lethality: 0.02, severity: 15 }
    },
    {
        id: 'coma',
        name: '昏睡',
        type: 'symptom',
        description: '死に至る病。',
        cost: 25,
        reqTraits: ['seizures'],
        effects: { lethality: 0.05, severity: 25 }
    },

    // Blood Tree
    {
        id: 'fever',
        name: '発熱',
        type: 'symptom',
        description: '感染力のベースアップ。',
        cost: 11,
        effects: { infectivity: 0.15, lethality: 0.001, severity: 5 }
    },
    {
        id: 'hemorrhage',
        name: '内出血',
        type: 'symptom',
        description: '致死性が高まる。',
        cost: 18,
        reqTraits: ['fever'],
        effects: { infectivity: 0.2, lethality: 0.03, severity: 15 }
    },
    {
        id: 'organ_failure',
        name: '全身不全',
        type: 'symptom',
        description: '急速な人口減少を引き起こす。',
        cost: 40,
        reqTraits: ['hemorrhage'],
        effects: { lethality: 0.15, severity: 40 }
    },
    {
        id: 'necrosis',
        name: '壊死',
        type: 'symptom',
        description: '死体からの感染拡大。',
        cost: 35,
        reqTraits: ['hemorrhage'],
        effects: { infectivity: 0.4, lethality: 0.08, severity: 30 }
    },

    // --- Abilities ---
    {
        id: 'cold_resist_1',
        name: '寒冷耐性 I',
        type: 'ability',
        description: '寒冷地域での感染ペナルティを軽減。',
        cost: 10,
        effects: { coldResist: 0.4 }
    },
    {
        id: 'cold_resist_2',
        name: '寒冷耐性 II',
        type: 'ability',
        description: '極寒の地でも活動可能。',
        cost: 16,
        reqTraits: ['cold_resist_1'],
        effects: { coldResist: 0.8 }
    },
    {
        id: 'heat_resist_1',
        name: '高温耐性 I',
        type: 'ability',
        description: '熱帯地域での感染ペナルティを軽減。',
        cost: 10,
        effects: { heatResist: 0.4 }
    },
    {
        id: 'heat_resist_2',
        name: '高温耐性 II',
        type: 'ability',
        description: '高温多湿地域で最大の力を発揮。',
        cost: 16,
        reqTraits: ['heat_resist_1'],
        effects: { heatResist: 0.8 }
    },
    {
        id: 'drug_resist_1',
        name: '薬剤耐性 I',
        type: 'ability',
        description: '治療薬開発を遅らせる。',
        cost: 14,
        effects: { drugResist: 0.3 }
    },
    {
        id: 'drug_resist_2',
        name: '薬剤耐性 II',
        type: 'ability',
        description: '治療薬開発を大幅に遅らせる。',
        cost: 25,
        reqTraits: ['drug_resist_1'],
        effects: { drugResist: 0.6 }
    },
    {
        id: 'genetic_hardening',
        name: '遺伝子強化',
        type: 'ability',
        description: 'CURE開発にかかる時間を永続的に増やす。',
        cost: 30,
        effects: { cureSlow: 0.5 }
    }
];
