import React, { useRef, useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, onValue, remove, child } from 'firebase/database';
import { Stroke, Point } from '@/lib/drawing/types';
import { IconPalette, IconEraser, IconTrash, IconLayers, IconPen, IconUndo, IconRedo, IconEye, IconEyeOff, IconLasso } from '@/components/Icons';
import { Room } from 'colyseus.js';
import styles from './DrawingCanvas.module.css';

interface DrawingCanvasProps {
    roomId?: string; // Firebase
    room?: Room;     // Colyseus
    isDrawer: boolean;
    width: number;
    height: number;
}

interface Layer {
    id: number;
    visible: boolean;
    name: string;
}

interface LayeredStroke extends Stroke {
    layer?: number;
    type?: 'path'; // Removed 'fill'
}

const generateId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (c === 'x' ? (Math.random() * 16 | 0) : ((Math.random() * 16 | 0) & 0x3 | 0x8)).toString(16));

// Helper: Point in Polygon (Ray Casting)
const isPointInPolygon = (point: Point, vs: Point[]) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// Helper: Check if ANY point of stroke is in polygon
const isStrokeInPolygon = (stroke: LayeredStroke, polygon: Point[]) => {
    if (!stroke.points) return false;
    for (let i = 0; i < stroke.points.length; i += 5) {
        if (isPointInPolygon(stroke.points[i], polygon)) return true;
    }
    if (stroke.points.length > 0 && isPointInPolygon(stroke.points[0], polygon)) return true;
    if (stroke.points.length > 1 && isPointInPolygon(stroke.points[stroke.points.length - 1], polygon)) return true;
    return false;
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ roomId, room, isDrawer, width, height }) => {
    const layerRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const cursorRef = useRef<HTMLDivElement>(null);

    // Removed fillCache

    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [currentStrokeId, setCurrentStrokeId] = useState<string>('');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [isEraser, setIsEraser] = useState(false);
    const [tool, setTool] = useState<'pen' | 'lasso'>('pen'); // Removed 'bucket'

    // Zoom & Pan
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0); // Degrees
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef<{ x: number, y: number } | null>(null);

    const [activeLayer, setActiveLayer] = useState(0);
    const [layers, setLayers] = useState<Layer[]>([{ id: 0, visible: true, name: '下書き' }, { id: 1, visible: true, name: '線画' }, { id: 2, visible: true, name: '着色' }]);
    const [history, setHistory] = useState<LayeredStroke[]>([]);
    const [redoStack, setRedoStack] = useState<LayeredStroke[]>([]);
    const lastSendTime = useRef<number>(0);
    const pendingPoints = useRef<Point[]>([]);
    const lastPoint = useRef<Point | null>(null);
    const inputBuffer = useRef<Point[]>([]);
    const lastTouchDistance = useRef<number | null>(null); // For pinch zoom
    const lastTouchAngle = useRef<number | null>(null); // For pinch rotate
    const lastTouchCenter = useRef<Point | null>(null); // For pinch pan

    const [isDrawing, setIsDrawing] = useState(false);

    // Lasso State
    const [lassoPolygon, setLassoPolygon] = useState<Point[]>([]);
    const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
    const [isDraggingSelection, setIsDraggingSelection] = useState(false);
    const [selectionOffset, setSelectionOffset] = useState({ x: 0, y: 0 });
    const [dragStartPos, setDragStartPos] = useState<Point | null>(null);

    // Auto-Fit Canvas on Mount
    useEffect(() => {
        if (viewportRef.current) {
            const rect = viewportRef.current.getBoundingClientRect();
            // Fit with margin
            const margin = 20;
            const availableW = rect.width - margin * 2;
            const availableH = rect.height - margin * 2;

            if (availableW > 0 && availableH > 0) {
                const scaleX = availableW / width;
                const scaleY = availableH / height;
                const newScale = Math.min(scaleX, scaleY, 0.9); // Max 0.9 to ensure visibility

                // Center
                const panX = (rect.width - width * newScale) / 2;
                const panY = (rect.height - height * newScale) / 2;

                setScale(newScale);
                setPan({ x: panX, y: panY });
            }
        }
    }, [width, height]);

    useEffect(() => { layerRefs.current = Array(3).fill(null); }, []);

    const toggleLayerVisibility = (layerId: number) => {
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
    };

    const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: LayeredStroke, offset: Point = { x: 0, y: 0 }) => {
        // Removed fill logic

        const points = stroke.points;
        if (!points || points.length === 0) return;
        ctx.beginPath();
        if (stroke.isEraser) ctx.globalCompositeOperation = 'destination-out';
        else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = stroke.color; }
        ctx.lineWidth = stroke.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        const getP = (p: Point) => ({ x: p.x + offset.x, y: p.y + offset.y });

        if (points.length < 3) {
            const p0 = getP(points[0]);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < points.length; i++) {
                const pi = getP(points[i]);
                ctx.lineTo(pi.x, pi.y);
            }
            ctx.stroke();
        } else {
            const p0 = getP(points[0]);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < points.length - 2; i++) {
                const pi = getP(points[i]);
                const pi1 = getP(points[i + 1]);
                const xc = (pi.x + pi1.x) / 2;
                const yc = (pi.y + pi1.y) / 2;
                ctx.quadraticCurveTo(pi.x, pi.y, xc, yc);
            }
            const penult = getP(points[points.length - 2]);
            const last = getP(points[points.length - 1]);
            ctx.quadraticCurveTo(penult.x, penult.y, last.x, last.y);
            ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
    }, []);


    const renderLayer = useCallback((layerId: number, currentHistory: LayeredStroke[]) => {
        const canvas = layerRefs.current[layerId];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        currentHistory.forEach(stroke => {
            if ((stroke.layer ?? 0) === layerId) {
                drawStroke(ctx, stroke);
            }
        });
    }, [drawStroke, width, height]);

    const renderAllLayers = useCallback((skipSelected = false) => {
        layers.forEach(l => {
            const canvas = layerRefs.current[l.id];
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            history.forEach(stroke => {
                if ((stroke.layer ?? 0) === l.id) {
                    if (skipSelected && selectedStrokeIds.includes(stroke.id)) return;
                    drawStroke(ctx, stroke);
                }
            });
        });
    }, [layers, history, selectedStrokeIds, drawStroke, width, height]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') setIsSpacePressed(true);
            if (e.key === 'Control' || e.metaKey) setIsCtrlPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') { setIsSpacePressed(false); setIsPanning(false); }
            if (e.key === 'Control' || e.metaKey) setIsCtrlPressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        renderAllLayers(isDraggingSelection);
    }, [isDraggingSelection, renderAllLayers]);

    useEffect(() => {
        const canvas = overlayRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        if (lassoPolygon.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.moveTo(lassoPolygon[0].x, lassoPolygon[0].y);
            for (let i = 1; i < lassoPolygon.length; i++) ctx.lineTo(lassoPolygon[i].x, lassoPolygon[i].y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (selectedStrokeIds.length > 0) {
            const selectedStrokes = history.filter(s => selectedStrokeIds.includes(s.id));
            if (isDraggingSelection) {
                selectedStrokes.forEach(s => {
                    drawStroke(ctx, s, selectionOffset);
                });
            } else {
                ctx.save();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5;
                selectedStrokes.forEach(s => {
                    // if(s.type === 'fill') return; // Removed fill type check
                    drawStroke(ctx, { ...s, width: s.width + 4, color: '#3b82f6' });
                });
                ctx.restore();
            }
        }

    }, [lassoPolygon, selectedStrokeIds, isDraggingSelection, selectionOffset, history, drawStroke, width, height, tool, isDrawing]);

    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        const lastStroke = history[history.length - 1];
        const lastId = lastStroke.id;
        const newHistory = history.filter(s => s.id !== lastId);
        const removedStrokes = history.filter(s => s.id === lastId);
        setHistory(newHistory);
        if (removedStrokes.length > 0) setRedoStack(prev => [...prev, removedStrokes[removedStrokes.length - 1]]);
        renderLayer(lastStroke.layer ?? 0, newHistory);
        if (room) room.send("undo", lastId);
    }, [history, renderLayer, room]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        const strokeToRedo = redoStack[redoStack.length - 1];
        const newRedoStack = redoStack.slice(0, -1);
        setHistory(prev => [...prev, strokeToRedo]);
        setRedoStack(newRedoStack);
        const canvas = layerRefs.current[strokeToRedo.layer ?? 0];
        if (canvas) drawStroke(canvas.getContext('2d')!, strokeToRedo);
        if (room) room.send("draw", { ...strokeToRedo, type: strokeToRedo.type ?? 'path' });
    }, [redoStack, drawStroke, room]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                setIsSpacePressed(true);
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); if (e.shiftKey) handleRedo(); else handleUndo(); }
                else if (e.key === 'y') { e.preventDefault(); handleRedo(); }
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedStrokeIds.length > 0) {
                    setSelectedStrokeIds([]);
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                setIsSpacePressed(false);
                setIsPanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleUndo, handleRedo, selectedStrokeIds]);

    useEffect(() => {
        layerRefs.current.forEach(c => c?.getContext('2d')?.clearRect(0, 0, width, height));
        if (roomId && !room) {
            const strokesRef = ref(db, `drawing_rooms/${roomId}/strokes`);
            const unsubscribe = onValue(strokesRef, (snapshot) => {
                const data = snapshot.val();
                layerRefs.current.forEach(c => c?.getContext('2d')?.clearRect(0, 0, width, height));
                // fillCache.current.clear(); // Removed
                if (!data) { setHistory([]); return; }
                const strokes: LayeredStroke[] = Object.values(data);
                setHistory(strokes);
                strokes.forEach(s => {
                    const l = s.layer ?? 0;
                    if (layerRefs.current[l]) drawStroke(layerRefs.current[l]!.getContext('2d')!, s);
                });
            });
            return () => unsubscribe();
        }
        if (room) {
            const handleRemoteDraw = (data: any) => {
                setHistory(prev => [...prev, data]);
                const layerId = data.layer ?? 0;
                const canvas = layerRefs.current[layerId];
                if (canvas) drawStroke(canvas.getContext('2d')!, data as LayeredStroke);
            };
            const handleRemoteUndo = (strokeId: string) => {
                setHistory(prev => {
                    const newHistory = prev.filter(s => s.id !== strokeId);
                    const removed = prev.find(s => s.id === strokeId);
                    if (removed) setTimeout(() => renderLayer(removed.layer ?? 0, newHistory), 0);
                    return newHistory;
                });
            };
            const handleClear = () => {
                setHistory([]); setRedoStack([]);
                // fillCache.current.clear(); // Removed
                layerRefs.current.forEach(c => c?.getContext('2d')?.clearRect(0, 0, width, height));
            };
            room.onMessage("draw", handleRemoteDraw);
            room.onMessage("undo", handleRemoteUndo);
            room.onMessage("clear", handleClear);
        }
    }, [roomId, room, width, height, drawStroke, renderLayer]);

    useEffect(() => { layers.forEach(l => renderLayer(l.id, history)); }, [width, height, history, layers, renderLayer]);

    const getRawPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        // Use native HW accelerated coordinates for Mouse (PC)
        if (!('touches' in e) && e.nativeEvent && e.target) {
            const target = e.target as HTMLElement;
            // console.log('getRawPoint Target:', target.tagName);
            if (target.tagName === 'CANVAS') {
                return { x: Math.round(e.nativeEvent.offsetX), y: Math.round(e.nativeEvent.offsetY) };
            }
        }

        if (!viewportRef.current) return { x: 0, y: 0 };
        const rect = viewportRef.current.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY;
        }

        // Screen to World Conversion
        // 1. Remove Pan (Viewport relative -> Translated relative)
        const dx = clientX - rect.left - pan.x;
        const dy = clientY - rect.top - pan.y;

        // 2. Inverse Rotation
        const rad = -rotation * Math.PI / 180;
        const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

        // 3. Inverse Scale
        const x = rx / scale;
        const y = ry / scale;

        return { x: Math.round(x), y: Math.round(y) };
    };

    const getStabilizedPoint = (raw: Point): Point => {
        inputBuffer.current.push(raw);
        if (inputBuffer.current.length > 4) inputBuffer.current.shift();
        const sum = inputBuffer.current.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        const len = inputBuffer.current.length;
        return { x: Math.round(sum.x / len), y: Math.round(sum.y / len) };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        if (isSpacePressed || e.ctrlKey) {
            setIsPanning(true);
            return;
        }
        const raw = getRawPoint(e);

        if (tool === 'lasso') {
            setIsDrawing(true);
            if (selectedStrokeIds.length > 0 && lassoPolygon.length > 0) {
                if (isPointInPolygon(raw, lassoPolygon)) {
                    setIsDraggingSelection(true);
                    setDragStartPos(raw);
                    setSelectionOffset({ x: 0, y: 0 });
                    return;
                }
            }
            setLassoPolygon([raw]);
            setSelectedStrokeIds([]);
            return;
        }

        startDrawing(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Update Cursor Position using direct DOM manipulation (No React Render!)
        if (cursorRef.current && isDrawer && !isSpacePressed && !isCtrlPressed) {
            const rect = viewportRef.current?.getBoundingClientRect();
            if (rect) {
                const sx = e.clientX - rect.left;
                const sy = e.clientY - rect.top;
                cursorRef.current.style.left = `${sx}px`;
                cursorRef.current.style.top = `${sy}px`;
            }
        }

        const clientX = e.clientX;
        const clientY = e.clientY;

        if (isPanning || (isDrawer && e.buttons === 1 && (e.ctrlKey || isCtrlPressed))) {
            if (lastMousePos.current) {
                const deltaX = clientX - lastMousePos.current.x;
                const deltaY = clientY - lastMousePos.current.y;

                if (e.ctrlKey || isCtrlPressed) {
                    // Rotation
                    const deltaAngle = deltaX * 0.5;
                    const rect = viewportRef.current?.getBoundingClientRect();
                    if (rect) {
                        const cx = rect.width / 2;
                        const cy = rect.height / 2;

                        // World Center
                        const dx = cx - pan.x;
                        const dy = cy - pan.y;
                        const rad = -rotation * Math.PI / 180;
                        const wx = (dx * Math.cos(rad) - dy * Math.sin(rad)) / scale;
                        const wy = (dx * Math.sin(rad) + dy * Math.cos(rad)) / scale;

                        const newRot = rotation + deltaAngle;
                        const newRad = newRot * Math.PI / 180;

                        const rotX = wx * scale * Math.cos(newRad) - wy * scale * Math.sin(newRad);
                        const rotY = wx * scale * Math.sin(newRad) + wy * scale * Math.cos(newRad);

                        setRotation(newRot);
                        setPan({ x: cx - rotX, y: cy - rotY });
                    }
                } else if (isPanning) {
                    // Pan
                    setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
                }
            }
            lastMousePos.current = { x: clientX, y: clientY };
            return;
        }

        lastMousePos.current = { x: clientX, y: clientY };
        const raw = getRawPoint(e);

        if (tool === 'lasso') {
            if (isDraggingSelection && dragStartPos) {
                setSelectionOffset({
                    x: raw.x - dragStartPos.x,
                    y: raw.y - dragStartPos.y
                });
            } else if (isDrawing) {
                setLassoPolygon(prev => [...prev, raw]);
            }
            return;
        }

        if (isDrawing) {
            draw(e);
        }
    };

    // ... handleMouseUp, startDrawing, draw, stopDrawing, clearCanvas logic is same ...
    const handleMouseUp = async () => {
        if (isPanning) { setIsPanning(false); return; }

        if (tool === 'lasso') {
            setIsDrawing(false);
            if (isDraggingSelection) {
                setIsDraggingSelection(false);
                if (selectedStrokeIds.length > 0 && (selectionOffset.x !== 0 || selectionOffset.y !== 0)) {
                    const movedStrokes: LayeredStroke[] = [];
                    const idsToRemove = [...selectedStrokeIds];

                    // Find originals
                    const originals = history.filter(s => idsToRemove.includes(s.id));

                    // Create new replacements
                    originals.forEach(s => {
                        const newPoints = s.points.map(p => ({ x: p.x + selectionOffset.x, y: p.y + selectionOffset.y }));
                        const newId = generateId(); // New ID for the moved stroke
                        movedStrokes.push({ ...s, id: newId, points: newPoints });
                    });

                    const newHistory = history.filter(s => !idsToRemove.includes(s.id)).concat(movedStrokes);
                    setHistory(newHistory);

                    if (room) {
                        idsToRemove.forEach(id => room.send("undo", id));
                        movedStrokes.forEach(s => room.send("draw", s));
                    }
                }
                setSelectionOffset({ x: 0, y: 0 });
                setSelectedStrokeIds([]);
                setLassoPolygon([]);
            } else {
                const ids: string[] = [];
                history.forEach(s => {
                    if (s.layer === activeLayer) {
                        if (isStrokeInPolygon(s, lassoPolygon)) {
                            ids.push(s.id);
                        }
                    }
                });
                setSelectedStrokeIds(ids);
                if (ids.length === 0) setLassoPolygon([]);
            }
            return;
        }
        stopDrawing();
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawer || isSpacePressed) return;
        const raw = getRawPoint(e);
        // Removed Bucket Check logic

        setIsDrawing(true);
        inputBuffer.current = [raw];
        setCurrentStroke([raw]);
        const id = generateId();
        setCurrentStrokeId(id);
        lastPoint.current = raw;
        pendingPoints.current = [raw];
        const canvas = layerRefs.current[activeLayer];
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            if (isEraser) ctx.globalCompositeOperation = 'destination-out';
            else { ctx.strokeStyle = color; ctx.globalCompositeOperation = 'source-over'; }
            ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.moveTo(raw.x, raw.y); ctx.lineTo(raw.x, raw.y); ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !isDrawer || tool !== 'pen') return;
        const raw = getRawPoint(e);
        const point = getStabilizedPoint(raw);
        setCurrentStroke(prev => [...prev, point]);
        const canvas = layerRefs.current[activeLayer];
        const ctx = canvas?.getContext('2d');
        if (ctx && lastPoint.current) {
            ctx.beginPath();
            if (isEraser) ctx.globalCompositeOperation = 'destination-out';
            else { ctx.strokeStyle = color; ctx.globalCompositeOperation = 'source-over'; }
            ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y); ctx.lineTo(point.x, point.y); ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }
        if (room || roomId) {
            pendingPoints.current.push(point);
            lastPoint.current = point;
            const now = Date.now();
            if (now - lastSendTime.current > 20 || pendingPoints.current.length > 2) {
                const pointsToSend = pendingPoints.current;
                if (pointsToSend.length > 1) {
                    const newStroke: LayeredStroke = { id: currentStrokeId, points: pointsToSend, color: color, width: lineWidth, isEraser: isEraser, layer: activeLayer, type: 'path' };
                    if (room) room.send("draw", newStroke);
                    pendingPoints.current = [pointsToSend[pointsToSend.length - 1]];
                    lastSendTime.current = now;
                }
            }
        }
    };

    const stopDrawing = async () => {
        if (!isDrawing || !isDrawer || tool !== 'pen') return;
        setIsDrawing(false);
        if (currentStroke.length > 0) {
            const newStroke: LayeredStroke = { id: currentStrokeId, points: currentStroke, color: color, width: lineWidth, isEraser: isEraser, layer: activeLayer, type: 'path' };
            setHistory(prev => [...prev, newStroke]);
            setRedoStack([]);
            if (roomId && !room) await push(ref(db, `drawing_rooms/${roomId}/strokes`), newStroke);
            if (room) {
                const pointsToSend = pendingPoints.current;
                if (pointsToSend.length > 1) {
                    room.send("draw", { ...newStroke, points: pointsToSend, type: 'path' });
                }
                pendingPoints.current = [];
            }
        }
        setCurrentStroke([]); lastPoint.current = null; pendingPoints.current = []; inputBuffer.current = [];
    };

    const clearCanvas = async () => {
        if (!isDrawer) return;
        if (roomId && !room) await remove(ref(db, `drawing_rooms/${roomId}/strokes`));
        if (room) {
            room.send("clear"); setHistory([]); setRedoStack([]);
            // Removed cache clearing
            layerRefs.current.forEach(c => c?.getContext('2d')?.clearRect(0, 0, width, height));
        }
    };

    const viewportRef = useRef<HTMLDivElement>(null);

    const performZoom = useCallback((deltaY: number, clientX: number, clientY: number) => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        // This rect is always the visual bounding of the viewport on screen
        const rect = viewport.getBoundingClientRect();

        // Cursor position relative to viewport (screen pixels)
        const cursorX = clientX - rect.left;
        const cursorY = clientY - rect.top;

        // Convert to "World" coordinates.
        // We know: cursorScreen = cursorWorld * scale + pan
        // So: cursorWorld = (cursorScreen - pan) / scale
        const worldX = (cursorX - pan.x) / scale;
        const worldY = (cursorY - pan.y) / scale;

        const delta = deltaY * -0.001;
        const newScale = Math.min(Math.max(scale + delta, 0.1), 5.0);

        // We want cursorWorld to stay at cursorScreen after zoom.
        // cursorScreen = worldX * newScale + newPan
        // newPan = cursorScreen - worldX * newScale

        const newPanX = cursorX - worldX * newScale;
        const newPanY = cursorY - worldY * newScale;

        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
    }, [pan, scale]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            performZoom(e.deltaY, e.clientX, e.clientY);
        };

        viewport.addEventListener('wheel', wheelHandler, { passive: false });
        // NOTE: If scale/pan state changes, this Effect re-runs (due to dependency on performZoom).
        // That is fine, removing old listener and adding new one.

        return () => {
            viewport.removeEventListener('wheel', wheelHandler);
        };
    }, [performZoom]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

            lastTouchDistance.current = dist;
            lastTouchAngle.current = angle;
            lastTouchCenter.current = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
            return;
        }
        handleMouseDown(e as unknown as React.MouseEvent);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        if (e.touches.length === 2 && lastTouchDistance.current !== null && lastTouchAngle.current !== null && lastTouchCenter.current) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
            const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
            const rect = viewportRef.current?.getBoundingClientRect();

            if (rect) {
                // Calculate World Center using OLD state
                // Screen Point relative to viewport
                const cx = lastTouchCenter.current.x - rect.left - pan.x;
                const cy = lastTouchCenter.current.y - rect.top - pan.y;
                // Inverse Rotate/Scale
                const rad = -rotation * Math.PI / 180;
                const rx = cx * Math.cos(rad) - cy * Math.sin(rad);
                const ry = cx * Math.sin(rad) + cy * Math.cos(rad);

                const wx = rx / scale;
                const wy = ry / scale;

                // Calculate New State
                const newScale = Math.min(Math.max(scale * (dist / lastTouchDistance.current), 0.1), 5.0);

                let deltaAngle = angle - lastTouchAngle.current;
                // Normalize deltaAngle
                if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
                if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

                const newRotation = rotation + (deltaAngle * 180 / Math.PI); // Convert to degrees

                // Calculate New Pan to keep World Center at New Screen Center
                const newRad = newRotation * Math.PI / 180;

                // Rotated/Scaled World Center
                const newRx = wx * newScale * Math.cos(newRad) - wy * newScale * Math.sin(newRad);
                const newRy = wx * newScale * Math.sin(newRad) + wy * newScale * Math.cos(newRad);

                // New Screen Center (relative to viewport top-left)
                const targetCx = center.x - rect.left;
                const targetCy = center.y - rect.top;

                const newPanX = targetCx - newRx;
                const newPanY = targetCy - newRy;

                setScale(newScale);
                setRotation(newRotation);
                setPan({ x: newPanX, y: newPanY });

                lastTouchDistance.current = dist;
                lastTouchAngle.current = angle;
                lastTouchCenter.current = center;
            }
            return;
        }
        handleMouseMove(e as unknown as React.MouseEvent);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        lastTouchDistance.current = null;
        lastTouchAngle.current = null;
        lastTouchCenter.current = null;
        handleMouseUp();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <div
                ref={viewportRef}
                className={styles.viewport}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => { handleMouseUp(); }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseLeave={() => { stopDrawing(); setIsPanning(false); if (cursorRef.current) cursorRef.current.style.display = 'none'; }}
                onMouseEnter={() => { if (cursorRef.current) cursorRef.current.style.display = 'block'; }}
                style={{
                    cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : (isCtrlPressed ? 'ew-resize' : (tool === 'lasso' ? 'crosshair' : 'none'))
                }}
            >
                <div style={{
                    position: 'absolute', top: 0, left: 0,
                    transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${scale})`,
                    transformOrigin: 'top left',
                    transition: isPanning ? 'none' : 'transform 0.05s linear'
                }}>
                    <div
                        className={styles.canvasContainer}
                        style={{
                            width: width, height: height,
                            cursor: isSpacePressed ? 'inherit' : 'none'
                        }}
                    >
                        {layers.map((layer) => (
                            <canvas
                                key={layer.id}
                                ref={el => { layerRefs.current[layer.id] = el! }}
                                width={width} height={height}
                                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', opacity: layer.visible ? 1 : 0, zIndex: layer.id }}
                            />
                        ))}
                        <canvas
                            ref={overlayRef}
                            width={width}
                            height={height}
                            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 100 }}
                        />
                        {/* Cursor (Optimized, no state) */}
                        <div
                            ref={cursorRef}
                            style={{
                                position: 'absolute',
                                left: 0, top: 0, // Initial, updated by JS
                                width: lineWidth, height: lineWidth,
                                borderRadius: '50%',
                                border: '1px solid rgba(0,0,0,0.5)',
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none',
                                zIndex: 101,
                                backgroundColor: isEraser ? 'white' : color,
                                opacity: 0.5,
                                display: (isDrawer && tool === 'pen' && !isSpacePressed) ? 'block' : 'none'
                            }}
                        />
                    </div>
                </div>

                {isSpacePressed && (
                    <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 10px', borderRadius: '4px', pointerEvents: 'none', zIndex: 300 }}>
                        移動モード (ドラッグして移動)
                    </div>
                )}
            </div>

            {isDrawer && (
                <div className={styles.toolbar}>
                    {/* ... Toolbar Buttons (Same) ... */}
                    <div className={styles.toolGroup}>
                        <button onClick={() => { setTool('pen'); setIsEraser(false); }} className={styles.toolBtn} style={{ background: tool === 'pen' && !isEraser ? '#e0f2fe' : 'transparent' }}><IconPen size={24} color={tool === 'pen' && !isEraser ? '#0ea5e9' : '#64748b'} /></button>
                        <button onClick={() => { setTool('pen'); setIsEraser(true); }} className={styles.toolBtn} style={{ background: isEraser ? '#fee2e2' : 'transparent' }}><IconEraser size={24} color={isEraser ? '#ef4444' : '#64748b'} /></button>
                        <button onClick={() => setTool('lasso')} className={styles.toolBtn} style={{ background: tool === 'lasso' ? '#f0fdf4' : 'transparent' }}><IconLasso size={24} color={tool === 'lasso' ? '#16a34a' : '#64748b'} /></button>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.toolGroup}>
                        <button onClick={handleUndo} disabled={history.length === 0} className={styles.toolBtn} style={{ cursor: history.length > 0 ? 'pointer' : 'not-allowed', opacity: history.length > 0 ? 1 : 0.3 }}><IconUndo size={24} color="#64748b" /></button>
                        <button onClick={handleRedo} disabled={redoStack.length === 0} className={styles.toolBtn} style={{ cursor: redoStack.length > 0 ? 'pointer' : 'not-allowed', opacity: redoStack.length > 0 ? 1 : 0.3 }}><IconRedo size={24} color="#64748b" /></button>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.toolGroup}>
                        {['#000000', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                            <button key={c} onClick={() => { setColor(c); setIsEraser(false); if (tool === 'lasso') setTool('pen'); else setTool('pen'); }} className={styles.colorBtn} style={{ background: c, border: color === c && !isEraser ? '2px solid black' : '1px solid #ccc' }} />
                        ))}
                        <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #ccc', flexShrink: 0 }}>
                            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setIsEraser(false); }} style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', cursor: 'pointer', padding: 0, border: 'none' }} />
                            <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPalette size={16} color="white" /></div>
                        </div>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.toolGroup} style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>サイズ: {lineWidth}px</span>
                        <input type="range" min="1" max="50" value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} className={styles.rangeInput} style={{ accentColor: isEraser ? '#ef4444' : color }} />
                    </div>
                    <div className={styles.toolGroup}>
                        <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>ズーム: {Math.round(scale * 100)}%</span>
                        <input type="range" min="0.1" max="3" step="0.1" value={scale} onChange={e => setScale(Number(e.target.value))} style={{ width: 60, cursor: 'pointer' }} />
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.toolGroup} style={{ gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {layers.slice().reverse().map(l => (
                                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <button onClick={() => toggleLayerVisibility(l.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>{l.visible ? <IconEye size={16} color="#666" /> : <IconEyeOff size={16} color="#ccc" />}</button>
                                    <button onClick={() => setActiveLayer(l.id)} style={{ padding: '2px 8px', borderRadius: '4px', background: activeLayer === l.id ? '#f1f5f9' : 'transparent', border: activeLayer === l.id ? '1px solid #94a3b8' : '1px solid transparent', fontSize: '12px', fontWeight: activeLayer === l.id ? 'bold' : 'normal', cursor: 'pointer', minWidth: '60px', textAlign: 'left' }}>{l.name}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.separator} />
                    <button onClick={() => { if (confirm('全消去しますか？')) clearCanvas(); }} className={styles.toolBtn} style={{ color: '#ef4444' }}><IconTrash size={20} /></button>
                </div>
            )}
            {/* Debug Info */}
            <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', padding: 5, fontSize: 10, pointerEvents: 'none', zIndex: 9999 }}>
                Pos: {Math.round(pan.x)},{Math.round(pan.y)} <br />
                Rot: {Math.round(rotation)}deg <br />
                Ctrl: {isCtrlPressed ? 'ON' : 'OFF'}
            </div>
        </div>
    );
};
