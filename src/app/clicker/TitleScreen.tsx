import React from 'react';
import { User } from 'firebase/auth';
import styles from './TitleScreen.module.css';

interface TitleScreenProps {
    onNewGame: () => void;
    onContinue: () => void;
    hasSave: boolean;
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
    isLoading: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
    onNewGame,
    onContinue,
    hasSave,
    user,
    onLogin,
    onLogout,
    isLoading
}) => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>Civilization Builder</h1>
                <p className={styles.subtitle}>文明を築き、時代を超えろ</p>

                <div className={styles.menu}>
                    {isLoading ? (
                        <p className={styles.loading}>読み込み中...</p>
                    ) : (
                        <>
                            <button
                                className={styles.menuBtn}
                                onClick={onContinue}
                                disabled={!hasSave}
                            >
                                続きから
                            </button>
                            {!hasSave && (
                                <button
                                    className={`${styles.menuBtn} ${styles.newGameBtn}`}
                                    onClick={onNewGame}
                                >
                                    初めから
                                </button>
                            )}
                            <button
                                className={styles.menuBtn}
                                onClick={() => window.location.href = '/'}
                            >
                                ホームへ戻る
                            </button>
                        </>
                    )}
                </div>

                <div className={styles.authSection}>
                    {user ? (
                        <div className={styles.userInfo}>
                            <img src={user.photoURL || ''} alt="User" className={styles.userAvatar} />
                            <span className={styles.userName}>{user.displayName} でログイン中</span>
                            <button className={styles.authBtn} onClick={onLogout}>ログアウト</button>
                        </div>
                    ) : (
                        <div className={styles.loginPrompt}>
                            <p>Googleアカウントでログインしてデータを保存</p>
                            <button className={styles.authBtn} onClick={onLogin}>Googleでログイン</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
