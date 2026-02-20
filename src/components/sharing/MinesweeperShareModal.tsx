import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { IconXLogo, IconDownload } from '@/components/Icons';
import styles from './ResultShareModal.module.css'; // Reuse styles or create new

interface MinesweeperShareModalProps {
    time: number;
    difficulty: string;
    rank?: number | null; // Optional rank
    onClose: () => void;
}

export const MinesweeperShareModal: React.FC<MinesweeperShareModalProps> = ({
    time, difficulty, rank, onClose
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            generateImage();
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const generateImage = async () => {
        if (!cardRef.current || generating) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 3,
                useCORS: true,
                logging: false,
            });
            const url = canvas.toDataURL('image/png');
            setImageUrl(url);
            canvas.toBlob(blob => setImageBlob(blob), 'image/png');
        } catch (error) {
            console.error("Failed to generate image", error);
        } finally {
            setGenerating(false);
        }
    };

    const handleShare = async () => {
        if (!imageBlob && !imageUrl) await generateImage();
        await copyImageToClipboard();
        openTwitterIntent();
    };

    const copyImageToClipboard = async () => {
        if (!imageBlob) return;
        try {
            const item = new ClipboardItem({ 'image/png': imageBlob });
            await navigator.clipboard.write([item]);
            setCopied(true);
        } catch (e) {
            console.warn("Clipboard write failed", e);
        }
    };

    const openTwitterIntent = () => {
        const rankText = rank ? `${rank}位` : '';
        // Format: Time: 123s
        const text = `【マインスイーパー結果】\n難易度: ${difficulty}\nタイム: ${time}秒${rank ? `\nランキング: ${rankText}` : ''}\n\n#AsobiLounge #マインスイーパー`;
        const url = "https://asobi-lounge.com";
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(intentUrl, '_blank');
    };

    const handleDownload = () => {
        if (imageUrl) {
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = `asobi-lounge-minesweeper-${Date.now()}.png`;
            a.click();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
                <h2 className={styles.title}>結果をシェア</h2>

                <div className={styles.previewContainer}>
                    <div className={styles.resultCard} ref={cardRef}>
                        <div className={styles.cardBgPattern} />
                        <div className={styles.cardGlow} />

                        <div className={styles.cardContent}>
                            <div className={styles.cardHeader}>
                                <div className={styles.logoRow}>
                                    <span className={styles.appLogo}>Asobi Lounge</span>
                                </div>
                                <div className={styles.gameModeBadge}>Minesweeper</div>
                            </div>

                            <div className={styles.mainScoreArea}>
                                {rank ? (
                                    <div className={styles.rankWrapper}>
                                        <div className={styles.rankLabel}>GLOBAL RANK</div>
                                        <div className={styles.rankValue} style={{ fontSize: '4rem' }}>
                                            {rank}<span style={{ fontSize: '1.5rem', marginLeft: '4px' }}>位</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.rankWrapper}>
                                        <div className={styles.rankLabel}>CLEAR!</div>
                                        <div className={styles.rankValue} style={{ fontSize: '3.5rem', color: '#10b981' }}>WIN</div>
                                    </div>
                                )}

                                <div className={styles.scoreWrapper}>
                                    <div className={styles.scoreLabel}>TIME</div>
                                    <div className={styles.scoreValue}>{time}<span style={{ fontSize: '0.4em' }}>s</span></div>
                                </div>
                            </div>

                            <div className={styles.statsRow}>
                                <div className={styles.statBox}>
                                    <div className={styles.statLabel}>Difficulty</div>
                                    <div className={styles.statValue} style={{ textTransform: 'capitalize' }}>{difficulty}</div>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <div className={styles.url}>asobi-lounge.com</div>
                                <div className={styles.date}>{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    {generating && !imageUrl && (
                        <div className={styles.generatingOverlay}>
                            <div className={styles.spinner}></div>
                            <span>Generating...</span>
                        </div>
                    )}
                </div>

                <p className={styles.helperText}>
                    {copied ? "画像をコピーしました！ツイートに貼り付けてください。" : "コピーしてXでシェアしよう！"}
                </p>

                <div className={styles.actions}>
                    <button className={styles.shareBtnPrimary} onClick={handleShare}>
                        <IconXLogo size={20} /> Xでポスト
                    </button>
                    {imageUrl && (
                        <button className={styles.downloadBtn} onClick={handleDownload} title="保存">
                            <IconDownload size={22} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
