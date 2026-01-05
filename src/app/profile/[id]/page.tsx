'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '../profile.module.css';
import Link from 'next/link';

// Types
interface UserProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    bio?: string;
    stats?: Record<string, { rating: number; wins: number; losses: number }>;
    createdAt?: number;
}

// Helper function to get game name
function getGameName(id: string) {
    const map: Record<string, string> = {
        shogi: '将棋',
        reversi: 'リバーシ',
        chess: 'チェス',
        mahjong: '麻雀',
    };
    return map[id] || id;
}

export default function ProfilePage() {
    const params = useParams();
    const targetUserId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [playerId, setPlayerId] = useState<string>('');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [firebaseLoaded, setFirebaseLoaded] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');

    // Friend Search
    const [friendIdInput, setFriendIdInput] = useState('');

    // Friend states
    const [friends, setFriends] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);

    const isMyProfile = user?.uid === targetUserId || playerId === targetUserId;

    // Initial mount
    useEffect(() => {
        setMounted(true);

        // Load player ID from localStorage
        if (typeof window !== 'undefined') {
            const storedPlayerId = localStorage.getItem('playerId');
            if (storedPlayerId) {
                setPlayerId(storedPlayerId);
            }
        }
    }, []);

    // Load Firebase auth after mount
    useEffect(() => {
        if (!mounted) return;

        let unsubscribe: (() => void) | undefined;

        const loadAuth = async () => {
            try {
                const firebaseModule = await import('@/lib/firebase');
                const auth = firebaseModule.auth;
                unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
                    setUser(firebaseUser);
                    setFirebaseLoaded(true);
                });
            } catch (e) {
                console.error('Firebase auth load error:', e);
                setFirebaseLoaded(true);
            }
        };

        loadAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [mounted]);

    // Fetch profile data after Firebase is loaded
    useEffect(() => {
        if (!targetUserId || !firebaseLoaded) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const usersModule = await import('@/lib/firebase/users');

                let userProfile = await usersModule.getUserProfile(targetUserId);

                if (!userProfile && user && user.uid === targetUserId) {
                    userProfile = await usersModule.ensureUserExists(user.uid, user.displayName || 'No Name', user.photoURL || '');
                }

                setProfile(userProfile);
                if (userProfile) {
                    setEditName(userProfile.displayName || '');
                    setEditBio(userProfile.bio || '');
                }

                const allFriends = await usersModule.getFriends(targetUserId);
                const accepted = allFriends.filter((f: any) => f.status === 'accepted');
                const incoming = allFriends.filter((f: any) => f.status === 'pending' && f.direction === 'received');
                const outgoing = allFriends.filter((f: any) => f.status === 'pending' && f.direction === 'sent');

                setFriends(accepted);
                setIncomingRequests(incoming);
                setOutgoingRequests(outgoing);
            } catch (e) {
                console.error('Profile fetch error:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [targetUserId, user, firebaseLoaded]);

    // Sync Google PhotoURL
    useEffect(() => {
        if (!mounted || !firebaseLoaded) return;
        if (isMyProfile && user?.photoURL && profile && profile.photoURL !== user.photoURL) {
            import('@/lib/firebase/users').then((mod) => {
                mod.updateUserProfileData(user.uid, { photoURL: user.photoURL });
            });
            setProfile(prev => prev ? { ...prev, photoURL: user.photoURL || '' } : null);
        }
    }, [isMyProfile, user, profile, mounted, firebaseLoaded]);

    const handleFriendRequest = async () => {
        if (!user) {
            alert("ログインが必要です");
            return;
        }
        try {
            const mod = await import('@/lib/firebase/users');
            await mod.sendFriendRequest(user.uid, targetUserId);
            alert("フレンド申請を送りました！");
        } catch (e) {
            alert("申請エラー: " + e);
        }
    };

    const handleAddFriendById = async () => {
        if (!user) {
            alert("ログインが必要です");
            return;
        }
        if (!friendIdInput) return;
        if (friendIdInput.trim() === user.uid) {
            alert("自分自身には申請できません");
            setFriendIdInput('');
            return;
        }

        try {
            const mod = await import('@/lib/firebase/users');
            await mod.sendFriendRequest(user.uid, friendIdInput.trim());
            alert(`${friendIdInput} にフレンド申請を送りました`);
            setFriendIdInput('');
        } catch (e) {
            alert("申請に失敗しました: " + e);
        }
    };

    const handleSaveProfile = async () => {
        if (!user || !profile) return;
        try {
            const mod = await import('@/lib/firebase/users');
            await mod.updateUserProfileData(user.uid, {
                displayName: editName,
                bio: editBio,
            });
            setProfile(prev => prev ? { ...prev, displayName: editName, bio: editBio } : null);
            setIsEditing(false);
            alert("プロフィールを更新しました");
        } catch (e) {
            alert("更新に失敗しました: " + e);
        }
    };

    const handleAccept = async (fromUid: string) => {
        if (!user) return;
        try {
            const mod = await import('@/lib/firebase/users');
            await mod.acceptFriendRequest(user.uid, fromUid);
            alert("フレンド登録しました！");
            window.location.reload();
        } catch (e) {
            alert("エラー: " + e);
        }
    };

    const handleReject = async (fromUid: string) => {
        if (!user) return;
        if (!confirm("本当に拒否しますか？")) return;
        try {
            const mod = await import('@/lib/firebase/users');
            await mod.rejectFriendRequest(user.uid, fromUid);
            setIncomingRequests(prev => prev.filter(req => req.uid !== fromUid));
        } catch (e) {
            alert("エラー: " + e);
        }
    };

    const handleRemoveFriend = async (friendUid: string) => {
        if (!user) return;
        if (!confirm("本当にこのフレンドを削除しますか？")) return;
        try {
            const mod = await import('@/lib/firebase/users');
            await mod.removeFriend(user.uid, friendUid);
            setFriends(prev => prev.filter(f => f.uid !== friendUid));
            alert("フレンドを削除しました");
        } catch (e) {
            alert("エラー: " + e);
        }
    };

    const copyToClipboard = (text: string) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text);
            alert("IDをコピーしました");
        }
    };

    // Show loading state
    if (!mounted) {
        return <div className={styles.container}>読み込み中...</div>;
    }

    if (loading) {
        return <div className={styles.container}>読み込み中...</div>;
    }

    if (!profile) {
        return <div className={styles.container}>ユーザーが見つかりません</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.profileHeader}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {profile.photoURL ?
                            <img src={profile.photoURL} alt="Avatar" /> :
                            <span>{profile.displayName?.charAt(0) || 'U'}</span>
                        }
                    </div>
                </div>

                <div className={styles.userInfo} style={{ flex: 1 }}>
                    {isEditing ? (
                        <div className={styles.editForm}>
                            <div className={styles.inputGroup}>
                                <label>表示名</label>
                                <input
                                    className={styles.editInput}
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="表示名"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>自己紹介</label>
                                <textarea
                                    className={styles.editTextarea}
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    placeholder="自己紹介文"
                                    rows={3}
                                />
                            </div>
                            <div className={styles.buttonGroup}>
                                <button className={styles.primaryBtn} onClick={handleSaveProfile}>保存する</button>
                                <button className={styles.secondaryBtn} onClick={() => setIsEditing(false)}>キャンセル</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className={styles.userName}>{profile.displayName || 'Unknown Player'}</h1>
                            <p className={styles.userBio}>{profile.bio || 'プロフィールはまだ設定されていません。'}</p>

                            <div className={styles.actionArea}>
                                {isMyProfile && (
                                    <button className={styles.secondaryBtn} onClick={() => setIsEditing(true)}>
                                        編集
                                    </button>
                                )}
                                {!isMyProfile && user && (
                                    (() => {
                                        const isFriend = friends.some(f => f.uid === user.uid);
                                        const isPendingIncoming = incomingRequests.some(r => r.uid === user.uid);
                                        const isPendingOutgoing = outgoingRequests.some(r => r.uid === user.uid);

                                        if (isFriend) return <span className={styles.statusBadge}>フレンド</span>;
                                        if (isPendingIncoming) return <span className={styles.statusBadge}>申請済み</span>;
                                        if (isPendingOutgoing) return <button className={styles.primaryBtn} onClick={() => handleAccept(user.uid)}>申請を承認</button>;

                                        return <button className={styles.primaryBtn} onClick={handleFriendRequest}>フレンド申請</button>;
                                    })()
                                )}
                            </div>

                            <div className={styles.idContainer}>
                                <span className={styles.idLabel}>ユーザーID:</span>
                                <code className={styles.idValue}>{profile.uid}</code>
                                <button className={styles.copyBtn} onClick={() => copyToClipboard(profile.uid)}>コピー</button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>ゲーム戦績</h2>
                <div className={styles.statsGrid}>
                    {profile.stats && Object.entries(profile.stats).map(([gameId, stat]) => (
                        <div key={gameId} className={styles.statCard}>
                            <div className={styles.gameTitle}>{getGameName(gameId)}</div>
                            <div className={styles.statDetails}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>レート</span>
                                    <span className={styles.statValue}>{stat.rating}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>勝利</span>
                                    <span className={styles.statValue}>{stat.wins}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>敗北</span>
                                    <span className={styles.statValue}>{stat.losses}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!profile.stats || Object.keys(profile.stats).length === 0) && (
                        <p className={styles.emptyText}>プレイ履歴はまだありません</p>
                    )}
                </div>
            </section>

            {isMyProfile && (
                <section className={styles.section}>
                    {incomingRequests.length > 0 && (
                        <div className={styles.requestSection}>
                            <h3 className={styles.subTitle}>受信したフレンド申請</h3>
                            <div className={styles.friendGrid}>
                                {incomingRequests.map(f => (
                                    <div key={f.uid} className={styles.friendCard} style={{ cursor: 'default' }}>
                                        <div className={styles.friendAvatarPlaceholder}>
                                            {f.photoURL ? (
                                                <img src={f.photoURL} alt={f.displayName} className={styles.friendAvatarImg} />
                                            ) : (
                                                <span>{f.displayName?.charAt(0) || 'U'}</span>
                                            )}
                                        </div>
                                        <div className={styles.friendInfo}>
                                            <Link href={`/profile/${f.uid}`} className={styles.friendName} style={{ textDecoration: 'underline' }}>
                                                {f.displayName || 'Unknown'}
                                            </Link>
                                            <span className={styles.friendIdSub}>ID: {f.uid.substring(0, 6)}...</span>
                                            <div className={styles.requestActions}>
                                                <button className={styles.acceptBtn} onClick={() => handleAccept(f.uid)}>承認</button>
                                                <button className={styles.rejectBtn} onClick={() => handleReject(f.uid)}>拒否</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h2 className={styles.sectionTitle}>フレンド ({friends.length})</h2>

                    <div className={styles.addFriendSection}>
                        <input
                            className={styles.friendIdInput}
                            value={friendIdInput}
                            onChange={(e) => setFriendIdInput(e.target.value)}
                            placeholder="ユーザーIDを入力して追加"
                        />
                        <button className={styles.addFriendBtn} onClick={handleAddFriendById}>申請</button>
                    </div>

                    {outgoingRequests.length > 0 && (
                        <div style={{ marginBottom: '1.5rem', color: '#718096', fontSize: '0.9rem' }}>
                            <p>送信済みの申請: {outgoingRequests.length} 件</p>
                        </div>
                    )}

                    <div className={styles.friendGrid}>
                        {friends.map(f => (
                            <div key={f.uid} className={styles.friendCard}>
                                <Link href={`/profile/${f.uid}`} className={styles.friendLinkContent}>
                                    <div className={styles.friendAvatarPlaceholder}>
                                        {f.photoURL ? (
                                            <img src={f.photoURL} alt={f.displayName} className={styles.friendAvatarImg} />
                                        ) : (
                                            <span>{f.displayName?.charAt(0) || '?'}</span>
                                        )}
                                    </div>
                                    <div className={styles.friendInfo}>
                                        <span className={styles.friendName}>{f.displayName}</span>
                                    </div>
                                </Link>
                                <button
                                    className={styles.removeFriendBtn}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveFriend(f.uid);
                                    }}
                                    title="フレンド削除"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {friends.length === 0 && <p className={styles.emptyText}>フレンドはいません</p>}
                    </div>
                </section>
            )}

            <Link href="/" className={styles.backLink}>
                トップに戻る
            </Link>
        </div>
    );
}
