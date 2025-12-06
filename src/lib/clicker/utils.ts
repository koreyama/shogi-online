
export const formatNumber = (num: number): string => {
    if (num < 1000) {
        // Show up to 1 decimal place for small numbers, removing trailing zeros
        return parseFloat(num.toFixed(1)).toString();
    }

    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];
    const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);

    // Bounds check for suffix
    if (suffixNum >= suffixes.length) {
        return num.toExponential(2);
    }

    let shortValue = parseFloat((suffixNum !== 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(3));
    if (shortValue % 1 !== 0) {
        shortValue = parseFloat(shortValue.toFixed(1));
    }
    return shortValue + suffixes[suffixNum];
};

import { Era } from './types';

export const getExpeditionScaling = (era: Era): number => {
    switch (era) {
        case 'primitive': return 1;
        case 'ancient': return 5;
        case 'classical': return 25;
        case 'medieval': return 100;
        case 'renaissance': return 500;
        case 'industrial': return 2500;
        case 'atomic': return 10000;
        case 'information': return 50000;
        case 'modern': return 250000;
        default: return 1;
    }
};
