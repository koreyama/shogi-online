import React, { useState, useEffect, useRef } from 'react';
import styles from './DotsAndBoxes.module.css';
import { client } from '@/lib/colyseus';
import { Room } from 'colyseus.js';

type Player = 1 | 2;
const ROWS = 6;
const COLS = 6;

// Helper to convert flat array to 2D
function to2D<T>(arr: T[], rows: number, cols: number): T[][] {
    if (!arr) return [];
    const res: T[][] = [];
    for (let i = 0; i < rows; i++) {
        res.push(arr.slice(i * cols, (i + 1) * cols));
    }
    return res;
}

export default function ColyseusDotsAndBoxesGame({ playerName, onBack }: { playerName: string, onBack: () => void }) {
    const [room, setRoom] = useState<Room | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<any>(null); // Simplified state mapping
    const [mySessionId, setMySessionId] = useState<string>("");

    useEffect(() => {
        let currentRoom: Room;

        const connect = async () => {
            try {
                // Join "dots_and_boxes" room
                currentRoom = await client.joinOrCreate("dots_and_boxes", {
                    name: playerName
                });
                setRoom(currentRoom);
                setMySessionId(currentRoom.sessionId);

                console.log("Connected to room", currentRoom.roomId);

                // Initial State
                updateLocalState(currentRoom.state);

                // Listen for changes
                currentRoom.onStateChange((state) => {
                    console.log("State changed", state);
                    updateLocalState(state);
                });

                currentRoom.onMessage("gameRestarted", () => {
                    console.log("Game Restarted");
                });

            } catch (e: any) {
                console.error("Colyseus Error:", e);
                setError("サーバーへの接続に失敗しました: " + (e.message || JSON.stringify(e)));
            }
        };

        connect();

        return () => {
            if (currentRoom) {
                currentRoom.leave();
            }
        };
    }, []);

    const updateLocalState = (serverState: any) => {
        // Convert Colyseus schema state to local friendly format
        // NOTE: schema arrays are Proxy objects in colyseus.js? 
        // We might need to access them carefully. .toJSON() helps.

        const json = serverState.toJSON ? serverState.toJSON() : serverState;
        console.log("RX State:", json);

        // hLines: flat array of boolean. size: ROWS * (COLS-1)
        // vLines: flat array of boolean. size: (ROWS-1) * COLS
        // boxes: flat array of number. size: (ROWS-1) * (COLS-1)

        setGameState({
            hLines: to2D(json.hLines, ROWS, COLS - 1),
            vLines: to2D(json.vLines, ROWS - 1, COLS),
            boxes: to2D(json.boxes, ROWS - 1, COLS - 1),
            currentPlayer: json.currentPlayer,
            winner: json.winner,
            scores: calculateScores(json.players),
            players: json.players // Map of sessionId -> Player Data
        });
    };

    const calculateScores = (playersMap: any) => {
        // Players is a Map or Object. 
        // We need to map sessionIds to Player 1 / Player 2 logic?
        // Actually the server determines P1/P2 order based on join order (clients array).
        // But the state.players map doesn't explicitly say "P1" or "P2".
        // Wait, the Schema defines: @type({ map: Player }) players = new MapSchema<Player>();
        // We need to know WHICH player corresponds to 1 or 2 for score display.

        // Implementation Detail: In the server Room code, we used this.clients[0] as P1.
        // But how does the client know?
        // Let's assume the client can deduce it from the server's explicit "currentPlayer" logic?
        // Or better: server state should probably map 1 -> score, 2 -> score.
        // My server code accumulates score on the Player object.
        // But I don't know if Player object corresponds to P1 or P2.

        // Hack for now: First player in map is P1? Map order is insertion order usually.
        // Let's just create a generic score object.

        const scores: { 1: number, 2: number } = { 1: 0, 2: 0 };
        const pArray = Object.values(playersMap || {});
        if (pArray[0]) scores[1] = (pArray[0] as any).score;
        if (pArray[1]) scores[2] = (pArray[1] as any).score;

        return scores;
    };

    const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
        if (!room || !gameState) return;
        // Optimistic check? Or just send.
        room.send("placeLine", { type, r, c });
    };

    const handleRestart = () => {
        room?.send("restart");
    };

    if (error) {
        return (
            <div className={styles.container}>
                <p style={{ color: 'red' }}>{error}</p>
                <button onClick={onBack} className={styles.backButton}>戻る</button>
            </div>
        );
    }

    if (!room || !gameState) {
        return (
            <div className={styles.loader_container}>
                <div className={styles.spinner}></div>
                <p>サーバーに接続中...</p>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>(初回は起動に時間がかかる場合があります)</p>
            </div>
        );
    }

    const { hLines, vLines, boxes, currentPlayer, winner, scores, players } = gameState;
    const isGameOver = winner !== 0; // 0 is playing, 1/2/3 is finished

    // Identify who is P1 and P2 for display
    // We need room.sessionId to know "Me".
    // We need to map sessionIds to P1/P2.
    // The server doesn't expose "clients list" directly in state, only players map.
    // Assuming keys in players map are sessionIds.
    // We need a stable way to know P1/P2.

    // Updated Server Plan: Add `seat` to Player schema to know if they are 1 or 2?
    // For now, let's assume keys are sorted or we rely on some other hint.
    // Actually, `room.state.players` keys iterate in insertion order.
    const playerKeys = Object.keys(players || {});
    const p1Id = playerKeys[0];
    const p2Id = playerKeys[1];

    const isMeP1 = p1Id ? mySessionId === p1Id : false;
    const isMeP2 = p2Id ? mySessionId === p2Id : false;
    const myPlayerNum = isMeP1 ? 1 : (isMeP2 ? 2 : 0); // 0 = Spectator

    const safePlayers = players || {};
    const p1Name = (safePlayers[p1Id]?.name || "Waiting...") + (isMeP1 ? " (You)" : "");
    const p2Name = (safePlayers[p2Id]?.name || "Waiting...") + (isMeP2 ? " (You)" : "");

    const DOT_SPACING = 50;
    const DOT_RADIUS = 6;
    const PADDING = 20;

    return (
        <div className={styles.container}>
            <button onClick={onBack} style={{ marginBottom: '1rem', padding: '0.5rem' }}>退出する</button>

            {/* Score Board */}
            <div className={styles.score_board}>
                <div className={`${styles.player_card} ${currentPlayer === 1 && !isGameOver ? styles.player_card_active + ' ' + styles.p1_active : ''}`}>
                    {currentPlayer === 1 && !isGameOver && <div className={`${styles.turn_indicator} ${styles.p1_turn}`}>TURN</div>}
                    <span className={`${styles.player_name} ${styles.p1_name}`}>{p1Name}</span>
                    <span className={styles.player_score}>{scores[1]}</span>
                </div>
                <div className={`${styles.player_card} ${currentPlayer === 2 && !isGameOver ? styles.player_card_active + ' ' + styles.p2_active : ''}`}>
                    {currentPlayer === 2 && !isGameOver && <div className={`${styles.turn_indicator} ${styles.p2_turn}`}>TURN</div>}
                    <span className={`${styles.player_name} ${styles.p2_name}`}>{p2Name}</span>
                    <span className={styles.player_score}>{scores[2]}</span>
                </div>
            </div>

            {isGameOver && (
                <div className={styles.game_over}>
                    <h2 className={styles.winner_text}>
                        {winner === 3
                            ? "Draw!"
                            : winner === 1 ? `Player 1 Wins!` : `Player 2 Wins!`
                        }
                    </h2>
                    <button onClick={handleRestart} className={styles.play_again_btn}>
                        もう一度遊ぶ
                    </button>
                </div>
            )}

            {/* Game Board (SVG) */}
            <div className={styles.board_wrapper}>
                <svg
                    width={(COLS - 1) * DOT_SPACING + PADDING * 2}
                    height={(ROWS - 1) * DOT_SPACING + PADDING * 2}
                    style={{ display: 'block' }}
                >
                    <g transform={`translate(${PADDING}, ${PADDING})`}>
                        {/* Boxes (Fill) */}
                        {boxes.map((row: any[], r: number) =>
                            row.map((owner: number, c: number) => {
                                if (owner === 0) return null;
                                return (
                                    <rect
                                        key={`box-${r}-${c}`}
                                        x={c * DOT_SPACING}
                                        y={r * DOT_SPACING}
                                        width={DOT_SPACING}
                                        height={DOT_SPACING}
                                        className={owner === 1 ? styles.box_p1 : styles.box_p2}
                                    />
                                );
                            })
                        )}

                        {/* Horizontal Lines */}
                        {hLines.map((row: any[], r: number) =>
                            row.map((isActive: boolean, c: number) => (
                                <rect
                                    key={`h-${r}-${c}`}
                                    x={c * DOT_SPACING}
                                    y={r * DOT_SPACING - 5}
                                    width={DOT_SPACING}
                                    height={10}
                                    rx={4}
                                    className={`
                                        ${styles.line}
                                        ${isActive ? styles.line_active : (isGameOver ? '' : styles.line_inactive)}
                                    `}
                                    fill={isActive ? undefined : 'transparent'}
                                    onClick={() => handleLineClick('h', r, c)}
                                />
                            ))
                        )}

                        {/* Vertical Lines */}
                        {vLines.map((row: any[], r: number) =>
                            row.map((isActive: boolean, c: number) => (
                                <rect
                                    key={`v-${r}-${c}`}
                                    x={c * DOT_SPACING - 5}
                                    y={r * DOT_SPACING}
                                    width={10}
                                    height={DOT_SPACING}
                                    rx={4}
                                    className={`
                                        ${styles.line}
                                        ${isActive ? styles.line_active : (isGameOver ? '' : styles.line_inactive)}
                                    `}
                                    fill={isActive ? undefined : 'transparent'}
                                    onClick={() => handleLineClick('v', r, c)}
                                />
                            ))
                        )}

                        {/* Dots */}
                        {Array(ROWS).fill(0).map((_, r) =>
                            Array(COLS).fill(0).map((_, c) => (
                                <circle
                                    key={`dot-${r}-${c}`}
                                    cx={c * DOT_SPACING}
                                    cy={r * DOT_SPACING}
                                    r={DOT_RADIUS}
                                    className={styles.dot}
                                />
                            ))
                        )}
                    </g>
                </svg>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#aaa' }}>
                Using Colyseus Server
            </div>
        </div>
    );
}
