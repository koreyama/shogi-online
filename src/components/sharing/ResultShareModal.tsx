// Markdown syntax removed
import React, { useRef, useState, useEffect } from 'react';
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
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        // Check if native sharing is supported
        if (typeof navigator !== 'undefined' && navigator.share) {
            // Basic check, actual file share check is harder but usually goes together
            setCanNativeShare(true);
        }
        // Auto-generate image
        const timer = setTimeout(() => {
            generateImage();
        }, 800); // Slightly longer delay for fonts
        return () => clearTimeout(timer);
    }, []);

    const generateImage = async () => {
        if (!cardRef.current || generating) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 3, // High resolution
                useCORS: true,
                logging: false,
            });
            const url = canvas.toDataURL('image/png');
            setImageUrl(url);

            canvas.toBlob(blob => {
                setImageBlob(blob);
            }, 'image/png');

        } catch (error) {
            console.error("Failed to generate image", error);
        } finally {
            setGenerating(false);
        }
    };

    const handleShare = async () => {
        if (!imageBlob && !imageUrl) {
            await generateImage();
        }

        const shareData = {
            title: 'Asobi Lounge Typing Result',
            text: `タイピング練習でスコア ${score.toLocaleString()} (ランク${rank}) を出しました！\n#AsobiLounge`,
            url: 'https://asobi-lounge.com',
        };

        // Try Native Share with Image
        if (imageBlob && navigator.share && navigator.canShare) {
            const file = new File([imageBlob], 'typing-result.png', { type: 'image/png' });
            const fileShareData = {
                files: [file],
                title: 'Asobi Lounge Result',
                text: shareData.text,
                url: shareData.url
            };

            if (navigator.canShare(fileShareData)) {
                try {
                    await navigator.share(fileShareData);
                    return; // Success
                } catch (err) {
                    console.log('Native file share failed/cancelled', err);
                    // Fallback to text share or clipboard
                }
            }
        }

        // Fallback: Clipboard or Download + Twitter Intent
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
        const text = `タイピング練習でスコア ${score.toLocaleString()} (ランク${rank}) を出しました！\nWPM: ${wpm} / 正確率: ${accuracy}%\n\n#AsobiLounge #タイピング練習`;
        const url = "https://asobi-lounge.com";
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(intentUrl, '_blank');
    };

    const handleDownload = () => {
        if (imageUrl) {
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = `asobi-lounge-typing-${Date.now()}.png`;
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
                        {/* Decorative Background Elements */}
                        <div className={styles.cardBgPattern} />
                        <div className={styles.cardGlow} />

                        <div className={styles.cardContent}>
                            <div className={styles.cardHeader}>
                                <div className={styles.logoRow}>
                                    <span className={styles.appLogo}>Asobi Lounge</span>
                                </div>
                                <div className={styles.gameModeBadge}>Typing Practice</div>
                            </div>

                            <div className={styles.mainScoreArea}>
                                <div className={styles.rankWrapper}>
                                    <div className={styles.rankLabel}>RANK</div>
                                    <div className={styles.rankValue} data-rank={rank}>{rank}</div>
                                </div>
                                <div className={styles.scoreWrapper}>
                                    <div className={styles.scoreLabel}>SCORE</div>
                                    <div className={styles.scoreValue}>{score.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className={styles.statsRow}>
                                <div className={styles.statBox}>
                                    <div className={styles.statLabel}>WPM</div>
                                    <div className={styles.statValue}>{wpm}</div>
                                </div>
                                <div className={styles.statDivider} />
                                <div className={styles.statBox}>
                                    <div className={styles.statLabel}>Accuracy</div>
                                    <div className={styles.statValue}>{accuracy}<span className={styles.unit}>%</span></div>
                                </div>
                                <div className={styles.statDivider} />
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
                    {copied
                        ? "画像をコピーしました！ツイートに貼り付けてください。"
                        : canNativeShare
                            ? "「シェア」ボタンから画像を共有できます"
                            : "画像を保存またはコピーして、SNSでシェアしよう！"
                    }
                </p>

                <div className={styles.actions}>
                    {canNativeShare ? (
                        <button className={styles.shareBtnPrimary} onClick={handleShare}>
                            <IconXLogo size={20} /> シェアする
                        </button>
                    ) : (
                        <button className={styles.shareBtnPrimary} onClick={handleShare}>
                            <IconXLogo size={20} /> 画像をコピーしてポスト
                        </button>
                    )}

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
// End of file cleanup
