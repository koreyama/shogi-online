export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    id: string;
    points: Point[];
    color: string;
    width: number;
    isEraser: boolean;
    layer?: number;
    type?: 'path' | 'fill';
}

export interface DrawingGameState {
    status: 'waiting' | 'selecting' | 'drawing' | 'result' | 'finished';
    currentDrawerId: string;
    currentWord: string;
    strokes: Record<string, Stroke>;
    round: number;
    maxRounds: number;
    turnEndTime: number;
}
