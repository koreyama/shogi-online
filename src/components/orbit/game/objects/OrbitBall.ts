import Phaser from 'phaser';

export class OrbitBall extends Phaser.Physics.Matter.Image {
    public tier: number;
    public radius: number;
    public id: string;
    public isSafe: boolean = false; // If true, ignored by game over logic temporarily (e.g. while falling)

    // Tier configuration: Color and Size
    private readonly TIER_CONFIG = [
        { color: 0xef4444, radius: 15 }, // 0: Red (Small)
        { color: 0xf97316, radius: 20 }, // 1: Orange
        { color: 0xeab308, radius: 28 }, // 2: Yellow
        { color: 0x22c55e, radius: 36 }, // 3: Green
        { color: 0x06b6d4, radius: 46 }, // 4: Cyan
        { color: 0x3b82f6, radius: 58 }, // 5: Blue
        { color: 0xa855f7, radius: 72 }, // 6: Purple
        { color: 0xd946ef, radius: 88 }, // 7: Pink
        { color: 0xffffff, radius: 106 }, // 8: White (Star)
        { color: 0xffd700, radius: 130 },  // 9: Gold (Sun - Max)
        { color: 0x222222, radius: 12 }    // 10: Meteor (Heavy, Small)
    ];

    constructor(world: Phaser.Physics.Matter.World, x: number, y: number, tier: number) {
        // Ensure tier is valid (allow 10 for meteor)
        const safeTier = tier === 10 ? 10 : Math.min(Math.max(0, tier), 9);
        const config = [
            { color: 0xef4444, radius: 15 }, // 0: Red (Small)
            { color: 0xf97316, radius: 20 }, // 1: Orange
            { color: 0xeab308, radius: 28 }, // 2: Yellow
            { color: 0x22c55e, radius: 36 }, // 3: Green
            { color: 0x06b6d4, radius: 46 }, // 4: Cyan
            { color: 0x3b82f6, radius: 58 }, // 5: Blue
            { color: 0xa855f7, radius: 72 }, // 6: Purple
            { color: 0xd946ef, radius: 88 }, // 7: Pink
            { color: 0xffffff, radius: 106 }, // 8: White (Star)
            { color: 0xffd700, radius: 130 }, // 9: Gold (Sun - Max)
            { color: 0x222222, radius: 12 }   // 10: Meteor
        ][safeTier];

        const key = `planet_${safeTier}`;
        super(world, x, y, key);

        this.tier = safeTier;
        this.radius = config.radius;
        this.id = Phaser.Math.RND.uuid();

        // Physics Body
        const density = safeTier === 10 ? 0.05 : 0.005; // Meteor is 10x heavier
        this.setCircle(this.radius, {
            restitution: 0.1,
            friction: 0.1,
            frictionAir: 0.08,
            density: density
        });

        this.setBounce(0.1);
    }

    // Helper to generate textures if not present
    static generateTextures(scene: Phaser.Scene) {
        const configs = [
            { color: 0xef4444, radius: 15 }, // 0
            { color: 0xf97316, radius: 20 }, // 1
            { color: 0xeab308, radius: 28 }, // 2
            { color: 0x22c55e, radius: 36 }, // 3
            { color: 0x06b6d4, radius: 46 }, // 4
            { color: 0x3b82f6, radius: 58 }, // 5
            { color: 0xa855f7, radius: 72 }, // 6
            { color: 0xd946ef, radius: 88 }, // 7
            { color: 0xffffff, radius: 106 }, // 8
            { color: 0xffd700, radius: 130 }, // 9
            { color: 0x222222, radius: 12 }   // 10
        ];

        configs.forEach((cfg, idx) => {
            const key = `planet_${idx}`;
            if (!scene.textures.exists(key)) {
                const g = scene.make.graphics({ x: 0, y: 0 });
                const size = cfg.radius * 2;

                // Base
                g.fillStyle(cfg.color);
                g.fillCircle(cfg.radius, cfg.radius, cfg.radius);

                // Shadow / Depth
                g.fillStyle(0x000000, 0.2);
                g.fillCircle(cfg.radius, cfg.radius, cfg.radius * 0.85);

                if (idx === 10) {
                    // Meteor texture detail
                    g.fillStyle(0x555555, 1);
                    g.fillCircle(cfg.radius * 0.5, cfg.radius * 0.5, 3);
                    g.fillCircle(cfg.radius * 1.5, cfg.radius * 1.2, 2);
                } else {
                    g.fillStyle(cfg.color); // Restore center
                    g.fillCircle(cfg.radius - 2, cfg.radius - 2, cfg.radius * 0.8);
                }

                // Highlight/Crater
                g.fillStyle(0xffffff, 0.3);
                g.fillCircle(cfg.radius - cfg.radius * 0.3, cfg.radius - cfg.radius * 0.3, cfg.radius * 0.2);

                g.generateTexture(key, size, size);
                g.destroy();
            }
        });
    }
}
