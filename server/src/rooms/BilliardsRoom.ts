import { Room, Client } from "colyseus";
import { BilliardsState, Ball } from "./schema/BilliardsState";
import Matter from "matter-js";

const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 400;
const BALL_RADIUS = 10;
const POCKET_RADIUS = 14; // Slightly larger than ball radius (10)

const POCKETS = [
    { x: 0, y: 0 },
    { x: TABLE_WIDTH / 2, y: 0 },
    { x: TABLE_WIDTH, y: 0 },
    { x: 0, y: TABLE_HEIGHT },
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
    { x: TABLE_WIDTH, y: TABLE_HEIGHT }
];

// ===== REALISTIC BILLIARDS PHYSICS (Synced with Client) =====
const PHYSICS = {
    BALL_RESTITUTION: 0.96,      // Nearly perfect elastic collisions
    BALL_FRICTION: 0.03,         // Very low ball-ball friction
    BALL_FRICTION_AIR: 0.008,    // Low cloth resistance
    BALL_DENSITY: 0.005,         // Lower density = more scatter
    BALL_FRICTION_STATIC: 0.05,  // Low static friction
    CUSHION_RESTITUTION: 0.92,   // High bounce off walls
    CUSHION_FRICTION: 0.02,      // Very low rail friction
    POSITION_ITERATIONS: 20,
    VELOCITY_ITERATIONS: 20
};

export class BilliardsRoom extends Room<BilliardsState> {
    engine!: Matter.Engine;
    balls: Map<number, Matter.Body> = new Map();

    isBreaking: boolean = true;
    isTableOpen: boolean = true; // Table is "open" until groups are assigned
    playerAssignments: Map<string, 'solid' | 'stripe'> = new Map();
    turnQueue: string[] = [];
    currentShooter: string = "";

    // Shot tracking
    ballsPocketedThisTurn: number[] = [];
    firstBallHit: number | null = null;
    cueBallHitAnything: boolean = false;
    wasMoving: boolean = false;
    shotInProgress: boolean = false;

    onCreate(options: any) {
        // Set metadata for matchmaking (default to public)
        this.setMetadata({ mode: options.mode || "public" });
        this.setState(new BilliardsState());

        this.engine = Matter.Engine.create();
        this.engine.gravity.y = 0;
        this.engine.gravity.x = 0;
        this.engine.positionIterations = PHYSICS.POSITION_ITERATIONS;
        this.engine.velocityIterations = PHYSICS.VELOCITY_ITERATIONS;

        this.setupWorld();
        this.setupCollisionDetection();
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));

        this.onMessage("shoot", (client, message) => {
            if (this.state.status !== 'playing' || this.state.currentTurn !== client.sessionId) return;
            if (this.state.moving || this.state.placingCueBall) return;

            const cueBall = this.balls.get(0);
            if (cueBall) {
                const power = Math.min(Math.max(message.power, 0), 0.15); // Gentle power
                const force = {
                    x: Math.cos(message.angle) * power,
                    y: Math.sin(message.angle) * power
                };
                Matter.Body.applyForce(cueBall, cueBall.position, force);

                // Reset shot tracking
                this.ballsPocketedThisTurn = [];
                this.firstBallHit = null;
                this.cueBallHitAnything = false;
                this.shotInProgress = true;
            }
        });

        this.onMessage("placeCueBall", (client, message) => {
            if (this.state.currentTurn !== client.sessionId) return;
            if (!this.state.placingCueBall) return;

            const { x, y } = message;
            const margin = BALL_RADIUS + 5;
            const clampedX = Math.max(margin, Math.min(TABLE_WIDTH - margin, x));
            const clampedY = Math.max(margin, Math.min(TABLE_HEIGHT - margin, y));

            let validPosition = true;
            this.balls.forEach((body, id) => {
                if (id === 0) return;
                const schema = this.state.balls.get(String(id));
                if (!schema?.visible) return;

                const dx = body.position.x - clampedX;
                const dy = body.position.y - clampedY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < BALL_RADIUS * 2.5) {
                    validPosition = false;
                }
            });

            if (!validPosition) return;

            const cueBall = this.balls.get(0);
            if (cueBall) {
                Matter.Body.setPosition(cueBall, { x: clampedX, y: clampedY });
                Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });

                const schema = this.state.balls.get("0");
                if (schema) {
                    schema.x = clampedX;
                    schema.y = clampedY;
                    schema.visible = true;
                }

                this.state.placingCueBall = false;
                this.state.foulMessage = "";
            }
        });
    }

    setupCollisionDetection() {
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            for (const pair of event.pairs) {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check if cue ball hit another ball
                if (bodyA.label === 'ball_0' || bodyB.label === 'ball_0') {
                    const otherBody = bodyA.label === 'ball_0' ? bodyB : bodyA;

                    if (otherBody.label.startsWith('ball_')) {
                        this.cueBallHitAnything = true;

                        const otherBallId = parseInt(otherBody.label.split('_')[1]);

                        // Track first ball hit
                        if (this.firstBallHit === null) {
                            this.firstBallHit = otherBallId;
                        }
                    }
                }
            }
        });
    }

    playerNames: Map<string, string> = new Map();

    onJoin(client: Client, options: any) {
        this.turnQueue.push(client.sessionId);

        // Store player name from options
        const playerName = options?.playerName || `Player ${this.turnQueue.length}`;
        this.playerNames.set(client.sessionId, playerName);

        // Update state with player names
        if (this.turnQueue.length === 1) {
            this.state.player1Name = playerName;
        } else if (this.turnQueue.length === 2) {
            this.state.player2Name = playerName;
        }

        if (this.turnQueue.length === 2 && this.state.status === 'waiting') {
            this.startGame();
        }
    }

    startGame() {
        this.state.status = 'playing';
        this.currentShooter = this.turnQueue[0];
        this.state.currentTurn = this.currentShooter;
        this.isBreaking = true;
        this.isTableOpen = true;
        this.playerAssignments.clear();
        this.state.foulMessage = "";
        this.state.player1Id = this.turnQueue[0];
        this.state.player2Id = this.turnQueue[1] || "";
        this.state.player1Type = "";
        this.state.player2Type = "";
    }

    switchTurn() {
        const currentIndex = this.turnQueue.indexOf(this.state.currentTurn);
        const nextIndex = (currentIndex + 1) % this.turnQueue.length;
        this.state.currentTurn = this.turnQueue[nextIndex];
        this.currentShooter = this.state.currentTurn;
    }

    getBallType(ballId: number): 'solid' | 'stripe' | 'cue' | 'eight' {
        if (ballId === 0) return 'cue';
        if (ballId === 8) return 'eight';
        if (ballId < 8) return 'solid';
        return 'stripe';
    }

    handleTurnEnd() {
        if (!this.shotInProgress) return;
        this.shotInProgress = false;

        let fouled = false;
        let foulReason = "";
        let lostGame = false;
        let turnContinues = false;

        const pocketed = this.ballsPocketedThisTurn;
        const shooterType = this.playerAssignments.get(this.currentShooter);
        const opponent = this.turnQueue.find(id => id !== this.currentShooter);

        // ===== FOUL DETECTION =====

        // 1. Scratch (cue ball pocketed)
        if (pocketed.includes(0)) {
            fouled = true;
            foulReason = "スクラッチ！";
        }

        // 2. No ball hit at all
        if (!this.cueBallHitAnything && !fouled) {
            fouled = true;
            foulReason = "空振り！";
        }

        // 3. Check first ball hit
        if (this.firstBallHit !== null && !fouled) {
            const firstBallType = this.getBallType(this.firstBallHit);

            if (this.isTableOpen) {
                // Open table: hitting 8-ball first is a foul
                if (firstBallType === 'eight') {
                    fouled = true;
                    foulReason = "8番に先に当てた！";
                }
            } else if (shooterType) {
                // Groups assigned: must hit own ball first
                if (firstBallType === 'eight') {
                    // Check if shooter has cleared all their balls
                    const remainingOwnBalls = this.countRemainingBalls(shooterType);
                    if (remainingOwnBalls > 0) {
                        fouled = true;
                        foulReason = "自分のボールを先にクリアして！";
                    }
                } else if (firstBallType !== shooterType) {
                    // Hit opponent's ball first
                    fouled = true;
                    foulReason = "相手のボールに先に当てた！";
                }
            }
        }

        if (pocketed.includes(8)) {
            if (this.isTableOpen) {
                // Pocketing 8-ball on open table = loss
                lostGame = true;
                foulReason = "8番を早く落とした！";
            } else if (shooterType) {
                const remainingOwnBalls = this.countRemainingBalls(shooterType);
                if (remainingOwnBalls > 0) {
                    // Pocketed 8-ball before clearing own balls = loss
                    lostGame = true;
                    foulReason = "8番を早く落とした！";
                } else if (fouled) {
                    // Fouled while pocketing 8-ball = loss
                    lostGame = true;
                    foulReason = "8番でファウル！";
                } else {
                    // Legal 8-ball pocket = WIN!
                    this.state.winner = this.currentShooter;
                    this.state.status = 'ended';
                    return;
                }
            }
        }

        if (lostGame) {
            this.state.winner = opponent || "";
            this.state.status = 'ended';
            this.state.foulMessage = foulReason;
            return;
        }

        // ===== GROUP ASSIGNMENT (First legally pocketed ball) =====
        if (this.isTableOpen && !fouled && pocketed.length > 0) {
            const firstValid = pocketed.find(id => id !== 0 && id !== 8);
            if (firstValid !== undefined) {
                const type = this.getBallType(firstValid);
                if (type === 'solid' || type === 'stripe') {
                    this.playerAssignments.set(this.currentShooter, type);
                    const otherType = type === 'solid' ? 'stripe' : 'solid';
                    if (opponent) this.playerAssignments.set(opponent, otherType);
                    this.isTableOpen = false;

                    // Set player types for each player
                    const player1 = this.turnQueue[0];
                    const player2 = this.turnQueue[1];
                    this.state.player1Type = this.playerAssignments.get(player1) || '';
                    this.state.player2Type = this.playerAssignments.get(player2) || '';
                }
            }
        }

        // ===== TURN CONTINUATION =====
        if (!fouled && pocketed.length > 0 && !this.isTableOpen && shooterType) {
            // Check if pocketed own ball
            const pocketedOwnBall = pocketed.some(id => {
                if (id === 0 || id === 8) return false;
                return this.getBallType(id) === shooterType;
            });
            if (pocketedOwnBall) turnContinues = true;
        } else if (!fouled && pocketed.length > 0 && this.isTableOpen) {
            // On open table, pocketing any ball (except 8) continues turn
            const pocketedValid = pocketed.some(id => id !== 0 && id !== 8);
            if (pocketedValid) turnContinues = true;
        }

        // ===== APPLY FOUL / SWITCH TURN =====
        if (fouled) {
            this.state.foulMessage = foulReason;
            this.state.placingCueBall = true;
        }

        if (!turnContinues) {
            this.switchTurn();
        }
    }

    countRemainingBalls(type: 'solid' | 'stripe'): number {
        let count = 0;
        this.state.balls.forEach((ball, id) => {
            const ballId = parseInt(id);
            if (ball.visible && this.getBallType(ballId) === type) {
                count++;
            }
        });
        return count;
    }

    setupWorld() {
        const World = Matter.World;
        const Bodies = Matter.Bodies;

        const cushionOptions = {
            isStatic: true,
            restitution: PHYSICS.CUSHION_RESTITUTION,
            friction: PHYSICS.CUSHION_FRICTION,
            frictionStatic: 0,
            label: 'cushion'
        };
        const WALL_SIZE = 500;

        World.add(this.engine.world, Bodies.rectangle(TABLE_WIDTH / 2, -WALL_SIZE / 2, TABLE_WIDTH + WALL_SIZE, WALL_SIZE, cushionOptions));
        World.add(this.engine.world, Bodies.rectangle(TABLE_WIDTH / 2, TABLE_HEIGHT + WALL_SIZE / 2, TABLE_WIDTH + WALL_SIZE, WALL_SIZE, cushionOptions));
        World.add(this.engine.world, Bodies.rectangle(-WALL_SIZE / 2, TABLE_HEIGHT / 2, WALL_SIZE, TABLE_HEIGHT + WALL_SIZE, cushionOptions));
        World.add(this.engine.world, Bodies.rectangle(TABLE_WIDTH + WALL_SIZE / 2, TABLE_HEIGHT / 2, WALL_SIZE, TABLE_HEIGHT + WALL_SIZE, cushionOptions));

        const startX = TABLE_WIDTH * 0.75;
        const startY = TABLE_HEIGHT / 2;
        const rackIds = [[1], [9, 2], [3, 8, 10], [11, 4, 12, 5], [6, 13, 15, 14, 7]];

        for (let row = 0; row < 5; row++) {
            const rowIds = rackIds[row];
            for (let col = 0; col < rowIds.length; col++) {
                const id = rowIds[col];
                const x = startX + row * (BALL_RADIUS * 2 * 0.866);
                const y = startY + (col - (row / 2)) * (BALL_RADIUS * 2 + 0.5);
                this.createBall(x, y, id);
            }
        }
        this.createBall(TABLE_WIDTH * 0.25, TABLE_HEIGHT / 2, 0);
    }

    createBall(x: number, y: number, id: number) {
        const ball = Matter.Bodies.circle(x, y, BALL_RADIUS, {
            restitution: PHYSICS.BALL_RESTITUTION,
            friction: PHYSICS.BALL_FRICTION,
            frictionAir: PHYSICS.BALL_FRICTION_AIR,
            frictionStatic: PHYSICS.BALL_FRICTION_STATIC,
            density: PHYSICS.BALL_DENSITY,
            slop: 0.001, // Minimal penetration for clean collisions
            label: `ball_${id}`
        });
        this.balls.set(id, ball);
        Matter.World.add(this.engine.world, ball);

        const ballSchema = new Ball();
        ballSchema.id = id;
        ballSchema.x = x;
        ballSchema.y = y;
        ballSchema.type = (id === 0) ? 0 : (id === 8 ? 3 : (id < 8 ? 1 : 2));
        ballSchema.visible = true;
        this.state.balls.set(String(id), ballSchema);
    }

    update(deltaTime: number) {
        Matter.Engine.update(this.engine, deltaTime);

        const bodiesToRemove: Matter.Body[] = [];

        this.balls.forEach((body, id) => {
            const schema = this.state.balls.get(String(id));
            if (!schema || !schema.visible) return;

            for (const pocket of POCKETS) {
                const dx = body.position.x - pocket.x;
                const dy = body.position.y - pocket.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < POCKET_RADIUS) {
                    if (!this.ballsPocketedThisTurn.includes(id)) {
                        this.ballsPocketedThisTurn.push(id);
                    }
                    if (id === 0) {
                        Matter.Body.setPosition(body, { x: -200, y: -200 });
                        Matter.Body.setVelocity(body, { x: 0, y: 0 });
                        schema.visible = false;
                    } else {
                        schema.visible = false;
                        bodiesToRemove.push(body);
                    }
                    break;
                }
            }

            if (schema.visible) {
                schema.x = body.position.x;
                schema.y = body.position.y;
            }
        });

        bodiesToRemove.forEach(body => {
            Matter.World.remove(this.engine.world, body);
        });

        const currentlyMoving = this.isMoving();
        this.state.moving = currentlyMoving;

        if (this.wasMoving && !currentlyMoving && this.shotInProgress) {
            this.handleTurnEnd();
        }
        this.wasMoving = currentlyMoving;
    }

    isMoving(): boolean {
        for (const [id, body] of this.balls) {
            const schema = this.state.balls.get(String(id));
            if (schema?.visible && body.speed > 0.08) {
                return true;
            }
        }
        return false;
    }

    onLeave(client: Client, consented: boolean) {
        // When a player leaves during a game, end the game
        if (this.state.status === 'playing' || this.state.status === 'waiting') {
            const remainingPlayer = this.turnQueue.find(id => id !== client.sessionId);
            if (remainingPlayer && this.state.status === 'playing') {
                // The remaining player wins by forfeit
                this.state.winner = remainingPlayer;
                this.state.foulMessage = "相手が退出しました";
            }
            this.state.status = 'ended';
        }

        // Remove from turn queue
        const index = this.turnQueue.indexOf(client.sessionId);
        if (index > -1) {
            this.turnQueue.splice(index, 1);
        }
        this.playerNames.delete(client.sessionId);
    }

    onDispose() {
        Matter.World.clear(this.engine.world, false);
        Matter.Engine.clear(this.engine);
    }
}
