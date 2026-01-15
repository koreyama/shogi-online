"use client";

import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Room } from 'colyseus.js';
import { setupBilliardsWorld, TABLE_WIDTH, TABLE_HEIGHT, BALL_RADIUS, WALL_THICKNESS, POCKETS, POCKET_RADIUS } from '@/lib/billiards/BilliardsPhysics';

interface BilliardsGameProps {
    mode: 'solo' | 'multiplayer';
    room?: Room;
    playerName?: string;
}

const BALL_COLORS: Record<number, string> = {
    0: '#f5f5f5', 1: '#f4c430', 2: '#1e40af', 3: '#dc2626', 4: '#7c3aed',
    5: '#ea580c', 6: '#16a34a', 7: '#7f1d1d', 8: '#1a1a1a',
    9: '#f4c430', 10: '#1e40af', 11: '#dc2626', 12: '#7c3aed',
    13: '#ea580c', 14: '#16a34a', 15: '#7f1d1d'
};

const LERP_FACTOR = 0.3;

interface InterpolatedBall {
    id: number;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    visible: boolean;
}

interface PocketedBall {
    id: number;
    byPlayer: string;
}

export default function BilliardsGame({ mode, room, playerName }: BilliardsGameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const [isPortrait, setIsPortrait] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const [gameStatus, setGameStatus] = useState<string>('waiting');
    const [currentTurn, setCurrentTurn] = useState<string>('');
    const [mySessionId, setMySessionId] = useState<string>('');
    const [winner, setWinner] = useState<string>('');
    const [isMoving, setIsMoving] = useState<boolean>(false);
    const [placingCueBall, setPlacingCueBall] = useState<boolean>(false);
    const [soloPlacingCueBall, setSoloPlacingCueBall] = useState<boolean>(false);
    const [foulMessage, setFoulMessage] = useState<string>('');
    const [pocketedBalls, setPocketedBalls] = useState<number[]>([]);
    const [dragPower, setDragPower] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [myBallType, setMyBallType] = useState<string>(''); // 'solid' or 'stripe'
    const [opponentName, setOpponentName] = useState<string>(''); // Opponent's display name

    const lastFoulMessageRef = useRef<string>('');

    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const dragCurrentRef = useRef({ x: 0, y: 0 });
    const cueBallPosRef = useRef({ x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2 });
    const scaleRef = useRef(1);
    const offsetRef = useRef({ x: 0, y: 0 });
    const interpolatedBallsRef = useRef<Map<number, InterpolatedBall>>(new Map());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateSize = () => {
            const dpr = window.devicePixelRatio || 1;
            setCanvasSize({ width: window.innerWidth * dpr, height: window.innerHeight * dpr });
            setIsPortrait(window.innerHeight > window.innerWidth);
            setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window));
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        window.addEventListener('orientationchange', updateSize);

        // Scroll to top and lock
        window.scrollTo(0, 0);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('resize', updateSize);
            window.removeEventListener('orientationchange', updateSize);
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = Matter.Engine.create();
        engine.gravity.x = 0;
        engine.gravity.y = 0;
        engineRef.current = engine;

        let renderLoop: number;
        const localPocketed: number[] = [];

        if (mode === 'solo') {
            setupBilliardsWorld(engine);
            const runner = () => {
                Matter.Engine.update(engine, 1000 / 60);

                const cue = engine.world.bodies.find(b => b.label === 'ball_0');
                if (cue && cue.position.x > 0) {
                    cueBallPosRef.current = { x: cue.position.x, y: cue.position.y };
                }

                let moving = false;
                engine.world.bodies.forEach(b => {
                    if (b.label.startsWith('ball_') && b.speed > 0.08) moving = true;
                });
                setIsMoving(moving);

                const bodies = Matter.Composite.allBodies(engine.world);
                bodies.forEach(body => {
                    if (!body.label.startsWith('ball_')) return;
                    const id = parseInt(body.label.split('_')[1]);

                    for (const pocket of POCKETS) {
                        const dx = body.position.x - pocket.x;
                        const dy = body.position.y - pocket.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < POCKET_RADIUS) {
                            if (id === 0) {
                                Matter.Body.setPosition(body, { x: -200, y: -200 });
                                Matter.Body.setVelocity(body, { x: 0, y: 0 });
                                setSoloPlacingCueBall(true);
                                setFoulMessage('SCRATCH!');
                                setTimeout(() => setFoulMessage(''), 2000);
                            } else {
                                if (!localPocketed.includes(id)) {
                                    localPocketed.push(id);
                                    setPocketedBalls([...localPocketed]);
                                }
                                Matter.World.remove(engine.world, body);
                            }
                        }
                    }
                });

                draw();
                renderLoop = requestAnimationFrame(runner);
            };
            runner();
        } else if (mode === 'multiplayer' && room) {
            setMySessionId(room.sessionId);

            room.onStateChange((state: any) => {
                const pocketed: number[] = [];
                state.balls.forEach((b: any) => {
                    const existing = interpolatedBallsRef.current.get(b.id);
                    if (existing) {
                        existing.targetX = b.x;
                        existing.targetY = b.y;
                        existing.visible = b.visible;
                    } else {
                        interpolatedBallsRef.current.set(b.id, {
                            id: b.id, x: b.x, y: b.y, targetX: b.x, targetY: b.y, visible: b.visible
                        });
                    }
                    if (!b.visible && b.id !== 0) {
                        pocketed.push(b.id);
                    }
                });
                setPocketedBalls(pocketed);

                const cue = interpolatedBallsRef.current.get(0);
                if (cue && cue.visible) {
                    cueBallPosRef.current = { x: cue.x, y: cue.y };
                }

                setCurrentTurn(state.currentTurn);
                setGameStatus(state.status);
                setWinner(state.winner);
                setIsMoving(state.moving);

                // Receive foul message from server - only update if changed
                if (state.foulMessage !== lastFoulMessageRef.current) {
                    lastFoulMessageRef.current = state.foulMessage;
                    if (state.foulMessage) {
                        setFoulMessage(state.foulMessage);
                        setTimeout(() => {
                            setFoulMessage('');
                            lastFoulMessageRef.current = '';
                        }, 1500); // 1.5s - shorter to not block ball placement
                    } else {
                        setFoulMessage('');
                    }
                }

                // Determine my ball type and opponent name using player IDs
                if (state.player1Id && state.player2Id) {
                    if (room.sessionId === state.player1Id) {
                        setMyBallType(state.player1Type || '');
                        setOpponentName(state.player2Name || '相手');
                    } else if (room.sessionId === state.player2Id) {
                        setMyBallType(state.player2Type || '');
                        setOpponentName(state.player1Name || '相手');
                    }
                }

                setPlacingCueBall(state.placingCueBall);
            });

            const runner = () => {
                interpolatedBallsRef.current.forEach(ball => {
                    if (ball.visible) {
                        ball.x += (ball.targetX - ball.x) * LERP_FACTOR;
                        ball.y += (ball.targetY - ball.y) * LERP_FACTOR;
                    } else {
                        ball.x = ball.targetX;
                        ball.y = ball.targetY;
                    }
                });

                const cue = interpolatedBallsRef.current.get(0);
                if (cue && cue.visible) {
                    cueBallPosRef.current = { x: cue.x, y: cue.y };
                }

                draw();
                renderLoop = requestAnimationFrame(runner);
            };
            runner();
        }

        return () => { cancelAnimationFrame(renderLoop); Matter.Engine.clear(engine); };
    }, [mode, room]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        const padding = isMobile ? 60 : 200; // Less padding on mobile for bigger table
        const scale = Math.min(
            (canvas.width - padding) / TABLE_WIDTH,
            (canvas.height - padding) / TABLE_HEIGHT
        );
        scaleRef.current = scale;

        const offsetX = canvas.width / 2;
        const offsetY = canvas.height / 2;
        offsetRef.current = { x: offsetX, y: offsetY };

        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.translate(-TABLE_WIDTH / 2, -TABLE_HEIGHT / 2);

        const frameWidth = 45;
        const cushionWidth = 25;
        const pocketSize = 28;

        // === OUTER WOOD FRAME (Dark Brown) ===
        ctx.fillStyle = '#4a3728';
        roundRect(ctx, -frameWidth - cushionWidth, -frameWidth - cushionWidth,
            TABLE_WIDTH + (frameWidth + cushionWidth) * 2,
            TABLE_HEIGHT + (frameWidth + cushionWidth) * 2, 20);
        ctx.fill();

        // Frame highlight
        ctx.strokeStyle = '#5d4a3a';
        ctx.lineWidth = 2;
        roundRect(ctx, -frameWidth - cushionWidth + 3, -frameWidth - cushionWidth + 3,
            TABLE_WIDTH + (frameWidth + cushionWidth) * 2 - 6,
            TABLE_HEIGHT + (frameWidth + cushionWidth) * 2 - 6, 18);
        ctx.stroke();

        // === CUSHIONS (Reddish Brown) ===
        ctx.fillStyle = '#8b4513';
        roundRect(ctx, -cushionWidth, -cushionWidth,
            TABLE_WIDTH + cushionWidth * 2,
            TABLE_HEIGHT + cushionWidth * 2, 8);
        ctx.fill();

        // Cushion inner shadow
        ctx.fillStyle = '#6b3410';
        roundRect(ctx, -cushionWidth + 4, -cushionWidth + 4,
            TABLE_WIDTH + cushionWidth * 2 - 8,
            TABLE_HEIGHT + cushionWidth * 2 - 8, 6);
        ctx.fill();

        // === POCKETS (Large dark circles) ===
        ctx.fillStyle = '#1a1a1a';
        POCKETS.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, pocketSize, 0, Math.PI * 2);
            ctx.fill();
        });

        // Pocket inner shadow
        ctx.fillStyle = '#0a0a0a';
        POCKETS.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, pocketSize - 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // === PLAYING SURFACE (Green Felt) ===
        ctx.fillStyle = '#2d8f4e';
        ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

        // Felt texture effect
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        for (let i = 0; i < 200; i++) {
            ctx.fillRect(Math.random() * TABLE_WIDTH, Math.random() * TABLE_HEIGHT, 2, 2);
        }

        // === DIAMOND MARKERS ===
        ctx.fillStyle = '#f5f5f5';
        const diamondPositions = [0.25, 0.5, 0.75];
        diamondPositions.forEach(ratio => {
            // Top & Bottom
            drawDiamond(ctx, TABLE_WIDTH * ratio, -cushionWidth / 2, 4);
            drawDiamond(ctx, TABLE_WIDTH * ratio, TABLE_HEIGHT + cushionWidth / 2, 4);
        });
        // Left & Right
        drawDiamond(ctx, -cushionWidth / 2, TABLE_HEIGHT * 0.5, 4);
        drawDiamond(ctx, TABLE_WIDTH + cushionWidth / 2, TABLE_HEIGHT * 0.5, 4);

        // === HEAD STRING (break line) - REMOVED per user request ===
        /*
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(TABLE_WIDTH * 0.25, 0);
        ctx.lineTo(TABLE_WIDTH * 0.25, TABLE_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);
        */

        // === BALLS ===
        if (mode === 'solo') {
            const ballsToRender = engineRef.current?.world.bodies.filter(b => b.label.startsWith('ball_') && b.position.x > 0) || [];
            ballsToRender.forEach((b: any) => {
                const id = parseInt(b.label.split('_')[1]);
                drawBall(ctx, b.position.x, b.position.y, id);
            });
        } else {
            interpolatedBallsRef.current.forEach(ball => {
                if (ball.visible) {
                    drawBall(ctx, ball.x, ball.y, ball.id);
                }
            });
        }

        // === AIM LINE & CUE STICK ===
        if (isDraggingRef.current && !isMoving && !placingCueBall && !soloPlacingCueBall) {
            drawAimLine(ctx);
            drawCueStick(ctx);
        }

        // === CUE BALL AIM CIRCLE (when aiming) ===
        if (!isMoving && !placingCueBall && !soloPlacingCueBall) {
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cueBallPosRef.current.x, cueBallPosRef.current.y, BALL_RADIUS + 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    };

    const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };

    const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawBall = (ctx: CanvasRenderingContext2D, x: number, y: number, id: number) => {
        // Shadow
        ctx.beginPath();
        ctx.arc(x + 2, y + 3, BALL_RADIUS + 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
        const color = BALL_COLORS[id] || '#fff';

        if (id === 0) {
            // Cue ball - white with shine
            const grad = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, BALL_RADIUS);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.7, '#e8e8e8');
            grad.addColorStop(1, '#c0c0c0');
            ctx.fillStyle = grad;
            ctx.fill();
        } else if (id === 8) {
            // 8 ball - black with shine
            const grad = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, BALL_RADIUS);
            grad.addColorStop(0, '#3a3a3a');
            grad.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = grad;
            ctx.fill();
        } else if (id < 9) {
            // Solid balls
            const grad = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, BALL_RADIUS);
            grad.addColorStop(0, lightenColor(color, 40));
            grad.addColorStop(0.6, color);
            grad.addColorStop(1, darkenColor(color, 30));
            ctx.fillStyle = grad;
            ctx.fill();
        } else {
            // Stripe balls
            ctx.fillStyle = '#f8f8f8';
            ctx.fill();
            ctx.save();
            ctx.clip();
            const grad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, BALL_RADIUS);
            grad.addColorStop(0, lightenColor(color, 30));
            grad.addColorStop(1, darkenColor(color, 20));
            ctx.fillStyle = grad;
            ctx.fillRect(x - BALL_RADIUS, y - BALL_RADIUS * 0.5, BALL_RADIUS * 2, BALL_RADIUS);
            ctx.restore();
        }

        // Number circle
        if (id !== 0) {
            ctx.beginPath();
            ctx.arc(x, y, BALL_RADIUS * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = `bold ${BALL_RADIUS * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(id.toString(), x, y + 0.5);
        }

        // Shine highlight
        ctx.beginPath();
        ctx.arc(x - BALL_RADIUS * 0.35, y - BALL_RADIUS * 0.35, BALL_RADIUS * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
    };

    const lightenColor = (hex: string, percent: number) => {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.min(255, (num >> 16) + percent);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
        const b = Math.min(255, (num & 0x0000FF) + percent);
        return `rgb(${r},${g},${b})`;
    };

    const darkenColor = (hex: string, percent: number) => {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.max(0, (num >> 16) - percent);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
        const b = Math.max(0, (num & 0x0000FF) - percent);
        return `rgb(${r},${g},${b})`;
    };

    const drawAimLine = (ctx: CanvasRenderingContext2D) => {
        const start = dragStartRef.current;
        const current = dragCurrentRef.current;
        const dx = start.x - current.x;
        const dy = start.y - current.y;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(cueBallPosRef.current.x, cueBallPosRef.current.y);
        ctx.rotate(angle);

        // Aim line
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(BALL_RADIUS + 3, 0);
        ctx.lineTo(-350, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    };

    const drawCueStick = (ctx: CanvasRenderingContext2D) => {
        const start = dragStartRef.current;
        const current = dragCurrentRef.current;
        const dx = current.x - start.x;
        const dy = current.y - start.y;
        const angle = Math.atan2(dy, dx);
        const pullDist = Math.min(Math.sqrt(dx * dx + dy * dy), 200);

        const stickLen = 280;
        const tipW = 4;
        const buttW = 9;
        const offset = BALL_RADIUS + 12 + pullDist * 0.6;

        ctx.save();
        ctx.translate(cueBallPosRef.current.x, cueBallPosRef.current.y);
        ctx.rotate(angle);

        // Cue stick body
        ctx.beginPath();
        ctx.moveTo(offset, -tipW / 2);
        ctx.lineTo(offset + stickLen, -buttW / 2);
        ctx.lineTo(offset + stickLen, buttW / 2);
        ctx.lineTo(offset, tipW / 2);
        ctx.closePath();

        const stickGrad = ctx.createLinearGradient(offset, 0, offset + stickLen, 0);
        stickGrad.addColorStop(0, '#f5e6d3');
        stickGrad.addColorStop(0.03, '#8b6914');
        stickGrad.addColorStop(0.2, '#d4a656');
        stickGrad.addColorStop(0.5, '#a67c3d');
        stickGrad.addColorStop(0.8, '#6b4423');
        stickGrad.addColorStop(1, '#3d2817');
        ctx.fillStyle = stickGrad;
        ctx.fill();

        // Tip
        ctx.fillStyle = '#4a9eff';
        ctx.fillRect(offset - 2, -tipW / 2, 4, tipW);

        ctx.restore();
    };

    const screenToTable = (screenX: number, screenY: number) => {
        const scale = scaleRef.current;
        const offset = offsetRef.current;
        const tableX = (screenX - offset.x) / scale + TABLE_WIDTH / 2;
        const tableY = (screenY - offset.y) / scale + TABLE_HEIGHT / 2;
        return { x: tableX, y: tableY };
    };

    const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
        return { x: clientX, y: clientY };
    };

    const handleInputStart = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getCanvasCoordinates(e);

        if (mode === 'solo' && soloPlacingCueBall) {
            const tablePos = screenToTable(coords.x, coords.y);
            const margin = BALL_RADIUS + 5;
            const clampedX = Math.max(margin, Math.min(TABLE_WIDTH - margin, tablePos.x));
            const clampedY = Math.max(margin, Math.min(TABLE_HEIGHT - margin, tablePos.y));

            const cue = engineRef.current?.world.bodies.find(b => b.label === 'ball_0');
            if (cue) {
                Matter.Body.setPosition(cue, { x: clampedX, y: clampedY });
                Matter.Body.setVelocity(cue, { x: 0, y: 0 });
                cueBallPosRef.current = { x: clampedX, y: clampedY };
            }
            setSoloPlacingCueBall(false);
            return;
        }

        if (mode === 'multiplayer' && placingCueBall && currentTurn === mySessionId) {
            const tablePos = screenToTable(coords.x, coords.y);
            room?.send("placeCueBall", { x: tablePos.x, y: tablePos.y });
            return;
        }

        if (isMoving) return;
        if (mode === 'multiplayer' && currentTurn !== mySessionId) return;

        isDraggingRef.current = true;
        setIsDragging(true);
        setDragPower(0);
        dragStartRef.current = coords;
        dragCurrentRef.current = coords;
    };

    const handleInputMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDraggingRef.current) return;
        dragCurrentRef.current = getCanvasCoordinates(e);

        // Calculate power for gauge
        const start = dragStartRef.current;
        const current = dragCurrentRef.current;
        const dx = start.x - current.x;
        const dy = start.y - current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(dist / 200, 1); // 0-1 range
        setDragPower(power);
    };

    const handleInputEnd = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        setDragPower(0);

        const start = dragStartRef.current;
        const current = dragCurrentRef.current;
        const dx = start.x - current.x;
        const dy = start.y - current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) return;

        const angle = Math.atan2(dy, dx);
        const power = Math.min(dist * 0.001, 0.15); // Gentle power

        if (mode === 'solo' && engineRef.current) {
            const cue = engineRef.current.world.bodies.find(b => b.label === 'ball_0');
            if (cue) {
                Matter.Body.applyForce(cue, cue.position, {
                    x: Math.cos(angle) * power,
                    y: Math.sin(angle) * power
                });
            }
        } else if (mode === 'multiplayer' && room) {
            room.send("shoot", { angle, power });
        }
    };

    const isPlacing = (mode === 'solo' && soloPlacingCueBall) || (mode === 'multiplayer' && placingCueBall && currentTurn === mySessionId);

    // Mini ball for pocketed display
    const MiniPocketedBall = ({ id }: { id: number }) => {
        const color = BALL_COLORS[id];
        const isStripe = id > 8;
        return (
            <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: isStripe ? `linear-gradient(90deg, #f8f8f8 30%, ${color} 30%, ${color} 70%, #f8f8f8 70%)` : color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 'bold', color: id === 8 ? '#fff' : '#000',
                border: '1px solid rgba(0,0,0,0.3)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
                {id}
            </div>
        );
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                width: '100%', height: '100%',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                background: '#2d2d2d',
                overflow: 'hidden', userSelect: 'none',
                touchAction: 'none'
            }}
            onMouseDown={handleInputStart} onMouseMove={handleInputMove} onMouseUp={handleInputEnd} onMouseLeave={() => isDraggingRef.current = false}
            onTouchStart={handleInputStart} onTouchMove={handleInputMove} onTouchEnd={handleInputEnd}
        >
            <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

            {/* Game Info - Compact on mobile, positioned at bottom */}
            {isMobile ? (
                /* Mobile: Minimal strip at bottom */
                <div style={{
                    position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                    padding: '6px 16px',
                    background: 'rgba(0,0,0,0.85)', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    fontSize: '0.8rem', color: '#fff'
                }}>
                    <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: currentTurn === mySessionId ? '#22c55e' : '#ef4444',
                        boxShadow: `0 0 6px ${currentTurn === mySessionId ? '#22c55e' : '#ef4444'}`
                    }} />
                    <span style={{ fontWeight: 600 }}>
                        {gameStatus === 'waiting' ? '待機中...' :
                            currentTurn === mySessionId ? 'あなたの番' : `${opponentName || '相手'}の番`}
                    </span>
                    {myBallType && (
                        <span style={{ color: myBallType === 'solid' ? '#f4c430' : '#a855f7', fontWeight: 600 }}>
                            {myBallType === 'solid' ? '●1-7' : '◐9-15'}
                        </span>
                    )}
                </div>
            ) : (
                /* Desktop: Full panel at top left */
                <div style={{
                    position: 'absolute', top: 20, left: 20,
                    padding: '16px 20px',
                    background: 'rgba(0,0,0,0.85)', borderRadius: '10px',
                    backdropFilter: 'blur(8px)',
                    minWidth: '200px'
                }}>
                    <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>🎱 8-Ball</h1>
                    {mode === 'solo' ? (
                        <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#a1a1aa' }}>練習モード</p>
                    ) : (
                        <div style={{ marginTop: '12px' }}>
                            {/* Current player info */}
                            <div style={{
                                padding: '10px 12px',
                                background: currentTurn === mySessionId ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                border: currentTurn === mySessionId ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid transparent',
                                marginBottom: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: currentTurn === mySessionId ? '#22c55e' : '#666',
                                        boxShadow: currentTurn === mySessionId ? '0 0 8px #22c55e' : 'none'
                                    }} />
                                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                                        {playerName || 'あなた'}
                                    </span>
                                </div>
                                {myBallType && (
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: myBallType === 'solid' ? '#f4c430' : '#a855f7',
                                        marginLeft: '18px'
                                    }}>
                                        {myBallType === 'solid' ? '● ソリッド (1-7)' : '◐ ストライプ (9-15)'}
                                    </span>
                                )}
                            </div>

                            {/* Opponent info */}
                            <div style={{
                                padding: '10px 12px',
                                background: currentTurn !== mySessionId ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                border: currentTurn !== mySessionId ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: currentTurn !== mySessionId ? '#ef4444' : '#666',
                                        boxShadow: currentTurn !== mySessionId ? '0 0 8px #ef4444' : 'none'
                                    }} />
                                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{opponentName || '相手'}</span>
                                </div>
                                {myBallType && (
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: myBallType === 'solid' ? '#a855f7' : '#f4c430',
                                        marginLeft: '18px'
                                    }}>
                                        {myBallType === 'solid' ? '◐ ストライプ (9-15)' : '● ソリッド (1-7)'}
                                    </span>
                                )}
                            </div>

                            {/* Status message */}
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: '#a1a1aa', textAlign: 'center' }}>
                                {gameStatus === 'waiting' ? '対戦相手を待っています...' :
                                    gameStatus === 'playing' ? (currentTurn === mySessionId ? 'あなたの番です' : '相手の番です') :
                                        gameStatus}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Top Right - Pocketed Balls (Hide on mobile) */}
            {!isMobile && pocketedBalls.length > 0 && (
                <div style={{ position: 'absolute', top: 20, right: 80, padding: '12px 16px', background: 'rgba(0,0,0,0.8)', borderRadius: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '0.8rem', marginRight: '4px' }}>Pocketed:</span>
                    {pocketedBalls.sort((a, b) => a - b).map(id => <MiniPocketedBall key={id} id={id} />)}
                </div>
            )}

            {/* Foul Message - Smaller on mobile, positioned higher */}
            {foulMessage && (
                <div style={{
                    position: 'absolute',
                    top: isMobile ? '15%' : '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: isMobile ? '8px 16px' : '20px 40px',
                    background: 'rgba(220, 38, 38, 0.8)', // More transparent
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1.8rem',
                    fontWeight: 700,
                    zIndex: 100,
                    pointerEvents: 'none', // Allow clicks through
                    whiteSpace: 'nowrap'
                }}>
                    {foulMessage}
                </div>
            )}

            {/* Ball-in-Hand Indicator */}
            {isPlacing && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '20px 32px', background: 'rgba(59, 130, 246, 0.95)', borderRadius: '14px', color: '#fff', fontSize: '1.2rem', fontWeight: 600, textAlign: 'center' }}>
                    🎱 Click to place cue ball
                </div>
            )}

            {isMoving && !isPlacing && (
                <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', padding: '8px 20px', background: 'rgba(0,0,0,0.7)', borderRadius: '20px', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 500 }}>
                    ● Balls in motion...
                </div>
            )}

            {winner && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: winner === mySessionId ? '#4ade80' : '#f87171', marginBottom: '20px' }}>
                        {winner === mySessionId ? "🏆 YOU WIN!" : "💔 YOU LOSE"}
                    </h2>
                    <button onClick={() => window.location.reload()} style={{ padding: '14px 32px', fontSize: '1.1rem', fontWeight: 600, background: '#fff', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                        Play Again
                    </button>
                </div>
            )}

            {/* Power Gauge - Smaller on mobile */}
            {isDragging && (
                <div style={{ position: 'absolute', bottom: isMobile ? 15 : 30, right: isMobile ? 15 : 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: isMobile ? '24px' : '30px', height: isMobile ? '100px' : '150px', background: 'rgba(0,0,0,0.8)', borderRadius: '12px', padding: '3px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <div style={{
                            width: isMobile ? '18px' : '24px',
                            height: `${dragPower * 100}%`,
                            background: dragPower < 0.3 ? '#22c55e' : dragPower < 0.7 ? '#eab308' : '#ef4444',
                            borderRadius: '10px',
                            transition: 'height 0.05s, background 0.1s',
                            boxShadow: `0 0 8px ${dragPower < 0.3 ? '#22c55e' : dragPower < 0.7 ? '#eab308' : '#ef4444'}`
                        }} />
                    </div>
                    <span style={{ color: '#fff', fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: 600 }}>
                        {Math.round(dragPower * 100)}%
                    </span>
                </div>
            )}

            {/* Exit Button - Smaller on mobile */}
            <button onClick={() => window.location.href = '/billiards'} style={{
                position: 'absolute', top: isMobile ? 10 : 20, right: isMobile ? 10 : 20,
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: isMobile ? '6px 12px' : '10px 18px',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: isMobile ? '0.75rem' : '0.9rem', fontWeight: 500
            }}>
                戻る
            </button>

            {/* Portrait Mode Overlay */}
            {isPortrait && isMobile && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.95)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '24px', padding: '20px'
                }}>
                    <div style={{ fontSize: '4rem' }}>📱↔️</div>
                    <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', margin: 0 }}>
                        横向きにしてください
                    </h2>
                    <p style={{ color: '#a1a1aa', fontSize: '0.95rem', textAlign: 'center', margin: 0 }}>
                        ビリヤードは横画面でプレイします
                    </p>
                    <div style={{
                        width: '80px', height: '40px',
                        border: '2px solid #fff', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'rotate90 1.5s ease-in-out infinite'
                    }}>
                        <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }} />
                    </div>
                    <style>{`
                        @keyframes rotate90 {
                            0%, 100% { transform: rotate(0deg); }
                            50% { transform: rotate(90deg); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}

