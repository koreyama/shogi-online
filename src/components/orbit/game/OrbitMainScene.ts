import * as Phaser from 'phaser';
import { OrbitBall } from './objects/OrbitBall';

export class OrbitMainScene extends Phaser.Scene {
    private graphics: Phaser.GameObjects.Graphics | null = null;
    private balls: OrbitBall[] = [];

    // Game Config
    private readonly GAME_SIZE = 800; // Assuming 800x800 internal res
    private readonly CENTER_X = 400;
    private readonly CENTER_Y = 400;
    private readonly CORE_RADIUS = 40;
    private readonly SPAWN_RADIUS = 350;
    private readonly ATMOSPHERE_RADIUS = 300; // Game Over Line

    // State
    private nextTier: number = 0;
    private canShoot: boolean = true;
    private score: number = 0;
    private highScore: number = 0; // Added High Score
    private scoreText: Phaser.GameObjects.Text | null = null;
    private highScoreText: Phaser.GameObjects.Text | null = null; // High Score Text
    private gameOver: boolean = false; // Restored
    private nextBallPreview: Phaser.GameObjects.Image | null = null; // Restored
    private aimingLine: Phaser.GameObjects.Graphics | null = null;

    private coreBody: MatterJS.BodyType | null = null;

    private spinDirection: number = 0; // -1 Left, 0 None, 1 Right

    constructor() {
        super({ key: 'OrbitMainScene' });
    }

    create() {
        this.resetState();

        // Listen for Spin Events
        window.addEventListener('orbit-spin-start', this.handleSpinStart);
        window.addEventListener('orbit-spin-end', this.handleSpinEnd);
        this.events.on('shutdown', () => {
            window.removeEventListener('orbit-spin-start', this.handleSpinStart);
            window.removeEventListener('orbit-spin-end', this.handleSpinEnd);
        });

        // Load High Score
        const saved = localStorage.getItem('orbit_highscore');
        if (saved) {
            this.highScore = parseInt(saved, 10);
        }

        // 1. Setup World & Graphics
        // No Bounds! Things can fly off.
        this.matter.world.setBounds(0, 0, this.GAME_SIZE, this.GAME_SIZE, 100, false, false, false, false); // No walls
        this.graphics = this.add.graphics();
        this.aimingLine = this.add.graphics();

        // Generate Textures
        OrbitBall.generateTextures(this);

        // 2. Create Static Core
        this.createCore();

        // 3. UI
        this.createHUD();

        // 4. Input
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver) return;
            this.updateAiming(pointer);
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver && pointer.primaryDown) {
                this.scene.restart();
                return;
            }
            if (this.canShoot && !this.gameOver) {
                this.shootBall(pointer);
            }
        });

        // 5. Collision (Merge)
        this.matter.world.on('collisionstart', this.handleCollision, this);

        // 6. Next Ball Init
        this.nextTier = Phaser.Math.Between(0, 2);
        this.updateNextballPreview();
    }

    private handleSpinStart = (e: any) => {
        console.log('Spin Start:', e.detail?.direction);
        this.spinDirection = e.detail?.direction || 0;
    };

    private handleSpinEnd = () => {
        console.log('Spin End');
        this.spinDirection = 0;
    };

    private resetState() {
        this.score = 0;
        this.gameOver = false;
        this.balls = [];
        this.canShoot = true;
    }

    private createCore() {
        // Visual
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(this.CENTER_X, this.CENTER_Y, this.CORE_RADIUS);

        // Physics Body (Static Attractor)
        this.coreBody = this.matter.add.circle(this.CENTER_X, this.CENTER_Y, this.CORE_RADIUS, {
            isStatic: true,
            label: 'Core'
        });
    }

    private createHUD() {
        // Background
        this.add.circle(this.CENTER_X, this.CENTER_Y, this.GAME_SIZE, 0x0f0c29).setDepth(-10);

        // Score
        this.add.text(30, 30, 'SCORE', { fontSize: '16px', color: '#888888', fontStyle: 'bold', fontFamily: 'sans-serif' });
        this.scoreText = this.add.text(30, 50, '0', { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' });

        // High Score
        this.add.text(30, 100, 'BEST', { fontSize: '16px', color: '#888888', fontStyle: 'bold', fontFamily: 'sans-serif' });
        this.highScoreText = this.add.text(30, 120, `${this.highScore}`, { fontSize: '24px', color: '#ffd700', fontStyle: 'bold' });

        // Next Ball Label
        this.add.text(this.GAME_SIZE - 100, 30, 'NEXT', { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        // Next Ball Container Background
        const bg = this.add.graphics();
        bg.lineStyle(2, 0xffffff, 0.5); // Brighter border
        bg.strokeCircle(this.GAME_SIZE - 100, 90, 50); // Larger container
        bg.fillStyle(0x000000, 0.6);
        bg.fillCircle(this.GAME_SIZE - 100, 90, 50);

        // Atmosphere Line (Visual)
        const g = this.add.graphics();
        g.lineStyle(2, 0xff4444, 0.5);
        g.strokeCircle(this.CENTER_X, this.CENTER_Y, this.ATMOSPHERE_RADIUS);

        // Dashed styling not easily supported in minimal, but this is fine.
        // Add "Danger Zone" text
        this.add.text(this.CENTER_X, this.CENTER_Y - this.ATMOSPHERE_RADIUS - 20, 'DANGER ZONE', {
            fontSize: '12px', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    private updateNextballPreview() {
        if (this.nextBallPreview) this.nextBallPreview.destroy();
        const key = `planet_${this.nextTier}`;
        // Centered in the new container, Larger Scale
        this.nextBallPreview = this.add.image(this.GAME_SIZE - 100, 90, key).setScale(1.5);
    }

    private updateAiming(pointer: Phaser.Input.Pointer) {
        if (!this.aimingLine) return;
        this.aimingLine.clear();

        const angle = Phaser.Math.Angle.Between(this.CENTER_X, this.CENTER_Y, pointer.x, pointer.y);

        const spawnX = this.CENTER_X + Math.cos(angle) * this.SPAWN_RADIUS;
        const spawnY = this.CENTER_Y + Math.sin(angle) * this.SPAWN_RADIUS;

        // Draw Line from spawn to center
        this.aimingLine.lineStyle(2, 0xffffff, 0.3);
        this.aimingLine.lineBetween(spawnX, spawnY, this.CENTER_X + Math.cos(angle) * this.CORE_RADIUS, this.CENTER_Y + Math.sin(angle) * this.CORE_RADIUS);

        // Draw Ghost Ball
        this.aimingLine.lineStyle(2, 0xffffff, 0.8);
        this.aimingLine.strokeCircle(spawnX, spawnY, 15 + (this.nextTier * 5)); // Approx size visual
    }

    private shootBall(pointer: Phaser.Input.Pointer) {
        this.canShoot = false;

        const angle = Phaser.Math.Angle.Between(this.CENTER_X, this.CENTER_Y, pointer.x, pointer.y);
        const spawnX = this.CENTER_X + Math.cos(angle) * this.SPAWN_RADIUS;
        const spawnY = this.CENTER_Y + Math.sin(angle) * this.SPAWN_RADIUS;

        // Meteor Chance: 5%
        let tierToSpawn = this.nextTier;
        if (Math.random() < 0.05) {
            tierToSpawn = 10; // Meteor
        }

        const ball = new OrbitBall(this.matter.world, spawnX, spawnY, tierToSpawn);
        ball.setData('isFalling', true); // Mark as initially falling
        this.add.existing(ball);
        this.balls.push(ball);

        // Initial push towards center
        const force = 0.005;
        ball.applyForce(new Phaser.Math.Vector2(-Math.cos(angle) * force, -Math.sin(angle) * force));

        this.time.delayedCall(500, () => {
            this.canShoot = true;
            this.nextTier = Phaser.Math.Between(0, 2);
            this.updateNextballPreview();
        });
    }

    override update(time: number, delta: number) {
        if (this.gameOver) return;

        this.applyCentralGravity();
        this.checkGameOver();
    }

    private applyCentralGravity() {
        const GRAVITY_STRENGTH = 0.0003;

        for (const b of this.balls) {
            if (!b.body) continue;

            // Optimization & Jitter Fix: Don't apply forces if body is sleeping (stabilized)
            // UNLESS we are trying to spin them!
            // @ts-ignore
            if (b.body.isSleeping) {
                if (this.spinDirection !== 0) {
                    // @ts-ignore
                    Phaser.Physics.Matter.Matter.Sleeping.set(b.body, false); // Wake up!
                } else {
                    continue; // Skip gravity if sleeping and not spinning
                }
            }

            const dx = this.CENTER_X - b.x;
            const dy = this.CENTER_Y - b.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            if (dist < 10) continue;

            const forceMag = (GRAVITY_STRENGTH * b.body.mass * 1000) / (dist);

            const angle = Math.atan2(dy, dx);
            b.applyForce(new Phaser.Math.Vector2(Math.cos(angle) * forceMag, Math.sin(angle) * forceMag));

            // GALAXY SPIN FORCE
            if (this.spinDirection !== 0) {
                // Force needs to be strong to overcome frictionAir (0.08)
                // And scaled by mass so big planets move too
                // Reduced from 0.02 to 0.003 (Prevent flying off)
                const SPIN_BASE = 0.003;
                const forceMag = SPIN_BASE * b.body.mass;

                // Tangent vector
                const spinAngle = angle + (Math.PI / 2 * this.spinDirection);
                b.applyForce(new Phaser.Math.Vector2(Math.cos(spinAngle) * forceMag, Math.sin(spinAngle) * forceMag));
            }

            // ACTIVE DAMPING: Kill lateral stability (Orbital velocity)
            // Only damp if NOT voluntarily spinning
            // @ts-ignore
            if (b.body && this.spinDirection === 0) {
                // @ts-ignore
                Phaser.Physics.Matter.Matter.Body.setAngularVelocity(b.body, b.body.angularVelocity * 0.9); // Kill spin
            }
        }
    }

    private checkGameOver() {
        for (const b of this.balls) {
            if (!b.active) continue;
            const dx = b.x - this.CENTER_X;
            const dy = b.y - this.CENTER_Y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 1. Inside Atmosphere = Safe
            if (dist < this.ATMOSPHERE_RADIUS) {
                b.setData('isFalling', false);
                b.setData('timeOutside', 0); // Reset timer
            }

            // 2. Outside Atmosphere
            if (dist > this.ATMOSPHERE_RADIUS) {
                // Ignore if just spawned (falling in)
                if (b.getData('isFalling')) continue;

                // Increment Time Outside
                const timeOutside = (b.getData('timeOutside') || 0) + 1;
                b.setData('timeOutside', timeOutside);

                // If outside for > 2 seconds (assuming 60fps, so 120 frames), Game Over
                // This catches "jittering" balls that never technically "stop" but are clearly stuck outside.
                if (timeOutside > 120) {
                    this.triggerGameOver();
                    break;
                }
            }
        }
    }

    private triggerGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;

        // Save High Score (Local)
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('orbit_highscore', this.highScore.toString());

            // Save Global Score (Firebase)
            const userData = this.registry.get('userData');
            if (userData && userData.uid) {
                // Import dynamically to avoid top-level issues if in pure Phaser env (though this is bundled)
                // For safety in this environment, using standard import might be better if simple.
                // Assuming `db` is available via simple import since valid TS setup.
                import('@/lib/firebase').then(({ db }) => {
                    import('firebase/database').then(({ ref, set, serverTimestamp }) => {
                        const scoreRef = ref(db, `orbit_scores/${userData.uid}`);
                        set(scoreRef, {
                            uid: userData.uid,
                            name: userData.displayName,
                            score: this.highScore,
                            timestamp: serverTimestamp()
                        }).catch(err => console.error("Score submit error", err));
                    });
                });
            }
        }

        this.add.rectangle(this.CENTER_X, this.CENTER_Y, this.GAME_SIZE, this.GAME_SIZE, 0x000000, 0.7);
        this.add.text(this.CENTER_X, this.CENTER_Y - 40, 'GAME OVER', {
            fontSize: '64px', color: '#ff4444', fontStyle: 'bold', fontFamily: 'sans-serif'
        }).setOrigin(0.5);

        this.add.text(this.CENTER_X, this.CENTER_Y + 50, `Score: ${this.score}`, {
            fontSize: '32px', color: '#ffffff', fontFamily: 'sans-serif'
        }).setOrigin(0.5);

        this.add.text(this.CENTER_X, this.CENTER_Y + 90, `Best: ${this.highScore}`, {
            fontSize: '24px', color: '#ffd700', fontFamily: 'sans-serif'
        }).setOrigin(0.5);

        this.add.text(this.CENTER_X, this.CENTER_Y + 140, 'Click to Restart', {
            fontSize: '24px', color: '#aaaaaa', fontFamily: 'sans-serif'
        }).setOrigin(0.5);
    }

    private handleCollision(event: Phaser.Physics.Matter.Events.CollisionStartEvent) {
        if (this.gameOver) return;

        event.pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            // @ts-ignore
            const ballA = bodyA.gameObject as OrbitBall;
            // @ts-ignore
            const ballB = bodyB.gameObject as OrbitBall;

            if (ballA instanceof OrbitBall && ballB instanceof OrbitBall) {
                if (ballA.active && ballB.active && ballA.tier === ballB.tier && ballA.id !== ballB.id) {
                    this.mergeBalls(ballA, ballB);
                }
            }
        });
    }

    private mergeBalls(b1: OrbitBall, b2: OrbitBall) {
        if (!b1.active || !b2.active) return;

        // Midpoint
        const mx = (b1.x + b2.x) / 2;
        const my = (b1.y + b2.y) / 2;

        let nextTier = b1.tier + 1;
        // Special Case: Meteor (10) + Meteor (10) -> Red Ball (0)
        if (b1.tier === 10) {
            nextTier = 0;
        }

        b1.destroy();
        b2.destroy();
        this.balls = this.balls.filter(b => b.active);

        // Score
        const points = (nextTier + 1) * 10;
        this.score += points;
        if (this.scoreText) this.scoreText.setText(`${this.score}`);

        // Update HighScore display dynamically if beaten?
        if (this.score > this.highScore) {
            this.highScore = this.score;
            if (this.highScoreText) this.highScoreText.setText(`${this.highScore}`);
        }

        // Show Score Pop
        this.showScorePop(mx, my, points);

        // Spawn New
        const newBall = new OrbitBall(this.matter.world, mx, my, nextTier);
        this.add.existing(newBall);
        this.balls.push(newBall);

        // Particle FX
        this.spawnExplosion(mx, my);
    }

    private showScorePop(x: number, y: number, points: number) {
        const text = this.add.text(x, y, `+${points}`, {
            fontSize: '24px', color: '#ffff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            onComplete: () => text.destroy()
        });
    }

    private spawnExplosion(x: number, y: number) {
        // Simple particle burst
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, 0, 4);
        g.generateTexture('particle_w', 8, 8);
        g.destroy();

        const emitter = this.add.particles(x, y, 'particle_w', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 500,
            quantity: 10,
            blendMode: 'ADD'
        });

        this.time.delayedCall(500, () => emitter.destroy());
    }
}
