import React from 'react';
import styles from './page.module.css';
import { GameState, Tech, Building } from '@/lib/clicker/types';
import { IconLock, IconCheck, IconBook, IconHammer, IconFood, IconWood, IconPickaxe, IconGold } from '@/components/Icons';
import { formatNumber } from '@/lib/clicker/utils';

type Props = {
    gameState: GameState;
    onClose: () => void;
    onResearch: (id: string) => void;
    onBuyBuilding: (id: string) => void;
    calculateCost: (b: Building) => any;
};

export const TechTreeModal: React.FC<Props> = ({ gameState, onClose, onResearch, onBuyBuilding, calculateCost }) => {

    // Helper to render a tech node
    const renderTechNode = (techId: string) => {
        const tech = gameState.techs[techId];
        if (!tech) return null;

        const isResearched = tech.researched;
        const isUnlocked = tech.unlocked;
        const canAfford = Object.entries(tech.cost).every(([res, amount]) => gameState.resources[res as keyof typeof gameState.resources] >= (amount as number));

        return (
            <div key={techId} className={`${styles.treeNode} ${isResearched ? styles.nodeResearched : ''} ${!isUnlocked ? styles.nodeLocked : ''}`}>
                <div className={styles.nodeHeader}>
                    <span className={styles.nodeIcon}><IconBook size={16} /></span>
                    <span className={styles.nodeTitle}>{tech.name}</span>
                </div>
                <div className={styles.nodeDesc}>{tech.description}</div>
                <div className={styles.nodeCost}>
                    {isResearched ? (
                        <span className={styles.costDone}><IconCheck size={14} /> 完了</span>
                    ) : (
                        <div className={styles.costList}>
                            {Object.entries(tech.cost).map(([res, amount]) => {
                                const hasEnough = gameState.resources[res as keyof typeof gameState.resources] >= (amount as number);
                                return (
                                    <span key={res} style={{ color: hasEnough ? '#2d3748' : '#e53e3e', marginRight: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                        {res === 'knowledge' ? <IconBook size={14} /> :
                                            res === 'food' ? <IconFood size={14} /> :
                                                res === 'wood' ? <IconWood size={14} /> :
                                                    res === 'stone' ? <IconPickaxe size={14} /> :
                                                        res === 'gold' ? <IconGold size={14} /> :
                                                            res === 'iron' ? <IconPickaxe size={14} color="#718096" /> : <IconPickaxe size={14} color="#2d3748" />}
                                        {formatNumber(amount as number)}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
                {!isResearched && isUnlocked && (
                    <button
                        className={styles.researchButton}
                        disabled={!canAfford}
                        onClick={() => onResearch(techId)}
                    >
                        研究
                    </button>
                )}

                {/* Unlocked Buildings (Children) */}
                {tech.effects?.unlockBuilding && (
                    <div className={styles.nodeChildren}>
                        {tech.effects.unlockBuilding.map(bId => {
                            const building = gameState.buildings[bId];
                            if (!building) return null;
                            const cost = calculateCost(building);
                            const canBuy = Object.entries(cost).every(([r, a]) => gameState.resources[r as keyof typeof gameState.resources] >= (a as number));

                            return (
                                <div key={bId} className={styles.buildingNode}>
                                    <div className={styles.bNodeHeader}>
                                        <IconHammer size={14} /> {building.name}
                                    </div>
                                    <div className={styles.bNodeCost}>
                                        {Object.entries(cost).map(([r, a]) => `${r}: ${formatNumber(a as number)}`).join(', ')}
                                    </div>
                                    <button
                                        className={styles.buildButton}
                                        disabled={!canBuy}
                                        onClick={() => onBuyBuilding(bId)}
                                    >
                                        建設 ({building.count})
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.fullScreenModal}>
                <div className={styles.fsHeader}>
                    <h2>文明の系譜 (Technology Tree)</h2>
                    <button onClick={onClose} className={styles.closeButton}>閉じる</button>
                </div>
                <div className={styles.treeCanvas}>
                    {/* Primitive Era */}
                    <div className={styles.eraColumn}>
                        <h3 className={styles.columnTitle}>原始時代</h3>
                        <div className={styles.nodeGroup}>
                            {renderTechNode('stone_tools')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('fire')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('mining')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('weaving')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('domestication')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('archery')}
                        </div>
                    </div>

                    {/* Ancient Era */}
                    <div className={styles.eraColumn}>
                        <h3 className={styles.columnTitle}>古代</h3>
                        <div className={styles.nodeGroup}>
                            {renderTechNode('agriculture')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('pottery')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('writing')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('wheel')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('masonry')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('calendar')}
                        </div>
                    </div>

                    {/* Classical Era */}
                    <div className={styles.eraColumn}>
                        <h3 className={styles.columnTitle}>古典時代</h3>
                        <div className={styles.nodeGroup}>
                            {renderTechNode('currency')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('philosophy')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('iron_working')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('mathematics')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('drama')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('engineering')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('law')}
                        </div>
                    </div>

                    {/* Medieval Era */}
                    <div className={styles.eraColumn}>
                        <h3 className={styles.columnTitle}>中世</h3>
                        <div className={styles.nodeGroup}>
                            {renderTechNode('feudalism')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('machinery')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('university_tech')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('guilds')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('compass')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('theology')}
                        </div>
                    </div>

                    {/* Renaissance Era */}
                    <div className={styles.eraColumn}>
                        <h3 className={styles.columnTitle}>ルネサンス</h3>
                        <div className={styles.nodeGroup}>
                            {renderTechNode('printing_press')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('astronomy')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('banking')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('gunpowder')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('navigation')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('metallurgy')}
                        </div>
                    </div>

                    {/* Industrial Era */}
                    <div className={styles.eraColumn}>
                        <h3 className={styles.columnTitle}>産業時代</h3>
                        <div className={styles.nodeGroup}>
                            {renderTechNode('steam_power')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('industrialization')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('electricity')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('chemistry')}
                            <div className={styles.connectorLine} />
                            {renderTechNode('railroad')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
