import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, query, orderByChild, limitToLast, onValue } from 'firebase/database';

interface ScoreEntry {
    uid: string;
    name: string;
    score: number;
    timestamp: number;
}

export default function Leaderboard() {
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const scoresRef = ref(db, 'orbit_scores');
        const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(10));

        const unsubscribe = onValue(topScoresQuery, (snapshot) => {
            const data: ScoreEntry[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val && val.score !== undefined) {
                    data.push(val);
                }
            });
            // Firebase returns ascending order (lowest first), so reverse for ranking
            setScores(data.reverse());
            setLoading(false);
        }, (error) => {
            console.error("Leaderboard fetch error", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div style={{
            background: 'rgba(15, 12, 41, 0.9)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            maxWidth: '300px',
            width: '100%',
            fontFamily: 'sans-serif',
            maxHeight: '400px',
            overflowY: 'auto',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
        }}>
            <h3 style={{
                textAlign: 'center',
                margin: '0 0 15px 0',
                fontSize: '20px',
                color: '#ffd700',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '10px'
            }}>
                🏆 GLOBAL RANKING
            </h3>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {scores.length === 0 ? (
                        <li style={{ textAlign: 'center', color: '#888' }}>No scores yet</li>
                    ) : (
                        scores.map((entry, index) => (
                            <li key={entry.uid} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '14px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#888',
                                        width: '20px',
                                        textAlign: 'center'
                                    }}>
                                        {index + 1}
                                    </span>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: index === 0 ? '#fff' : '#ddd',
                                        maxWidth: '120px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {entry.name || 'Anonymous'}
                                    </span>
                                </div>
                                <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>
                                    {entry.score.toLocaleString()}
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
