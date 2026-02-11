import React from 'react';

// Color palette
const COLORS = {
    man: '#8B0000',
    pin: '#0D47A1',
    sou: '#1B5E20',
    red: '#D32F2F',
    black: '#000000',
};

// ─── Simple text-based renderer (used for small tiles and Manzu/Honor at any size) ───
const CharRender = ({ text, sub, color, size = 'normal' }: {
    text: string; sub?: string; color: string; size?: 'normal' | 'small';
}) => {
    const isSmall = size === 'small';
    const mainSize = sub
        ? (isSmall ? '16px' : '28px')
        : (isSmall ? '18px' : '34px');
    const subSize = isSmall ? '8px' : '11px';

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            color, lineHeight: 1,
            overflow: 'hidden',
        }}>
            <span style={{
                fontSize: mainSize,
                fontWeight: 900,
                fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
                display: 'block',
            }}>{text}</span>
            {sub && <span style={{
                fontSize: subSize,
                fontWeight: 'bold',
                opacity: 0.85,
                marginTop: isSmall ? -1 : 0,
            }}>{sub}</span>}
        </div>
    );
};

// ─── Pin circle helper (normal-sized tiles only) ───
const SimpleCircle = ({ color }: { color: string }) => (
    <div style={{
        width: 8, height: 8,
        borderRadius: '50%',
        border: `1.5px solid ${color}`,
        background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: color }} />
    </div>
);

// ─── Pinzu (normal-size graphic) ───
const PinzuRender = ({ value }: { value: number }) => {
    const L = ({ children, gap = 1, style }: any) => (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', gap,
            ...style,
        }}>{children}</div>
    );
    const R = ({ children, gap = 2 }: any) => <div style={{ display: 'flex', gap, justifyContent: 'center' }}>{children}</div>;
    const C = ({ c = COLORS.pin }) => <SimpleCircle color={c} />;

    if (value === 1) return <L><div style={{ width: 20, height: 20, borderRadius: '50%', background: COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.red }} /></div></div></L>;
    if (value === 2) return <L gap={6}><C /><C /></L>;
    if (value === 3) return <L gap={3}><C /><C /><C /></L>;
    if (value === 4) return <L gap={3}><R gap={6}><C /><C /></R><R gap={6}><C /><C /></R></L>;
    if (value === 5) return <L gap={2}><R gap={6}><C /><C /></R><C c={COLORS.red} /><R gap={6}><C /><C /></R></L>;
    if (value === 6) return <L gap={2}><R gap={4}><C /><C /></R><R gap={4}><C /><C /></R><R gap={4}><C /><C /></R></L>;
    if (value === 7) return <L gap={1}><R gap={4}><C /><C /></R><R gap={4}><C /><C /><C /></R><R gap={4}><C /><C /></R></L>;
    if (value === 8) return <L gap={1}><R gap={3}><C /><C /><C /></R><R gap={6}><C /><C /></R><R gap={3}><C /><C /><C /></R></L>;
    if (value === 9) return <L gap={1}><R gap={2}><C /><C /><C /></R><R gap={2}><C /><C /><C /></R><R gap={2}><C /><C /><C /></R></L>;
    return <div>{value}</div>;
};

// ─── Souzu stick helper (normal-sized tiles only) ───
const Stick = ({ color = COLORS.sou, width = 3, height = 12, rotate = 0 }) => (
    <div style={{
        width, height, borderRadius: 1, backgroundColor: color,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
    }} />
);

// ─── Souzu (normal-size graphic) ───
const SouzuRender = ({ value }: { value: number }) => {
    const L = ({ children, gap = 1 }: any) => (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', gap,
        }}>{children}</div>
    );
    const R = ({ children, gap = 3 }: any) => <div style={{ display: 'flex', gap, justifyContent: 'center' }}>{children}</div>;

    if (value === 1) return <L>
        <svg width="24" height="24" viewBox="0 0 100 100">
            <path d="M50 20 Q70 5 80 25 Q85 45 70 55 L50 90 L30 55 Q15 45 20 25 Q30 5 50 20" fill={COLORS.sou} />
            <circle cx="45" cy="25" r="4" fill="white" />
        </svg>
    </L>;
    if (value === 2) return <L gap={4}><Stick height={14} /><Stick height={14} /></L>;
    if (value === 3) return <L gap={3}><Stick height={10} /><R gap={2}><Stick height={10} /><Stick height={10} /></R></L>;
    if (value === 4) return <L gap={2}><R><Stick height={14} /><Stick height={14} /></R><R><Stick height={14} /><Stick height={14} /></R></L>;
    if (value === 5) return <L gap={2}><R><Stick height={12} /><Stick height={12} color={COLORS.red} /><Stick height={12} /></R><R><Stick height={14} /><Stick height={14} /></R></L>;
    if (value === 6) return <L gap={2}><R><Stick /><Stick /><Stick /></R><R><Stick /><Stick /><Stick /></R></L>;
    if (value === 7) return <L gap={3}><R gap={6}><Stick height={10} color={COLORS.red} rotate={-20} /><Stick height={10} color={COLORS.red} rotate={20} /></R><R gap={2}><Stick height={12} /><Stick height={12} /><Stick height={12} /></R></L>;
    if (value === 8) return <L gap={3}><R gap={2}><Stick height={8} rotate={-15} /><Stick height={8} rotate={-5} /><Stick height={8} rotate={5} /><Stick height={8} rotate={15} /></R><R gap={2}><Stick height={8} rotate={-15} /><Stick height={8} rotate={-5} /><Stick height={8} rotate={5} /><Stick height={8} rotate={15} /></R></L>;
    if (value === 9) return <L gap={1}><R gap={2}><Stick height={10} /><Stick height={10} /><Stick height={10} /></R><R gap={2}><Stick height={10} color={COLORS.red} /><Stick height={10} color={COLORS.red} /><Stick height={10} color={COLORS.red} /></R><R gap={2}><Stick height={10} /><Stick height={10} /><Stick height={10} /></R></L>;
    return <div>{value}s</div>;
};

// ─── MAIN EXPORT ───
export const TileGraphics = ({ suit, value, size = 'normal' }: {
    suit: string; value: number; size?: 'normal' | 'small';
}) => {
    const isSmall = size === 'small';

    // For SMALL tiles: always use simple text to ensure readability
    if (isSmall) {
        if (suit === 'man') {
            const chars = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
            return <CharRender text={chars[value - 1]} sub="萬" color={COLORS.man} size="small" />;
        }
        if (suit === 'pin') {
            // Simple: colored number + subtext
            return <CharRender text={String(value)} sub="●" color={COLORS.pin} size="small" />;
        }
        if (suit === 'sou') {
            return <CharRender text={String(value)} sub="竹" color={COLORS.sou} size="small" />;
        }
        if (suit === 'honor') {
            const map: Record<number, string> = { 1: '東', 2: '南', 3: '西', 4: '北', 5: '白', 6: '發', 7: '中' };
            let c = COLORS.black;
            if (value === 6) c = COLORS.sou;
            if (value === 7) c = COLORS.red;
            if (value === 5) {
                return <div style={{
                    width: '60%', height: '60%',
                    border: '1.5px solid #555', borderRadius: 1,
                }} />;
            }
            return <CharRender text={map[value]} color={c} size="small" />;
        }
        return <div>?</div>;
    }

    // For NORMAL tiles: use graphic renderers
    if (suit === 'man') {
        const chars = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        return <CharRender text={chars[value - 1]} sub="萬" color={COLORS.man} size="normal" />;
    }
    if (suit === 'pin') return <PinzuRender value={value} />;
    if (suit === 'sou') return <SouzuRender value={value} />;
    if (suit === 'honor') {
        const map: Record<number, string> = { 1: '東', 2: '南', 3: '西', 4: '北', 5: '白', 6: '發', 7: '中' };
        let c = COLORS.black;
        if (value === 6) c = COLORS.sou;
        if (value === 7) c = COLORS.red;
        if (value === 5) {
            return <div style={{ width: '70%', height: '70%', border: '2px solid #333', borderRadius: 2 }} />;
        }
        return <CharRender text={map[value]} color={c} size="normal" />;
    }
    return <div>?</div>;
};
