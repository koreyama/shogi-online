export type StoneColor = 'black' | 'white';
export type BoardSize = 9 | 13 | 19;

export interface GoBoard {
    size: BoardSize;
    grid: (StoneColor | null)[][];
    capturedBlack: number;
    capturedWhite: number;
    currentColor: StoneColor;
    history: string[]; // For Ko check
}

export type Point = { x: number; y: number };
