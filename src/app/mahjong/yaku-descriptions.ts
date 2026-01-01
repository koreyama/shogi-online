export interface YakuDescription {
    description: string;
    condition: string;
    example?: string[]; // 簡易表記: 1m=一萬, 5p=五筒, 9s=九索, 1z=東, 2z=南, 3z=西, 4z=北, 5z=白, 6z=發, 7z=中
}

export const YAKU_DESCRIPTIONS: Record<string, YakuDescription> = {
    // 1翻
    riichi: {
        description: '門前（鳴いていない状態）で聴牌し、1000点を支払って宣言する。裏ドラが見れるようになる。',
        condition: '門前のみ'
    },
    ippatsu: {
        description: 'リーチを一発でツモるか、一発でロンする（1順以内）。鳴きが入ると無効。',
        condition: '門前のみ'
    },
    menzenTsumo: {
        description: '門前でツモあがりする。',
        condition: '門前のみ'
    },
    tanyao: {
        description: '2〜8の数牌（中張牌）だけで手を作る。1・9・字牌を含んではいけない。',
        condition: '鳴きOK',
        example: ['2m', '3m', '4m', '6p', '7p', '8p', '3s', '3s', '3s', '5s', '5s']
    },
    pinfu: {
        description: '4つの順子と役牌以外の雀頭で構成し、両面待ちにする。',
        condition: '門前のみ',
        example: ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s', '5m', '5m']
    },
    iipeikou: {
        description: '同じ種類の順子（シュンツ）を2組作る。',
        condition: '門前のみ',
        example: ['2m', '2m', '3m', '3m', '4m', '4m']
    },
    yakuhaiHaku: {
        description: '白（ハク）を3枚揃える（刻子）。',
        condition: '鳴きOK',
        example: ['5z', '5z', '5z']
    },
    yakuhaiHatsu: {
        description: '發（ハツ）を3枚揃える（刻子）。',
        condition: '鳴きOK',
        example: ['6z', '6z', '6z']
    },
    yakuhaiChun: {
        description: '中（チュン）を3枚揃える（刻子）。',
        condition: '鳴きOK',
        example: ['7z', '7z', '7z']
    },
    yakuhaiBakaze: {
        description: '場の風（東場なら東、南場なら南）を3枚揃える。',
        condition: '鳴きOK'
    },
    yakuhaiJikaze: {
        description: '自分の風（親なら東、南家なら南など）を3枚揃える。',
        condition: '鳴きOK'
    },
    rinshan: {
        description: 'カンをした時の補足牌（嶺上牌）でツモあがりする。',
        condition: '鳴きOK'
    },
    chankan: {
        description: '他家が加カンした牌でロンあがりする。',
        condition: '鳴きOK'
    },
    haitei: {
        description: '局の最後の牌（海底牌）でツモあがりする。',
        condition: '鳴きOK'
    },
    houtei: {
        description: '局の最後の打牌（河底牌）でロンあがりする。',
        condition: '鳴きOK'
    },

    // 2翻
    sanshokuDoujun: {
        description: '萬子・筒子・索子で同じ数字の順子を作る。',
        condition: '鳴きOK (1翻)',
        example: ['2m', '3m', '4m', '2p', '3p', '4p', '2s', '3s', '4s']
    },
    ittsu: {
        description: '同じ種類の数牌で1〜9まで揃える（123, 456, 789）。',
        condition: '鳴きOK (1翻)',
        example: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m']
    },
    chanta: {
        description: '全ての面子と雀頭に1・9・字牌が含まれている。',
        condition: '鳴きOK (1翻)',
        example: ['1m', '2m', '3m', '7p', '8p', '9p', '1s', '1s', '1s', '1z', '1z']
    },
    chitoitsu: {
        description: '違う種類の対子（2枚組）を7組揃える。',
        condition: '門前のみ',
        example: ['1m', '1m', '5m', '5m', '9m', '9m', '2p', '2p', '6p', '6p', '8s', '8s', '1z', '1z']
    },
    toitoi: {
        description: '全ての面子を刻子（3枚組）か槓子（4枚組）にする。',
        condition: '鳴きOK',
        example: ['2m', '2m', '2m', '5p', '5p', '5p', '8s', '8s', '8s', '1z', '1z', '1z', '5m', '5m']
    },
    sanankou: {
        description: '暗刻（ポン・ロンせず自分で揃えた3枚組）を3つ作る。',
        condition: '鳴きOK'
    },
    honroutou: {
        description: '1・9・字牌だけで手を作る（対々和か七対子と複合する）。',
        condition: '鳴きOK',
        example: ['1m', '1m', '1m', '9p', '9p', '9p', '1s', '1s', '1s', '1z', '1z', '1z', '2z', '2z']
    },
    sanshokuDoukou: {
        description: '萬子・筒子・索子で同じ数字の刻子を作る。',
        condition: '鳴きOK',
        example: ['5m', '5m', '5m', '5p', '5p', '5p', '5s', '5s', '5s']
    },
    sankantsu: {
        description: 'カンを3回する。',
        condition: '鳴きOK'
    },
    shousangen: {
        description: '白・發・中のうち2つを刻子にし、残りの1つを雀頭にする。',
        condition: '鳴きOK',
        example: ['5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z']
    },
    doubleRiichi: {
        description: '1巡目にリーチする。途中でポン・チー・カンが入ると無効。',
        condition: '門前のみ'
    },

    // 3翻
    honitsu: {
        description: '1種類の数牌（萬子など）と字牌だけで手を作る。',
        condition: '鳴きOK (2翻)',
        example: ['1m', '2m', '3m', '5m', '6m', '7m', '9m', '9m', '9m', '1z', '1z', '1z', '5z', '5z']
    },
    junchan: {
        description: '全ての面子と雀頭に1・9が含まれている（字牌は不可）。',
        condition: '鳴きOK (2翻)',
        example: ['1m', '2m', '3m', '7m', '8m', '9m', '1p', '1p', '1p', '9s', '9s', '9s', '1s', '1s']
    },
    ryanpeikou: {
        description: '一盃口を2つ作る（七対子とは複合しない）。',
        condition: '門前のみ',
        example: ['2m', '2m', '3m', '3m', '4m', '4m', '6p', '6p', '7p', '7p', '8p', '8p', '5s', '5s']
    },

    // 6翻
    chinitsu: {
        description: '1種類の数牌だけで手を作る。字牌も不可。',
        condition: '鳴きOK (5翻)',
        example: ['1m', '1m', '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '9m', '9m']
    },

    // 役満
    kokushiMusou: {
        description: '1・9・字牌の13種を各1枚ずつ揃え、そのうち1種だけ2枚にする。',
        condition: '門前のみ (役満)',
        example: ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z', '1m']
    },
    suuankou: {
        description: '暗刻（自分で揃えた3枚組）を4つ作る。',
        condition: '門前のみ (役満)',
        example: ['1m', '1m', '1m', '5p', '5p', '5p', '9s', '9s', '9s', '2z', '2z', '2z', '5z', '5z']
    },
    daisangen: {
        description: '白・發・中を全て刻子にする。',
        condition: '鳴きOK (役満)',
        example: ['5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z', '7z']
    },
    shousuushi: {
        description: '東・南・西・北のうち3つを刻子にし、残りの1つを雀頭にする。',
        condition: '鳴きOK (役満)',
        example: ['1z', '1z', '1z', '2z', '2z', '2z', '3z', '3z', '3z', '4z', '4z']
    },
    daisuushi: {
        description: '東・南・西・北を全て刻子にする。',
        condition: '鳴きOK (ダブル役満)',
        example: ['1z', '1z', '1z', '2z', '2z', '2z', '3z', '3z', '3z', '4z', '4z', '4z', '5m', '5m']
    },
    tsuuiisou: {
        description: '字牌だけで手を作る。',
        condition: '鳴きOK (役満)',
        example: ['1z', '1z', '1z', '2z', '2z', '2z', '5z', '5z', '5z', '7z', '7z', '7z', '3z', '3z']
    },
    ryuuiisou: {
        description: '緑色の牌（2s, 3s, 4s, 6s, 8s, 發）だけで手を作る。',
        condition: '鳴きOK (役満)',
        example: ['2s', '3s', '4s', '6s', '6s', '6s', '8s', '8s', '8s', '6z', '6z', '6z', '4s', '4s']
    },
    chinroutou: {
        description: '1・9牌（老頭牌）だけで手を作る。',
        condition: '鳴きOK (役満)',
        example: ['1m', '1m', '1m', '9m', '9m', '9m', '1p', '1p', '1p', '9s', '9s', '9s', '1s', '1s']
    },
    chuurenPoutou: {
        description: '同色の数牌で1112345678999+同色1枚の形を作る。',
        condition: '門前のみ (役満)',
        example: ['1m', '1m', '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '9m', '9m', '5m']
    },
    suukantsu: {
        description: 'カンを4回する。',
        condition: '鳴きOK (役満)'
    },
    tenhou: {
        description: '親が配牌で既にあがっている。',
        condition: '門前のみ (役満)'
    },
    chihou: {
        description: '子が第一ツモであがる。',
        condition: '門前のみ (役満)'
    }
};
