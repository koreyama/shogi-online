import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Region, Bubble } from '@/lib/plague/types';
import { GameState } from '@/lib/plague/types';
import { AIR_ROUTES, SEA_ROUTES } from '@/lib/plague/mapData';

// Rough Lat/Lon (Copied for consistency)
const REGION_COORDS: Record<string, { lat: number, lon: number }> = {
    'asia_east': { lat: 35, lon: 105 },
    'asia_se': { lat: 0, lon: 110 },
    'asia_south': { lat: 20, lon: 80 },
    'europe': { lat: 50, lon: 10 },
    'usa': { lat: 40, lon: -100 },
    'south_america': { lat: -15, lon: -60 },
    'africa_north': { lat: 20, lon: 10 },
    'africa_south': { lat: -20, lon: 20 },
    'russia': { lat: 60, lon: 90 },
    'middle_east': { lat: 25, lon: 45 },
};

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

// --- Animated Vehicle Component ---
// Moves along a Bezier Curve
const Vehicle = ({ start, end, type, isInfected, speed = 0.5 }: { start: string, end: string, type: 'plane' | 'ship', isInfected: boolean, speed?: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [offset, setOffset] = useState(Math.random()); // Random start position

    const startCoord = REGION_COORDS[start];
    const endCoord = REGION_COORDS[end];
    if (!startCoord || !endCoord) return null;

    const startPos = useMemo(() => latLongToVector3(startCoord.lat, startCoord.lon, 2), [startCoord]);
    const endPos = useMemo(() => latLongToVector3(endCoord.lat, endCoord.lon, 2), [endCoord]);
    const mid = useMemo(() => startPos.clone().add(endPos).multiplyScalar(0.5).normalize().multiplyScalar(type === 'plane' ? 2.8 : 2.05), [startPos, endPos, type]);

    const curve = useMemo(() => new THREE.QuadraticBezierCurve3(startPos, mid, endPos), [startPos, mid, endPos]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Move offset
            let nextOffset = offset + (delta * speed * 0.2); // Slower movement
            if (nextOffset > 1) nextOffset = 0;
            setOffset(nextOffset);

            const pos = curve.getPoint(nextOffset);
            const tangent = curve.getTangent(nextOffset).normalize();

            groupRef.current.position.copy(pos);
            groupRef.current.lookAt(pos.clone().add(tangent));
        }
    });

    const color = isInfected ? '#ff0000' : (type === 'plane' ? '#00ff00' : '#00aaff');

    return (
        <group ref={groupRef}>
            {type === 'plane'
                ? (
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <coneGeometry args={[0.02, 0.08, 8]} />
                        <meshBasicMaterial color={color} />
                    </mesh>
                )
                : (
                    <mesh>
                        <boxGeometry args={[0.03, 0.03, 0.08]} />
                        <meshBasicMaterial color={color} />
                    </mesh>
                )
            }
        </group>
    );
};


const TrafficSystem = ({ gameState }: { gameState: GameState }) => {
    return (
        <group>
            {/* Air Traffic */}
            {AIR_ROUTES.map((route, i) => {
                const sourceRegion = gameState.regions[route[0]];
                if (!sourceRegion) return null;
                // If source has > 10% infection, planes might be infected
                const isInfected = (sourceRegion.infected / sourceRegion.population) > 0.05 && !sourceRegion.borderClosed;

                // Only spawn active planes if not closed borders (or fewer)
                if (sourceRegion.borderClosed) return null;

                return <Vehicle key={`plane-${i}`} start={route[0]} end={route[1]} type="plane" isInfected={isInfected} speed={0.8} />;
            })}

            {/* Sea Traffic (Slower, fewer) */}
            {SEA_ROUTES.map((route, i) => {
                const sourceRegion = gameState.regions[route[0]];
                if (!sourceRegion) return null;
                const isInfected = (sourceRegion.infected / sourceRegion.population) > 0.05 && !sourceRegion.borderClosed;

                if (sourceRegion.borderClosed) return null;

                return <Vehicle key={`ship-${i}`} start={route[0]} end={route[1]} type="ship" isInfected={isInfected} speed={0.3} />;
            })}
        </group>
    );
};

// ... Reused existing components (InfectionPillar, etc.) ...
const InfectionPillar = ({ startPos, height, color, intensity }: { startPos: THREE.Vector3, height: number, color: THREE.Color, intensity: number }) => {
    const ref = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);
    useMemo(() => { if (!ref.current) return; ref.current.lookAt(0, 0, 0); ref.current.rotateX(-Math.PI / 2); }, [startPos]);
    useFrame(({ clock }) => {
        if (materialRef.current) {
            const pulse = Math.sin(clock.getElapsedTime() * (2 + intensity * 5)) * 0.3 + 0.7;
            materialRef.current.opacity = 0.6 * pulse;
            if (ref.current) { const thick = 1 + (pulse * 0.2 * intensity); ref.current.scale.set(thick, 1, thick); }
        }
    });
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), startPos.clone().normalize());
    const centerPos = startPos.clone().normalize().multiplyScalar(2 + height / 2);
    return (<group><mesh ref={ref} position={centerPos} quaternion={quaternion}><cylinderGeometry args={[0.04, 0.04, height, 8]} /><meshBasicMaterial ref={materialRef} color={color} transparent /></mesh>{intensity > 0.5 && (<pointLight position={startPos.clone().normalize().multiplyScalar(2 + height)} color={color} distance={1} intensity={2} />)}</group>);
};

const InfectionPatch = ({ pos, intensity }: { pos: THREE.Vector3, intensity: number }) => {
    const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos]);
    const position = useMemo(() => pos.clone().normalize().multiplyScalar(2.02), [pos]);
    return (<mesh position={position} quaternion={quaternion}><circleGeometry args={[0.3 + (intensity * 0.2), 32]} /><meshBasicMaterial color="#ff0000" transparent opacity={Math.min(0.8, intensity * 0.8)} depthWrite={false} side={THREE.DoubleSide} /></mesh>);
};

const TrafficArc = ({ start, end, color }: { start: string, end: string, color: string }) => {
    const startCoord = REGION_COORDS[start]; const endCoord = REGION_COORDS[end]; if (!startCoord || !endCoord) return null;
    const startPos = latLongToVector3(startCoord.lat, startCoord.lon, 2); const endPos = latLongToVector3(endCoord.lat, endCoord.lon, 2);
    const mid = startPos.clone().add(endPos).multiplyScalar(0.5).normalize().multiplyScalar(2.5);
    const curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos); const points = curve.getPoints(20); const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return (<line geometry={geometry}><lineBasicMaterial color={color} opacity={0.2} transparent linewidth={1} /></line>);
};

const Earth = ({ regions, gameState, onPop, onSelectRegion }: { regions: Record<string, Region>, gameState: GameState, onPop: (id: string) => void, onSelectRegion?: (id: string) => void }) => {
    const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
    ]);

    const earthRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);
    const totalStats = Object.values(regions).reduce((acc, r) => ({ pop: acc.pop + r.population, inf: acc.inf + r.infected, dead: acc.dead + r.dead }), { pop: 0, inf: 0, dead: 0 });
    const infectedRatio = totalStats.pop > 0 ? (totalStats.inf + totalStats.dead) / totalStats.pop : 0;
    const visualDanger = Math.min(1.0, infectedRatio * 2.0);

    const safeColor = new THREE.Color('#00aaff'); const dangerColor = new THREE.Color('#ff0000'); const deadColor = new THREE.Color('#550055');
    let atmosColor = safeColor.clone();
    if (visualDanger < 0.5) { atmosColor.lerp(dangerColor, visualDanger * 2); } else { atmosColor = dangerColor.clone().lerp(deadColor, (visualDanger - 0.5) * 2); }

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();
        if (earthRef.current) { earthRef.current.rotation.y = time * 0.02; }
        if (cloudsRef.current) { cloudsRef.current.rotation.y = time * 0.025; }
        if (atmosphereRef.current) { const scale = 1 + Math.sin(time * 2) * 0.005; atmosphereRef.current.scale.set(scale, scale, scale); }
    });

    const isSelecting = gameState.gameStatus === 'choosing_start';

    return (
        <group>
            <mesh ref={atmosphereRef}><sphereGeometry args={[2.2, 64, 64]} /><meshBasicMaterial color={atmosColor} transparent opacity={0.15 + (visualDanger * 0.2)} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
            <mesh ref={earthRef}><sphereGeometry args={[2, 64, 64]} /><meshPhongMaterial map={colorMap} normalMap={normalMap} specularMap={specularMap} specular={new THREE.Color('grey')} shininess={15} />
                {/* Traffic Arcs */}
                {AIR_ROUTES.map((route, i) => (<TrafficArc key={`air-${i}`} start={route[0]} end={route[1]} color="#00ff00" />))}
                {SEA_ROUTES.map((route, i) => (<TrafficArc key={`sea-${i}`} start={route[0]} end={route[1]} color="#00aaff" />))}
                {/* Infection Pillars & Patches */}
                {Object.values(regions).map(r => {
                    const coords = REGION_COORDS[r.id]; if (!coords) return null; const pos = latLongToVector3(coords.lat, coords.lon, 2);
                    const rRatio = r.infected / r.population;
                    if (isSelecting) {
                        return (<group key={`select-${r.id}`}><mesh position={pos} onClick={(e) => { e.stopPropagation(); onSelectRegion && onSelectRegion(r.id); }}><sphereGeometry args={[0.2, 16, 16]} /><meshBasicMaterial color="#00ff00" transparent opacity={0.4} wireframe /></mesh><Html position={pos} center><div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '4px', borderRadius: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap', pointerEvents: 'none' }}>{r.name}</div></Html></group>);
                    }
                    if (rRatio <= 0) return null;
                    const height = Math.max(0.2, rRatio * 1.5);
                    const pColor = new THREE.Color('#ff3333'); if (rRatio > 0.5) pColor.set('#ff0000'); if (r.dead > r.population * 0.5) pColor.set('#550000');
                    return (<group key={`inf-${r.id}`}><InfectionPatch pos={pos} intensity={rRatio} /><InfectionPillar startPos={pos} height={height} color={pColor} intensity={rRatio} /></group>);
                })}
            </mesh>
            <mesh ref={cloudsRef}><sphereGeometry args={[2.03, 64, 64]} /><meshPhongMaterial map={cloudsMap} opacity={0.4} depthWrite={false} transparent={true} side={THREE.DoubleSide} /></mesh>

            {/* Animated Traffic System */}
            {!isSelecting && <TrafficSystem gameState={gameState} />}

            <group rotation={[0, 0, 0]}>
                {gameState.bubbles.map(b => {
                    const r = gameState.regions[b.regionId]; if (!r) return null; const coords = REGION_COORDS[r.id]; if (!coords) return null;
                    const pos = latLongToVector3(coords.lat, coords.lon, 2.4);
                    let color = '#ffff00'; if (b.type === 'cure') color = '#00ffff'; if (b.type === 'biohazard') color = '#ff0055';
                    return (<mesh key={b.id} position={pos} onClick={(e) => { e.stopPropagation(); onPop(b.id); }} onPointerOver={(e) => { document.body.style.cursor = 'pointer'; }} onPointerOut={(e) => { document.body.style.cursor = 'auto'; }}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.9} /></mesh>);
                })}
            </group>
        </group>
    );
};

interface Globe3DProps {
    gameState: GameState;
    onPop: (id: string) => void;
    onSelectRegion?: (id: string) => void;
}

export const Globe3D = ({ gameState, onPop, onSelectRegion }: Globe3DProps) => {
    return (
        <div style={{ width: '100%', height: '100%', background: 'black', position: 'relative' }}>
            <Canvas camera={{ position: [0, 0, 6.5], fov: 45 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 5, 5]} intensity={2.5} castShadow />
                <spotLight position={[-10, 0, -5]} intensity={1} color="#0040ff" />
                <Stars radius={300} depth={50} count={6000} factor={4} saturation={0} fade speed={0.5} />
                <Earth regions={gameState.regions} gameState={gameState} onPop={onPop} onSelectRegion={onSelectRegion} />
                <OrbitControls enablePan={false} minDistance={3.5} maxDistance={12} autoRotate={gameState.gameStatus === 'title'} autoRotateSpeed={0.8} />
            </Canvas>
            {gameState.gameStatus === 'choosing_start' && (
                <div style={{
                    position: 'absolute', top: '20px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'monospace', fontSize: '1.2rem', textShadow: '0 0 10px #00ff00', pointerEvents: 'none', zIndex: 10
                }}>/// TARGET SELECTION: CLICK A REGION TO INFECT ///</div>
            )}
        </div>
    );
};
