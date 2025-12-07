'use client';

import React, { useState } from 'react';
import { GameState } from '@/lib/plague/types';
import { TRAITS } from '@/lib/plague/data';

interface EvolutionPanelProps {
    gameState: GameState;
    evolveTrait: (id: string) => void;
}

import { THEME } from './styles';

export const EvolutionPanel = ({ gameState, evolveTrait }: EvolutionPanelProps) => {
    const [tab, setTab] = useState<'transmission' | 'symptom' | 'ability'>('transmission');

    const filteredTraits = TRAITS.filter(t => t.type === tab);

    const getTabColor = (type: string) => {
        switch (type) {
            case 'transmission': return THEME.colors.primary; // Green
            case 'symptom': return THEME.colors.danger; // Red
            case 'ability': return THEME.colors.info; // Blue
            default: return 'white';
        }
    };

    const TabButton = ({ type, label, active, color }: any) => (
        <button
            onClick={() => setTab(type)}
            style={{
                flex: 1, padding: '0.8rem',
                background: active ? `linear-gradient(180deg, ${color}22 0%, transparent 100%)` : 'transparent',
                color: active ? color : THEME.colors.textMuted,
                border: `1px solid ${active ? color : THEME.colors.border}`,
                borderBottom: 'none',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: THEME.fonts.mono,
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                fontSize: '0.9rem'
            }}
        >
            {label}
        </button>
    );

    return (
        <div>
            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: '1rem', gap: '4px' }}>
                <TabButton type="transmission" label="Transmission" active={tab === 'transmission'} color={THEME.colors.primary} />
                <TabButton type="symptom" label="Symptoms" active={tab === 'symptom'} color={THEME.colors.danger} />
                <TabButton type="ability" label="Abilities" active={tab === 'ability'} color={THEME.colors.info} />
            </div>

            {/* List */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1rem',
                padding: '0.5rem' // Padding for glow clip
            }}>
                {filteredTraits.map(trait => {
                    const isUnlocked = gameState.traits[trait.id];
                    const canAfford = gameState.dnaPoints >= trait.cost;
                    const borderColor = getTabColor(trait.type);
                    const isLockedByDep = trait.reqTraits && trait.reqTraits.some(req => !gameState.traits[req]);

                    return (
                        <div key={trait.id} style={{
                            ...THEME.effects.panel,
                            padding: '1.2rem',
                            borderRadius: '1px',
                            border: `1px solid ${isUnlocked ? borderColor : THEME.colors.border}`,
                            opacity: (isLockedByDep) ? 0.4 : 1,
                            position: 'relative',
                            transition: 'all 0.3s',
                            cursor: 'default',
                            boxShadow: isUnlocked ? `0 0 15px ${borderColor}33` : 'none',
                            color: THEME.colors.textMain
                        }}>
                            <div style={{
                                fontWeight: 'bold',
                                marginBottom: '0.8rem',
                                color: isUnlocked ? borderColor : 'white',
                                fontFamily: THEME.fonts.mono,
                                fontSize: '1rem',
                                display: 'flex', justifyContent: 'space-between'
                            }}>
                                {trait.name}
                                {isUnlocked && <span>[✔]</span>}
                            </div>

                            <div style={{ fontSize: '0.85rem', color: THEME.colors.textMuted, marginBottom: '1rem', minHeight: '40px', lineHeight: '1.4' }}>
                                {trait.description}
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderTop: `1px solid ${THEME.colors.border}`,
                                paddingTop: '0.8rem'
                            }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: THEME.colors.warning, fontFamily: THEME.fonts.mono }}>
                                    {trait.cost} DNA
                                </div>

                                {isLockedByDep ? (
                                    <div style={{ fontSize: '0.7rem', color: THEME.colors.danger }}>LOCKED</div>
                                ) : !isUnlocked ? (
                                    <button
                                        disabled={!canAfford}
                                        onClick={() => evolveTrait(trait.id)}
                                        style={{
                                            padding: '0.4rem 1rem',
                                            background: canAfford ? borderColor : 'transparent',
                                            color: canAfford ? '#000' : THEME.colors.textMuted,
                                            border: `1px solid ${canAfford ? borderColor : THEME.colors.border}`,
                                            borderRadius: '2px',
                                            cursor: canAfford ? 'pointer' : 'not-allowed',
                                            fontWeight: 'bold',
                                            fontFamily: THEME.fonts.mono,
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        EVOLVE
                                    </button>
                                ) : (
                                    <div style={{ fontSize: '0.7rem', color: borderColor }}>ACTIVE</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
