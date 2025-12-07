import React, { useEffect, useRef } from 'react';
import { THEME } from './styles';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    type: 'spark' | 'smoke' | 'glitch';
}

interface ParticleCanvasProps {
    width: number;
    height: number;
    events: PEvent[];
}

export interface PEvent {
    type: 'trigger_spark';
    x: number;
    y: number;
    color: string;
}

export const ParticleCanvas = ({ width, height, events }: ParticleCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);

    // Handle incoming events
    useEffect(() => {
        if (!events.length) return;
        const lastEvent = events[events.length - 1]; // Just handle latest for now to avoid complexity

        if (lastEvent.type === 'trigger_spark') {
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                particles.current.push({
                    x: lastEvent.x,
                    y: lastEvent.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    maxLife: 1.0,
                    size: Math.random() * 3 + 1,
                    color: lastEvent.color,
                    type: 'spark'
                });
            }
        }
    }, [events]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Update and Draw Particles
            for (let i = particles.current.length - 1; i >= 0; i--) {
                const p = particles.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;

                // Gravity/Friction
                p.vy += 0.05; // Gravity
                p.vx *= 0.95;
                p.vy *= 0.95;

                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            animationFrame = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrame);
    }, [width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 20
            }}
        />
    );
};
