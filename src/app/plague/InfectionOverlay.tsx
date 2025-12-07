import React, { useEffect, useRef } from 'react';
import { REGION_CENTERS } from '@/lib/plague/mapData';
import { Region } from '@/lib/plague/types';
import { THEME } from './styles';

interface InfectionOverlayProps {
    regions: Record<string, Region>;
}

export const InfectionOverlay = ({ regions }: InfectionOverlayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const render = () => {
            time += 0.05;
            // Clear but keep a trail? No, full clear for this effect.
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw "Metaball" bases (soft circles)
            // We'll rely on CSS filter: blur(10px) contrast(20) on the canvas parent to goo-ify it?
            // Or just draw soft gradients.

            ctx.globalCompositeOperation = 'screen'; // Additive blending for glow

            Object.values(regions).forEach(region => {
                const center = REGION_CENTERS[region.id];
                if (!center) return;

                // Scale coordinates from 800x400 SVG space to Canvas space
                // Assuming canvas is sized to match container
                const scaleX = canvas.width / 800;
                const scaleY = canvas.height / 400;

                const x = center.x * scaleX;
                const y = center.y * scaleY;

                const percentage = region.infected / region.population;
                if (percentage <= 0) return;

                // Radius grows with percentage, plus a pulse
                const baseRadius = 20 + (percentage * 100);
                const pulse = Math.sin(time + x) * 5;
                const radius = Math.max(0, baseRadius + pulse);

                // Draw Gradient
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

                // Color: Bio-Digital Red/Pink
                // Inner is bright, outer is dark
                gradient.addColorStop(0, 'rgba(255, 42, 109, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 42, 109, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 42, 109, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // 2. Add some "Digital Noise" specs?
            // Maybe random pixels

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [regions]);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={400}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: 0.7,
                filter: 'blur(8px) contrast(2)', // increased blur/contrast for metaball effect
                mixBlendMode: 'lighten', // Blend with map
                zIndex: 5
            }}
        />
    );
};
