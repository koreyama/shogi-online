'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    IconShogi, IconChess, IconReversi, IconGomoku, IconMancala,
    IconCards, IconDice, IconPalette, IconCoin
} from '@/components/Icons';

const icons = [
    { component: IconShogi, color: '#e2e8f0', size: 60, top: '10%', left: '5%', delay: 0 },
    { component: IconChess, color: '#cbd5e0', size: 80, top: '20%', right: '10%', delay: 1 },
    { component: IconReversi, color: '#e2e8f0', size: 50, top: '40%', left: '15%', delay: 2 },
    { component: IconGomoku, color: '#edf2f7', size: 70, top: '60%', right: '5%', delay: 0.5 },
    { component: IconMancala, color: '#e2e8f0', size: 60, bottom: '20%', left: '10%', delay: 1.5 },
    { component: IconCards, color: '#cbd5e0', size: 90, bottom: '10%', right: '15%', delay: 2.5 },
    { component: IconDice, color: '#e2e8f0', size: 55, top: '50%', right: '25%', delay: 3 },
    { component: IconPalette, color: '#edf2f7', size: 65, top: '15%', left: '25%', delay: 1.2 },
    { component: IconCoin, color: '#e2e8f0', size: 60, bottom: '30%', left: '30%', delay: 0.8 },
];

export const FloatingShapes = () => {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0
        }}>
            {icons.map((item, i) => {
                const Icon = item.component;
                return (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: item.top,
                            left: item.left,
                            right: item.right,
                            bottom: item.bottom,
                            color: item.color,
                            opacity: 0.4
                        }}
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: item.delay
                        }}
                    >
                        <Icon size={item.size} />
                    </motion.div>
                );
            })}
        </div>
    );
};
