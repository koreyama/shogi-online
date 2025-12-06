import React from 'react';
import { GameState } from '@/lib/clicker/types';
import { INITIAL_JOBS } from '@/lib/clicker/data';
import styles from './JobManager.module.css';
import { IconFood, IconWood, IconPickaxe, IconBook, IconUsers } from '@/components/Icons';
import { formatNumber } from '@/lib/clicker/utils';

interface JobManagerProps {
    gameState: GameState;
    onAssign: (jobId: string, amount: number) => void;
}

export const JobManager: React.FC<JobManagerProps> = ({ gameState, onAssign }) => {
    // Calculate total assigned and unassigned population
    const totalAssigned = Object.values(gameState.jobs).reduce((a, b) => a + b, 0);
    const totalPop = Math.floor(gameState.resources.population);
    const unassigned = totalPop - totalAssigned;

    // Calculate Tech Multipliers
    const multipliers: { [key: string]: number } = {};
    Object.values(gameState.techs).forEach(tech => {
        if (tech.researched && tech.effects?.resourceMultiplier) {
            Object.entries(tech.effects.resourceMultiplier).forEach(([res, mult]) => {
                multipliers[res] = (multipliers[res] || 1) * mult;
            });
        }
    });

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>職業管理 (Jobs)</h2>
            <div className={styles.grid}>
                {Object.values(INITIAL_JOBS).map(job => {
                    const currentAssigned = gameState.jobs[job.id] || 0;

                    // Calculate max slots
                    let maxSlots = 0;
                    if (job.id === 'gatherer') maxSlots = 5;
                    Object.values(gameState.buildings).forEach(b => {
                        if (b.jobSlots && b.jobSlots[job.id]) {
                            maxSlots += b.jobSlots[job.id] * b.count;
                        }
                    });

                    // Skip if no slots and not assigned (unless it's a base job like gatherer)
                    if (maxSlots === 0 && currentAssigned === 0) return null;

                    const canAssign = unassigned > 0;
                    const canUnassign = currentAssigned > 0;

                    return (
                        <div key={job.id} className={styles.jobCard}>
                            <div className={styles.jobHeader}>
                                <div className={styles.jobTitle}>
                                    <span className={styles.jobIcon}>
                                        {job.id === 'gatherer' ? <IconFood size={20} /> :
                                            job.id === 'woodcutter' ? <IconWood size={20} /> :
                                                job.id === 'miner' ? <IconPickaxe size={20} /> :
                                                    job.id === 'scholar' ? <IconBook size={20} /> : <IconUsers size={20} />}
                                    </span>
                                    <span className={styles.jobName}>{job.name}</span>
                                </div>
                                <span className={styles.jobCount}>{currentAssigned} / {maxSlots}</span>
                            </div>

                            <p className={styles.jobDesc}>{job.description}</p>

                            <div className={styles.productionInfo}>
                                {Object.entries(job.production).map(([res, amt]) => {
                                    let finalAmount = amt;
                                    // Apply Tech Bonuses (Mirroring engine.ts logic)
                                    if (job.id === 'scholar' && gameState.techs['paper']?.researched && res === 'knowledge') {
                                        finalAmount += 1;
                                    }

                                    // Apply Global Multipliers
                                    if (multipliers[res]) {
                                        finalAmount *= multipliers[res];
                                    }

                                    return (
                                        <div key={res} className={styles.prodItem}>
                                            <span className={styles.prodLabel}>生産:</span>
                                            <span className={styles.prodValue}>+{formatNumber(finalAmount)} {res === 'food' ? '食料' : res === 'wood' ? '木材' : res === 'stone' ? '石材' : res === 'knowledge' ? '知識' : res === 'gold' ? '金' : res === 'iron' ? '鉄' : res === 'coal' ? '石炭' : res}</span>
                                        </div>
                                    );
                                })}
                                {job.consumption && Object.entries(job.consumption).map(([res, amt]) => {
                                    const resName = res === 'food' ? '食料' :
                                        res === 'wood' ? '木材' :
                                            res === 'stone' ? '石材' :
                                                res === 'knowledge' ? '知識' :
                                                    res === 'gold' ? '金' :
                                                        res === 'iron' ? '鉄' :
                                                            res === 'coal' ? '石炭' : '資源';
                                    return (
                                        <div key={res} className={styles.consItem}>
                                            <span className={styles.prodLabel} style={{ color: '#f56565' }}>消費:</span>
                                            <span className={styles.consValue}>-{formatNumber(amt)} {resName}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.controls}>
                                <button
                                    className={`${styles.controlBtn} ${styles.btnMinus}`}
                                    onClick={() => onAssign(job.id, -1)}
                                    disabled={!canUnassign}
                                >
                                    -
                                </button>
                                <button
                                    className={`${styles.controlBtn} ${styles.btnPlus}`}
                                    onClick={() => onAssign(job.id, 1)}
                                    disabled={!canAssign || currentAssigned >= maxSlots}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span>未割り当て:</span>
                    <span className={styles.summaryValue}>{unassigned}</span>
                </div>
            </div>
        </div>
    );
};
