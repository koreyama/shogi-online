export const THEME = {
    colors: {
        background: '#0d1117', // Deep dark blue/black
        surface: 'rgba(22, 27, 34, 0.7)', // Glassy dark
        surfaceHighlight: 'rgba(48, 54, 61, 0.6)',
        primary: '#00ff9d', // Neon Green (Bio)
        primaryGlow: '0 0 10px #00ff9d, 0 0 20px #00ff9d',
        danger: '#ff2a6d', // Neon Red (Infection)
        dangerGlow: '0 0 10px #ff2a6d, 0 0 20px #ff2a6d',
        warning: '#f5d90a', // Neon Yellow
        info: '#05d9e8', // Cyan (Cure/Tech)
        textMain: '#e6edf3',
        textMuted: '#8b949e',
        border: 'rgba(240, 246, 252, 0.1)',
    },
    effects: {
        glass: {
            background: 'rgba(13, 17, 23, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
        },
        panel: {
            background: 'linear-gradient(145deg, rgba(22,27,34,0.9), rgba(13,17,23,0.9))',
            border: '1px solid rgba(0, 255, 157, 0.1)',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
        }
    },
    fonts: {
        mono: '"JetBrains Mono", "Fira Code", monospace', // Tech feel
        sans: '"Inter", system-ui, sans-serif',
    }
};
