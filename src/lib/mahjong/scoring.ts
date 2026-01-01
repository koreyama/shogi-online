// Mahjong Scoring System
// 点数計算

import { Yaku, Wind } from './types';

/**
 * 符計算（簡易版：30符固定）
 * TODO: 完全な符計算を実装する場合はこちらを拡張
 */
export function calculateFu(
    isMenzen: boolean,
    isTsumo: boolean,
    isPinfu: boolean,
    isChitoitsu: boolean
): number {
    // 七対子は固定25符
    if (isChitoitsu) return 25;

    // 平和ツモは20符
    if (isPinfu && isTsumo && isMenzen) return 20;

    // 平和ロンは30符
    if (isPinfu && !isTsumo && isMenzen) return 30;

    // その他は簡易的に30符
    // TODO: 正確な符計算
    return 30;
}

/**
 * 翻数から点数を計算
 */
export function calculateScore(
    han: number,
    fu: number,
    isDealer: boolean,
    isTsumo: boolean
): { total: number, fromDealer: number, fromNonDealer: number } {
    let baseScore: number;

    // 役満判定
    if (han >= 13) {
        baseScore = 8000; // 役満基本点
    } else if (han >= 11) {
        baseScore = 6000; // 三倍満
    } else if (han >= 8) {
        baseScore = 4000; // 倍満
    } else if (han >= 6) {
        baseScore = 3000; // 跳満
    } else if (han >= 5 || (han >= 4 && fu >= 40) || (han >= 3 && fu >= 70)) {
        baseScore = 2000; // 満貫
    } else {
        // 通常計算: 符 × 2^(翻+2)
        baseScore = fu * Math.pow(2, han + 2);
        // 満貫上限
        if (baseScore > 2000) baseScore = 2000;
    }

    if (isDealer) {
        // 親
        if (isTsumo) {
            // ツモ: 全員から均等に
            const fromEach = Math.ceil(baseScore * 2 / 100) * 100;
            return {
                total: fromEach * 3,
                fromDealer: 0, // 自分が親なので
                fromNonDealer: fromEach
            };
        } else {
            // ロン: 放銃者から全額
            const total = Math.ceil(baseScore * 6 / 100) * 100;
            return {
                total,
                fromDealer: 0,
                fromNonDealer: total
            };
        }
    } else {
        // 子
        if (isTsumo) {
            // ツモ: 親から多め、子から均等
            const fromDealer = Math.ceil(baseScore * 2 / 100) * 100;
            const fromNonDealer = Math.ceil(baseScore / 100) * 100;
            return {
                total: fromDealer + fromNonDealer * 2,
                fromDealer,
                fromNonDealer
            };
        } else {
            // ロン: 放銃者から全額
            const total = Math.ceil(baseScore * 4 / 100) * 100;
            return {
                total,
                fromDealer: total, // 親からロンならこの値
                fromNonDealer: total // 子からロンならこの値
            };
        }
    }
}

/**
 * 役リストから合計翻数を計算
 */
export function calculateTotalHan(yakuList: Yaku[], doraCount: number = 0): number {
    const yakumanList = yakuList.filter(y => y.isYakuman);

    // 役満があれば役満のみカウント
    if (yakumanList.length > 0) {
        return yakumanList.reduce((sum, y) => sum + y.han, 0);
    }

    // 通常役の合計 + ドラ
    const yakuHan = yakuList.reduce((sum, y) => sum + y.han, 0);
    return yakuHan + doraCount;
}

/**
 * 点数表示用の文字列を生成
 */
export function formatScore(han: number, fu: number): string {
    if (han >= 13) return '役満';
    if (han >= 11) return '三倍満';
    if (han >= 8) return '倍満';
    if (han >= 6) return '跳満';
    if (han >= 5 || (han >= 4 && fu >= 40) || (han >= 3 && fu >= 70)) return '満貫';
    return `${han}翻${fu}符`;
}

/**
 * 点数の表示用文字列（日本語）
 */
export function formatScoreJapanese(score: number, isTsumo: boolean, isDealer: boolean): string {
    if (isTsumo) {
        if (isDealer) {
            return `${score / 3}点オール`;
        } else {
            // 子のツモ
            const dealerPay = Math.floor(score / 2);
            const nonDealerPay = Math.floor(score / 4);
            return `${nonDealerPay}-${dealerPay}`;
        }
    } else {
        return `${score}点`;
    }
}
