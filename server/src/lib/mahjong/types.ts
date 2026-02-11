// Server-side Mahjong Types

export type TileSuit = 'man' | 'pin' | 'sou' | 'honor';
export type HonorType = 'east' | 'south' | 'west' | 'north' | 'white' | 'green' | 'red';
export type Wind = 'east' | 'south' | 'west' | 'north';

export interface TileData {
    id: string;
    suit: TileSuit;
    value: number;
    isRed?: boolean;
}

export const HONOR_VALUES: Record<number, HonorType> = {
    1: 'east', 2: 'south', 3: 'west', 4: 'north',
    5: 'white', 6: 'green', 7: 'red'
};

export const WIND_ORDER: Wind[] = ['east', 'south', 'west', 'north'];
