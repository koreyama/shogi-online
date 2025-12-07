import React from 'react';
import { NewsItem } from '@/lib/plague/types';

interface NewsTickerProps {
    news: NewsItem[];
}

export const NewsTicker = ({ news }: NewsTickerProps) => {
    // Get last 5 news items
    const recentNews = [...news].reverse().slice(0, 5);
    const tickerText = recentNews.map(n => `[${new Date(n.date).toLocaleDateString()}] ${n.text}`).join('   +++   ');

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '30px',
            background: 'rgba(0,0,0,0.8)',
            borderBottom: '1px solid #333',
            color: '#fff',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            zIndex: 900,
            fontFamily: 'monospace',
            fontSize: '0.9rem'
        }}>
            <div style={{
                background: '#cc0000',
                height: '100%',
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold',
                zIndex: 2 // Sit on top of marquee
            }}>
                BREAKING NEWS
            </div>

            <div
                className="ticker-content"
                style={{
                    display: 'inline-block',
                    paddingLeft: '100%', // Start off-screen
                    animation: 'ticker 20s linear infinite',
                    color: '#ddd'
                }}
            >
                {recentNews.length > 0 ? tickerText : 'No active reports...'}
            </div>

            <style jsx>{`
                @keyframes ticker {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-100%, 0, 0); }
                }
            `}</style>
        </div>
    );
};
