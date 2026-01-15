import Matter from "matter-js";

// ===== TABLE DIMENSIONS =====
export const TABLE_WIDTH = 800;
export const TABLE_HEIGHT = 400;
export const BALL_RADIUS = 10;
export const WALL_THICKNESS = 30;
export const POCKET_RADIUS = 14; // Slightly larger than ball radius (10)

// Pocket positions (center of each pocket zone)
export const POCKETS = [
    { x: 0, y: 0 },                           // Top-Left
    { x: TABLE_WIDTH / 2, y: 0 },              // Top-Center
    { x: TABLE_WIDTH, y: 0 },                  // Top-Right
    { x: 0, y: TABLE_HEIGHT },                 // Bottom-Left
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },   // Bottom-Center
    { x: TABLE_WIDTH, y: TABLE_HEIGHT }        // Bottom-Right
];

// ===== REALISTIC BILLIARDS PHYSICS =====
// Real billiard ball: 170g, radius 26.25mm
// Our scale: radius 10px, need to adjust density accordingly
// Key: high restitution (0.95+), low friction, appropriate mass

const PHYSICS = {
    // Ball properties - optimized for realistic collisions
    BALL_RESTITUTION: 0.96,      // Nearly perfect elastic collisions
    BALL_FRICTION: 0.03,         // Very low ball-ball friction
    BALL_FRICTION_AIR: 0.008,    // Low cloth resistance for longer rolls
    BALL_DENSITY: 0.005,         // Lower density = more scatter on impact
    BALL_FRICTION_STATIC: 0.05,  // Low static friction

    // Cushion/Rail properties  
    CUSHION_RESTITUTION: 0.92,   // High bounce off walls
    CUSHION_FRICTION: 0.02,      // Very low rail friction

    // Engine precision - higher = more accurate collisions
    POSITION_ITERATIONS: 20,
    VELOCITY_ITERATIONS: 20
};

export const setupBilliardsWorld = (engine: Matter.Engine) => {
    const World = Matter.World;
    const Bodies = Matter.Bodies;

    engine.world.gravity.x = 0;
    engine.world.gravity.y = 0;
    engine.positionIterations = PHYSICS.POSITION_ITERATIONS;
    engine.velocityIterations = PHYSICS.VELOCITY_ITERATIONS;

    // ===== CUSHIONS (Rails) =====
    const cushionOptions = {
        isStatic: true,
        restitution: PHYSICS.CUSHION_RESTITUTION,
        friction: PHYSICS.CUSHION_FRICTION,
        frictionStatic: 0,
        label: 'cushion'
    };

    const WALL_SIZE = 500;

    // Complete box boundary
    World.add(engine.world, Bodies.rectangle(
        TABLE_WIDTH / 2, -WALL_SIZE / 2,
        TABLE_WIDTH + WALL_SIZE, WALL_SIZE, cushionOptions
    ));
    World.add(engine.world, Bodies.rectangle(
        TABLE_WIDTH / 2, TABLE_HEIGHT + WALL_SIZE / 2,
        TABLE_WIDTH + WALL_SIZE, WALL_SIZE, cushionOptions
    ));
    World.add(engine.world, Bodies.rectangle(
        -WALL_SIZE / 2, TABLE_HEIGHT / 2,
        WALL_SIZE, TABLE_HEIGHT + WALL_SIZE, cushionOptions
    ));
    World.add(engine.world, Bodies.rectangle(
        TABLE_WIDTH + WALL_SIZE / 2, TABLE_HEIGHT / 2,
        WALL_SIZE, TABLE_HEIGHT + WALL_SIZE, cushionOptions
    ));

    // ===== BALLS =====
    const startX = TABLE_WIDTH * 0.75;
    const startY = TABLE_HEIGHT / 2;

    // Standard 8-ball rack arrangement
    const rackIds = [
        [1],
        [9, 2],
        [3, 8, 10],
        [11, 4, 12, 5],
        [6, 13, 15, 14, 7]
    ];

    const balls: Matter.Body[] = [];

    // Triangle rack - tight packing
    for (let row = 0; row < 5; row++) {
        const rowIds = rackIds[row];
        for (let col = 0; col < rowIds.length; col++) {
            const id = rowIds[col];
            const x = startX + row * (BALL_RADIUS * 2 * 0.866);
            const y = startY + (col - (row / 2)) * (BALL_RADIUS * 2 + 0.3);
            balls.push(createBall(x, y, id));
        }
    }

    // Cue ball
    const cueBall = createBall(TABLE_WIDTH * 0.25, TABLE_HEIGHT / 2, 0);
    balls.push(cueBall);

    World.add(engine.world, balls);

    return { balls, cueBall };
};

const createBall = (x: number, y: number, id: number) => {
    return Matter.Bodies.circle(x, y, BALL_RADIUS, {
        restitution: PHYSICS.BALL_RESTITUTION,
        friction: PHYSICS.BALL_FRICTION,
        frictionAir: PHYSICS.BALL_FRICTION_AIR,
        frictionStatic: PHYSICS.BALL_FRICTION_STATIC,
        density: PHYSICS.BALL_DENSITY,
        slop: 0.001,  // Minimal penetration for clean collisions
        label: `ball_${id}`,
    });
};

// Utility function to check if a ball is in a pocket
export const isInPocket = (ballX: number, ballY: number): boolean => {
    for (const pocket of POCKETS) {
        const dx = ballX - pocket.x;
        const dy = ballY - pocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < POCKET_RADIUS) {
            return true;
        }
    }
    return false;
};
