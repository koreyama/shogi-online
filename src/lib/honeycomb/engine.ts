import { Hex, Player, DIRECTIONS, HEX_SIZE, BOARD_RADIUS } from './types';

export const getHexKey = (hex: Hex) => `${hex.q},${hex.r},${hex.s}`;

export const hexToPixel = (hex: Hex) => {
    const x = HEX_SIZE * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
    const y = HEX_SIZE * (3. / 2 * hex.r);
    return { x, y };
};

export const getHexPoints = (size: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        points.push(`${size * Math.cos(angle_rad)},${size * Math.sin(angle_rad)}`);
    }
    return points.join(' ');
};

export const generateGrid = (): Hex[] => {
    const hexes: Hex[] = [];
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
        const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
        const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
        for (let r = r1; r <= r2; r++) {
            hexes.push({ q, r, s: -q - r });
        }
    }
    return hexes;
};

export const checkWinLoss = (board: Map<string, Player>, lastMove: Hex, player: Player) => {
    const axes = [
        { q: 1, r: 0, s: -1 },
        { q: 0, r: 1, s: -1 },
        { q: 1, r: -1, s: 0 }
    ];

    let won = false;
    let lost = false;
    let winLine: string[] = [];

    for (const axis of axes) {
        let count = 1;
        let line = [getHexKey(lastMove)];

        // Forward
        let curr = { q: lastMove.q + axis.q, r: lastMove.r + axis.r, s: lastMove.s + axis.s };
        while (board.get(getHexKey(curr)) === player) {
            count++;
            line.push(getHexKey(curr));
            curr = { q: curr.q + axis.q, r: curr.r + axis.r, s: curr.s + axis.s };
        }

        // Backward
        curr = { q: lastMove.q - axis.q, r: lastMove.r - axis.r, s: lastMove.s - axis.s };
        while (board.get(getHexKey(curr)) === player) {
            count++;
            line.push(getHexKey(curr));
            curr = { q: curr.q - axis.q, r: curr.r - axis.r, s: curr.s - axis.s };
        }

        if (count >= 4) {
            won = true;
            winLine = line;
            break; // Stop checking other axes if won
        } else if (count === 3) {
            lost = true;
            // Don't break here, because we might find a win (4) on another axis which overrides loss?
            // "If you make 3 in a row, you lose IMMEDIATELY."
            // "If you make 4 in a row, you win."
            // What if you make both?
            // Convention: Win usually overrides loss if simultaneous? 
            // Or "Must not make 3". So 3 is fatal.
            // But if 4 is made, the game ends with win. 
            // Let's assume Win > Loss as per page.tsx implementation.
        }
    }

    return { won, lost, line: winLine };
};
