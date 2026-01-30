export interface RainbowRoom {
    roomId: string;
    players: { [id: string]: any };
    status: string;
    isLocked?: boolean;
    metadata?: any;
    clients: number;
    maxClients: number;
}
