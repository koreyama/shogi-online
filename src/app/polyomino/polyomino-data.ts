import { Piece } from './polyomino-types';

// Standard "Duo" set usually has 21 pieces (Monometry to Pentominoes)
// Shapes are defined as 0/1 matrices.
// We'll use standard naming conventions (I, L, T, Z, etc.)

export const INITIAL_PIECES: Piece[] = [
    // 1 Block
    { id: '1-1', name: 'Mono', value: 1, shape: [[1]] },

    // 2 Blocks
    { id: '2-1', name: 'Domino', value: 2, shape: [[1, 1]] },

    // 3 Blocks
    { id: '3-1', name: 'Tri-I', value: 3, shape: [[1, 1, 1]] },
    { id: '3-2', name: 'Tri-L', value: 3, shape: [[1, 0], [1, 1]] },

    // 4 Blocks (Tetrominoes)
    { id: '4-1', name: 'Tet-I', value: 4, shape: [[1, 1, 1, 1]] },
    { id: '4-2', name: 'Tet-L', value: 4, shape: [[1, 0, 0], [1, 1, 1]] },
    { id: '4-3', name: 'Tet-T', value: 4, shape: [[1, 1, 1], [0, 1, 0]] },
    { id: '4-4', name: 'Tet-O', value: 4, shape: [[1, 1], [1, 1]] },
    { id: '4-5', name: 'Tet-Z', value: 4, shape: [[1, 1, 0], [0, 1, 1]] },

    // 5 Blocks (Pentominoes) - A selection commonly used
    { id: '5-1', name: 'Pent-I', value: 5, shape: [[1, 1, 1, 1, 1]] },
    { id: '5-2', name: 'Pent-L', value: 5, shape: [[1, 0, 0, 0], [1, 1, 1, 1]] },
    { id: '5-3', name: 'Pent-P', value: 5, shape: [[1, 1], [1, 1], [1, 0]] },
    { id: '5-4', name: 'Pent-T', value: 5, shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] },
    { id: '5-5', name: 'Pent-U', value: 5, shape: [[1, 0, 1], [1, 1, 1]] },
    { id: '5-6', name: 'Pent-V', value: 5, shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
    { id: '5-7', name: 'Pent-W', value: 5, shape: [[1, 0, 0], [1, 1, 0], [0, 1, 1]] },
    { id: '5-8', name: 'Pent-X', value: 5, shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
    { id: '5-9', name: 'Pent-Y', value: 5, shape: [[0, 1], [1, 1], [0, 1], [0, 1]] },
    { id: '5-10', name: 'Pent-Z', value: 5, shape: [[1, 1, 0], [0, 1, 0], [0, 1, 1]] },
    { id: '5-11', name: 'Pent-F', value: 5, shape: [[0, 1, 1], [1, 1, 0], [0, 1, 0]] },
    { id: '5-12', name: 'Pent-N', value: 5, shape: [[1, 1, 0, 0], [0, 1, 1, 1]] },
];
