import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { IconXLogo, IconDownload, IconCopy, IconCheck } from '@/components/Icons';
import styles from './ResultShareModal.module.css';

interface ResultShareModalProps {
    score: number;
    rank: string;
    wpm: number;
    accuracy: number;
    difficulty: string;
    onClose: () => void;
}

export const ResultShareModal: React.FC<ResultShareModalProps> = ({
    score, rank, wpm, accuracy, difficulty, onClose
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generateImage = async () => {
        if (!cardRef.current || generating) return;
        setGenerating(true);
        try {
            // Need to temporarily show the card if it's hidden, or ensure it's rendered
            // In this modal, it's visible.
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null, // Transparent or use CSS bg
                scale: 2, // Better quality
                useCORS: true,
            });
            const url = canvas.toDataURL('image/png');
            setImageUrl(url);
        } catch (error) {
            console.error("Failed to generate image", error);
        } finally {
            setGenerating(false);
        }
    };

    // Auto-generate on mount or just require user click? 
    // Let's auto-generate for better UX after a short delay to ensure fonts load
    React.useEffect(() => {
        const timer = setTimeout(() => {
            generateImage();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleShareTwitter = async () => {
        // If we have an image, we can't directly attach it to a web intent reliably without server.
        // So we guide user: "Image copied! Paste it in the tweet."

        if (!imageUrl) await generateImage();

        // Try to copy to clipboard
        if (cardRef.current) {
            try {
                const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
                canvas.toBlob(blob => {
                    if (blob) {
                        // navigator.clipboard.write supports only some mime types and needs secure context
                        try {
                            const item = new ClipboardItem({ 'image/png': blob });
                            navigator.clipboard.write([item]).then(() => {
                                setCopied(true);
                                openTwitterIntent();
                            }).catch(err => {
                                console.warn("Clipboard write failed", err);
                                // Fallback: Just open twitter, ask user to download
                                openTwitterIntent();
                            });
                        } catch (e) {
                            openTwitterIntent();
                        }
                    }
                });
            } catch (e) {
                openTwitterIntent();
            }
        }
    };

    const openTwitterIntent = () => {
        const text = `タイピング練習でスコア ${score.toLocaleString()} (ランク${rank}) を出しました！\nWPM: ${wpm} / 正確率: ${accuracy}%\n\n#AsobiLounge #タイピング練習`;
        const url = "https://asobi-lounge.com/typing"; // Replace with actual URL
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(intentUrl, '_blank');
    };

    const handleDownload = () => {
        if (imageUrl) {
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = `typing-result-${Date.now()}.png`;
            a.click();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <h2 className={styles.title}>結果をシェア</h2>

                <div className={styles.previewArea}>
                    {/* The Card to Caption */}
                    <div className={styles.resultCard} ref={cardRef}>
                        <div className={styles.cardHeader}>
                            <div className={styles.logo}>Asobi Lounge</div>
                            <div className={styles.mode}>タイピング練習 ({difficulty.toUpperCase()})</div>
                        </div>

                        <div className={styles.mainScore}>
                            <div className={styles.rankBadge} data-rank={rank}>{rank}</div>
                            <div className={styles.scoreVal}>{score.toLocaleString()}</div>
                            <div className={styles.scoreLabel}>SCORE</div>
                        </div>

                        <div className={styles.statsGrid}>
                            <div className={styles.stat}>
                                <div className={styles.statLabel}>WPM</div>
                                <div className={styles.statVal}>{wpm}</div>
                            </div>
                            <div className={styles.stat}>
                                <div className={styles.statLabel}>Accuracy</div>
                                <div className={styles.statVal}>{accuracy}%</div>
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            asobi-lounge.com
                        </div>
                    </div>

                    {/* Loading Overlay for Preview */}
                    {generating && !imageUrl && (
                        <div className={styles.generatingOverlay}>生成中...</div>
                    )}
                </div>

                <p className={styles.helperText}>
                    {copied ? "画像がクリップボードにコピーされました！ツイートに貼り付けてください。" : "画像を生成しています..."}
                </p>

                <div className={styles.actions}>
                    <button className={styles.twitterBtn} onClick={handleShareTwitter}>
                        <IconXLogo size={20} /> ポストする
                    </button>

                    {imageUrl && (
                        <button className={styles.downloadBtn} onClick={handleDownload}>
                            <IconDownload size={20} /> 画像を保存
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
