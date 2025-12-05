export const formatNumber = (num: number): string => {
    if (num < 1000) {
        // Show up to 1 decimal place for small numbers, removing trailing zeros
        return parseFloat(num.toFixed(1)).toString();
    }

    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi"];
    const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);

    let shortValue = parseFloat((suffixNum !== 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(3));
    if (shortValue % 1 !== 0) {
        shortValue = parseFloat(shortValue.toFixed(1));
    }
    return shortValue + suffixes[suffixNum];
};
