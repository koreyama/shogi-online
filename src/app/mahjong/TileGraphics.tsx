import React from 'react';

// Common Colors
const COLORS = {
    man: '#8B0000', // Dark Red
    pin: '#0D47A1', // Dark Blue
    sou: '#1B5E20', // Dark Green
    red: '#D32F2F', // Bright Red
    black: '#000000',
};

// --- PINZU (Circles) ---
const PinCircle = ({ size = '24%', color = COLORS.pin, innerColor = COLORS.pin }) => (
    <div style={{
        width: size,
        paddingTop: size, // Aspect ratio hack if width is %? No, simpler to use flex basis
        height: 0,
        paddingBottom: size,
        borderRadius: '50%',
        backgroundColor: 'white',
        border: `2px solid ${color}`,
        boxSizing: 'border-box',
        position: 'relative',
        margin: '1px' // Tiny gap
    }}>
        <div style={{
            position: 'absolute', inset: '15%', borderRadius: '50%', backgroundColor: innerColor
        }} />
    </div>
);

// Explicit pixel sizes for better control in small tiles
const SimpleCircle = ({ color }) => (
    <div style={{
        width: 8, height: 8,
        borderRadius: '50%',
        border: `1px solid ${color}`,
        background: 'white',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: color }} />
    </div>
);

const PinzuRender = ({ value }: { value: number }) => {
    // We use a fixed 33x46 internal coordinate system roughly, or just flex grids.
    // Normalized layout helper
    const Layout = ({ children, style }: any) => (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            ...style
        }}>{children}</div>
    );
    const Row = ({ children, gap = 2, style }: any) => <div style={{ display: 'flex', gap, justifyContent: 'center', ...style }}>{children}</div>;

    const C = ({ c = COLORS.pin }) => <SimpleCircle color={c} />;

    if (value === 1) {
        return <Layout><div style={{ width: 24, height: 24, borderRadius: '50%', background: COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.red }} />
            </div>
        </div></Layout>;
    }
    if (value === 2) return <Layout gap={8}><C /><C /></Layout>;
    if (value === 3) return <Layout><div style={{ transform: 'rotate(-45deg)', display: 'flex', flexDirection: 'column', gap: 4 }}><C /><C /><C /></div></Layout>;
    if (value === 4) return <Layout gap={4}><Row gap={4}><C c={COLORS.pin} /><C c={COLORS.red} /></Row><Row gap={4}><C c={COLORS.red} /><C c={COLORS.pin} /></Row></Layout>;
    if (value === 5) return <Layout><Row gap={8}><C c={COLORS.pin} /><C c={COLORS.pin} /></Row><div style={{ margin: '2px 0' }}><C c={COLORS.red} /></div><Row gap={8}><C c={COLORS.pin} /><C c={COLORS.pin} /></Row></Layout>;
    if (value === 6) return <Layout gap={4}><Row gap={4}><C c={COLORS.sou} /><C c={COLORS.sou} /></Row><Row gap={4}><C c={COLORS.red} /><C c={COLORS.red} /></Row><Row gap={4}><C c={COLORS.red} /><C c={COLORS.red} /></Row></Layout>; // 6: Top Green, Bot Red? Standard is usually all green or mixed. Let's use Green top, Red bot.
    if (value === 7) return <Layout><div style={{ transform: 'rotate(-30deg)', marginBottom: 2 }}><Row gap={2}><C c={COLORS.sou} /><C c={COLORS.sou} /><C c={COLORS.sou} /></Row></div><div style={{ marginTop: 2 }}><Row gap={4}><C c={COLORS.red} /><C c={COLORS.red} /></Row><Row gap={4}><C c={COLORS.red} /><C c={COLORS.red} /></Row></div></Layout>;
    if (value === 8) return <Layout gap={2}><Row gap={4}><C c={COLORS.pin} /><C c={COLORS.pin} /></Row><Row gap={4}><C c={COLORS.pin} /><C c={COLORS.pin} /></Row><Row gap={4}><C c={COLORS.pin} /><C c={COLORS.pin} /></Row><Row gap={4}><C c={COLORS.pin} /><C c={COLORS.pin} /></Row></Layout>;
    if (value === 9) return <Layout gap={2}><Row gap={2}><C c={COLORS.sou} /><C c={COLORS.sou} /><C c={COLORS.sou} /></Row><Row gap={2}><C c={COLORS.red} /><C c={COLORS.red} /><C c={COLORS.red} /></Row><Row gap={2}><C c={COLORS.sou} /><C c={COLORS.sou} /><C c={COLORS.sou} /></Row></Layout>;

    return <div>{value}</div>;
};

// --- SOUZU (Bamboo) ---
const Stick = ({ color = COLORS.sou, width = 3, height = 12, rotate = 0 }) => (
    <div style={{
        width, height,
        borderRadius: 1,
        backgroundColor: color,
        transform: rotate ? `rotate(${rotate}deg)` : undefined
    }} />
);

const Bird = () => (
    <svg width="28" height="28" viewBox="0 0 100 100">
        <path d="M50 20 Q70 5 80 25 Q85 45 70 55 L50 90 L30 55 Q15 45 20 25 Q30 5 50 20" fill={COLORS.sou} />
        <circle cx="45" cy="25" r="4" fill="white" />
        <path d="M50 90 L40 98 M50 90 L60 98 M50 90 L50 80" stroke={COLORS.red} strokeWidth="4" />
        <path d="M20 50 Q10 40 5 20" stroke={COLORS.sou} strokeWidth="3" fill="none" />
    </svg>
);

const SouzuRender = ({ value }: { value: number }) => {
    const Layout = ({ children, gap = 1 }: any) => (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            gap
        }}>{children}</div>
    );
    const Row = ({ children, gap = 3 }: any) => <div style={{ display: 'flex', gap, justifyContent: 'center' }}>{children}</div>;

    if (value === 1) return <Layout><Bird /></Layout>;

    if (value === 2) return <Layout gap={4}><Stick height={14} /><Stick height={14} /></Layout>;
    if (value === 3) return <Layout gap={2}><Stick height={10} /><Row gap={2}><Stick height={10} /><Stick height={10} /></Row></Layout>;
    if (value === 4) return <Layout gap={2}><Row><Stick height={14} /><Stick height={14} /></Row><Row><Stick height={14} /><Stick height={14} /></Row></Layout>;
    if (value === 5) return <Layout gap={2}><Row><Stick height={12} /><Stick height={12} color={COLORS.red} /><Stick height={12} /></Row><Row><Stick height={14} /><Stick height={14} /></Row></Layout>;
    if (value === 6) return <Layout gap={2}><Row><Stick /><Stick /><Stick /></Row><Row><Stick /><Stick /><Stick /></Row></Layout>;

    // 7 Sou: Top 2 Red Slanted, Bot 3 Green (Wait, 7 is 2 slanted + 5? No, usually 2 slanted + 3 straight? 
    // Standard: Top: 2 Red angular. Bottom: 3 Green straight.
    if (value === 7) return <Layout gap={4}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
            <Stick height={10} color={COLORS.red} rotate={-25} />
            <Stick height={10} color={COLORS.red} rotate={25} />
        </div>
        <Row gap={2}><Stick height={12} width={3} /><Stick height={12} width={3} /><Stick height={12} width={3} /></Row>
    </Layout>;

    // 8 Sou: Top M (4 green), Bot W (4 green)
    if (value === 8) return <Layout gap={6}>
        <div style={{ display: 'flex', gap: 2, transform: 'scaleY(1)' }}>
            <Stick height={8} rotate={-20} /><Stick height={8} rotate={-10} /><Stick height={8} rotate={10} /><Stick height={8} rotate={20} />
        </div>
        <div style={{ display: 'flex', gap: 2, transform: 'scaleY(-1)' }}>
            <Stick height={8} rotate={-20} /><Stick height={8} rotate={-10} /><Stick height={8} rotate={10} /><Stick height={8} rotate={20} />
        </div>
    </Layout>;

    // 9 Sou: 3 Green, 3 Red, 3 Green
    if (value === 9) return <Layout gap={1}>
        <Row gap={2}><Stick height={10} /><Stick height={10} /><Stick height={10} /></Row>
        <Row gap={2}><Stick height={10} color={COLORS.red} /><Stick height={10} color={COLORS.red} /><Stick height={10} color={COLORS.red} /></Row>
        <Row gap={2}><Stick height={10} /><Stick height={10} /><Stick height={10} /></Row>
    </Layout>;

    return <div>{value}s</div>;
};

// --- MANZU & HONOR ---
// Use standard font rendering but scaled properly
const CharRender = ({ text, sub, color, size = 'normal' }: { text: string, sub?: string, color: string, size?: 'normal' | 'small' }) => {
    // Optimized sizes for readability
    const isSmall = size === 'small';

    // Main character size
    // Small: 22px (fits in 40px height efficiently with sub). Normal: 32px.
    // If no subscript (Honor): Small: 28px. Normal: 38px.
    const mainSize = sub
        ? (isSmall ? '24px' : '32px')
        : (isSmall ? '28px' : '38px');

    const subSize = isSmall ? '10px' : '12px';

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            color, lineHeight: 1,
            // Negative margin to pack them tighter
            paddingTop: sub ? (isSmall ? 2 : 4) : 0
        }}>
            <span style={{
                fontSize: mainSize,
                fontWeight: 900,
                fontFamily: '"Hiragino Mincho ProN", serif',
                marginBottom: sub ? -2 : 0,
                display: 'block'
            }}>{text}</span>
            {sub && <span style={{
                fontSize: subSize,
                fontWeight: 'bold',
                opacity: 0.9
            }}>{sub}</span>}
        </div>
    );
};

// --- EXPORT ---
export const TileGraphics = ({ suit, value, size = 'normal' }: { suit: string, value: number, size?: 'normal' | 'small' }) => {
    // Only scale Pinzu and Souzu graphics to avoid overflow
    // Manzu and Honor use optimized font sizes (CharRender) without transforms
    const useScale = (suit === 'pin' || suit === 'sou');
    const scale = (useScale && size === 'small') ? 0.75 : 1;

    const content = (() => {
        if (suit === 'man') return <CharRender text={['一', '二', '三', '四', '五', '六', '七', '八', '九'][value - 1]} sub="萬" color={COLORS.man} size={size} />;

        if (suit === 'pin') return <PinzuRender value={value} />;

        if (suit === 'sou') return <SouzuRender value={value} />;

        if (suit === 'honor') {
            const map: any = { 1: '東', 2: '南', 3: '西', 4: '北', 5: '白', 6: '發', 7: '中' };
            let c = COLORS.black;
            if (value === 6) c = COLORS.sou;
            if (value === 7) c = COLORS.red;

            if (value === 5) { // White
                return <div style={{ width: '80%', height: '80%', border: '2px solid #333', borderRadius: 2 }} />;
            }
            return <CharRender text={map[value]} color={c} size={size} />;
        }
        return <div>?</div>;
    })();

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: useScale ? `scale(${scale})` : undefined,
            transformOrigin: 'center center'
        }}>
            {content}
        </div>
    );
};
