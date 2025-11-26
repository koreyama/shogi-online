import React, { useRef, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, onValue, remove } from 'firebase/database';
import { Stroke, Point } from '@/lib/drawing/types';
import { IconPalette, IconEraser, IconTrash } from '@/components/Icons';

interface DrawingCanvasProps {
    roomId: string;
    isDrawer: boolean;
    width: number;
    height: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ roomId, isDrawer, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [isEraser, setIsEraser] = useState(false);

    // Sync strokes from Firebase
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas initially and on room change
        ctx.clearRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const strokesRef = ref(db, `drawing_rooms/${roomId}/strokes`);

        // Listen for ALL value changes to handle clears
        const unsubscribe = onValue(strokesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                // If data is null, it means canvas was cleared
                ctx.clearRect(0, 0, width, height);
                return;
            }

            // If we have data, we need to redraw everything to be safe, 
            // or we can optimize. For now, full redraw on any change is safest for sync
            // but might be heavy. Let's try to just handle additions if possible, 
            // but for "Clear" to work, we need to know when it's empty.

            ctx.clearRect(0, 0, width, height);
            Object.values(data).forEach((stroke: any) => {
                drawStroke(ctx, stroke);
            });
        });

        return () => unsubscribe();
    }, [roomId, width, height]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        ctx.beginPath();
        ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
        ctx.lineWidth = stroke.width;

        const points = stroke.points;
        if (points.length === 0) return;

        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawer) return;
        e.preventDefault(); // Prevent scrolling on touch
        setIsDrawing(true);
        const point = getPoint(e);
        setCurrentStroke([point]);

        // Draw locally immediately for responsiveness
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !isDrawer) return;
        e.preventDefault();
        const point = getPoint(e);
        setCurrentStroke(prev => [...prev, point]);

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
    };

    const stopDrawing = async () => {
        if (!isDrawing || !isDrawer) return;
        setIsDrawing(false);

        if (currentStroke.length > 0) {
            // Upload stroke to Firebase
            const newStroke: Stroke = {
                points: currentStroke,
                color: color,
                width: lineWidth,
                isEraser: isEraser
            };
            await push(ref(db, `drawing_rooms/${roomId}/strokes`), newStroke);
        }
        setCurrentStroke([]);
    };

    const clearCanvas = async () => {
        if (!isDrawer) return;
        // Removing the node triggers onValue with null, which clears the canvas for everyone
        await remove(ref(db, `drawing_rooms/${roomId}/strokes`));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: isDrawer ? 'crosshair' : 'default',
                    background: 'white',
                    touchAction: 'none'
                }}
            />

            {isDrawer && (
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map(c => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setIsEraser(false); }}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: c,
                                    border: color === c && !isEraser ? '3px solid #cbd5e1' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s'
                                }}
                                title={c}
                            />
                        ))}
                    </div>

                    <div style={{ width: '1px', height: '32px', background: '#e5e7eb' }}></div>

                    <button
                        onClick={() => setIsEraser(!isEraser)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            background: isEraser ? '#e5e7eb' : 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                        title="Eraser"
                    >
                        <IconEraser size={24} color={isEraser ? '#ef4444' : '#6b7280'} />
                    </button>

                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        style={{ width: '100px' }}
                        title="Brush Size"
                    />

                    <div style={{ width: '1px', height: '32px', background: '#e5e7eb' }}></div>

                    <button
                        onClick={clearCanvas}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            background: '#fee2e2',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444'
                        }}
                        title="Clear Canvas"
                    >
                        <IconTrash size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};
