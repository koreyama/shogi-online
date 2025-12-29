import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GameEffectOverlay.module.css';

interface Props {
    effect: string | null; // e.g., '8cut', 'revolution', 'miyako_ochi'
    isVisible: boolean;
}

const effectText: Record<string, string> = {
    '8cut': '8切り',
    'revolution': '革命',
    'revolution_end': '革命返し',
    '11back': '11バック',
    'staircase': '階段',
    'shibari': '縛り',
    'rokurokubi': 'ろくろ首',
    'kyukyusha': '救急車',
    'qbomber': 'Qボンバー',
    '5skip': '5スキップ',
    '7watashi': '7渡し',
    'miyako_ochi': '都落ち'
};

const effectColors: Record<string, string> = {
    '8cut': '#e53e3e',
    'revolution': '#d69e2e',
    'revolution_end': '#38a169',
    '11back': '#3182ce',
    'staircase': '#805ad5',
    'shibari': '#dd6b20',
    'rokurokubi': '#d53f8c',
    'kyukyusha': '#e53e3e',
    'qbomber': '#e53e3e',
    '5skip': '#3182ce',
    '7watashi': '#38a169',
    'miyako_ochi': '#718096'
};

export const GameEffectOverlay: React.FC<Props> = ({ effect, isVisible }) => {
    return (
        <AnimatePresence>
            {isVisible && effect && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.5, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <div
                        className={styles.text}
                        style={{
                            textShadow: `0 4px 10px ${effectColors[effect] || '#000'}`,
                            color: 'white',
                            borderColor: effectColors[effect] || 'white'
                        }}
                    >
                        {effectText[effect] || effect}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
