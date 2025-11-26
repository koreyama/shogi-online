export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    width: number;
    isEraser: boolean;
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
