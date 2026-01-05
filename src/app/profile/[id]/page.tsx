'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import styles from '../profile.module.css';
import { getUserProfile, getFriends, UserProfile, sendFriendRequest, updateUserProfileData, ensureUserExists } from '@/lib/firebase/users';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import Link from 'next/link';

export default function ProfilePage() {
    const params = useParams();
    const targetUserId = params.id as string;
    const { user } = useAuth();
    const { playerId } = usePlayer();

    const isMyProfile = user?.uid === targetUserId || playerId === targetUserId;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');

    // Avatar Seed for DiceBear
    const [avatarSeed, setAvatarSeed] = useState('');

    // Friend Search
    const [friendIdInput, setFriendIdInput] = useState('');

    // Friend states
    const [friends, setFriends] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);

    useEffect(() => {
        if (!targetUserId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let userConstants = await getUserProfile(targetUserId);

                // If profile doesn't exist but it matches current logged-in user, create it
                if (!userConstants && user && user.uid === targetUserId) {
                    userConstants = await ensureUserExists(user.uid, user.displayName || 'No Name', user.photoURL || '');
                }

                setProfile(userConstants);
                if (userConstants) {
                    setEditName(userConstants.displayName || '');
                    setEditBio(userConstants.bio || '');
                }

                const allFriends = await getFriends(targetUserId);

                // Categorize
                const accepted = allFriends.filter(f => f.status === 'accepted');
                const incoming = allFriends.filter(f => f.status === 'pending' && f.direction === 'received');
                const outgoing = allFriends.filter(f => f.status === 'pending' && f.direction === 'sent');

                setFriends(accepted);
                setIncomingRequests(incoming);
                setOutgoingRequests(outgoing);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [targetUserId, user]);

    const handleFriendRequest = async () => {
        if (!user) {
            alert("ログインが必要です");
            return;
        }
        try {
            await sendFriendRequest(user.uid, targetUserId);
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
            await sendFriendRequest(user.uid, friendIdInput.trim());
            alert(`${friendIdInput} にフレンド申請を送りました`);
            setFriendIdInput('');
        } catch (e) {
            alert("申請に失敗しました。IDを確認してください: " + e);
        }
    }

    // Sync Google PhotoURL if needed
    useEffect(() => {
        if (isMyProfile && user?.photoURL && profile && profile.photoURL !== user.photoURL) {
            // Auto-update to Google Avatar
            updateUserProfileData(user.uid, { photoURL: user.photoURL });
            setProfile(prev => prev ? { ...prev, photoURL: user.photoURL || '' } : null);
        }
    }, [isMyProfile, user, profile]);

    const handleSaveProfile = async () => {
        if (!user || !profile) return;
        try {
            await updateUserProfileData(user.uid, {
                displayName: editName,
                bio: editBio,
                // photoURL update removed (handled by auto-sync)
            });

            setIsEditing(false);
            alert("プロフィールを更新しました");
        } catch (e) {
            alert("更新に失敗しました: " + e);
        }
    };

    const handleAccept = async (fromUid: string) => {
        if (!user) return;
        try {
            await import('@/lib/firebase/users').then(mod => mod.acceptFriendRequest(user.uid, fromUid));
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
            await import('@/lib/firebase/users').then(mod => mod.rejectFriendRequest(user.uid, fromUid));
            setIncomingRequests(prev => prev.filter(req => req.uid !== fromUid));
        } catch (e) {
            alert("エラー: " + e);
        }
    };

    const handleRemoveFriend = async (friendUid: string) => {
        if (!user) return;
        if (!confirm("本当にこのフレンドを削除しますか？")) return;
        try {
            await import('@/lib/firebase/users').then(mod => mod.removeFriend(user.uid, friendUid));
            setFriends(prev => prev.filter(f => f.uid !== friendUid));
            alert("フレンドを削除しました");
        } catch (e) {
            alert("エラー: " + e);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("IDをコピーしました");
    };

    if (loading) return <div className={styles.container}>読み込み中...</div>;
    if (!profile && !loading) return <div className={styles.container}>ユーザーが見つかりません</div>;

    return (
        <div className={styles.container}>
            <div className={styles.profileHeader}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {profile?.photoURL ?
                            <img src={profile.photoURL} alt="Avatar" /> :
                            <span>{profile?.displayName?.charAt(0) || 'U'}</span>
                        }
                    </div>
                    {/* Avatar Generation Button Removed */}
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
                                <button className={styles.secondaryBtn} onClick={() => {
                                    setIsEditing(false);
                                }}>キャンセル</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className={styles.userName}>{profile?.displayName || 'Unknown Player'}</h1>
                            <p className={styles.userBio}>{profile?.bio || 'プロフィールはまだ設定されていません。'}</p>

                            <div className={styles.actionArea}>
                                {isMyProfile && (
                                    <button className={styles.secondaryBtn} onClick={() => setIsEditing(true)}>
                                        編集
                                    </button>
                                )}
                                {!isMyProfile && (
                                    (() => {
                                        const isFriend = friends.some(f => f.uid === user?.uid && f.status === 'accepted');
                                        const isPendingIncoming = incomingRequests.some(r => r.uid === user?.uid);
                                        const isPendingOutgoing = outgoingRequests.some(r => r.uid === user?.uid);

                                        // Note: friends/incoming/outgoing here are loaded from the TARGET user's perspective.
                                        // 'friends' -> Target's friends. My UID in there = we are friends.
                                        // 'incoming' -> Requests Target user RECEIVED. My UID in there = I sent it (Outgoing from me).
                                        // 'outgoing' -> Requests Target user SENT. My UID in there = I received it (Incoming to me).

                                        if (isFriend) {
                                            return <span className={styles.statusBadge}>フレンド</span>;
                                        }
                                        if (isPendingIncoming) {
                                            return <span className={styles.statusBadge}>申請済み</span>;
                                        }
                                        if (isPendingOutgoing) {
                                            return <button className={styles.primaryBtn} onClick={() => handleAccept(user?.uid || '')}>申請を承認</button>;
                                        }

                                        return (
                                            <button className={styles.primaryBtn} onClick={handleFriendRequest}>
                                                フレンド申請
                                            </button>
                                        );
                                    })()
                                )}
                            </div>

                            <div className={styles.idContainer}>
                                <span className={styles.idLabel}>ユーザーID:</span>
                                <code className={styles.idValue}>{profile?.uid}</code>
                                <button className={styles.copyBtn} onClick={() => profile?.uid && copyToClipboard(profile.uid)}>コピー</button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>ゲーム戦績</h2>
                <div className={styles.statsGrid}>
                    {profile?.stats && Object.entries(profile.stats).map(([gameId, stat]) => (
                        <div key={gameId} className={styles.statCard}>
                            <div className={styles.gameTitle}>
                                {getGameName(gameId)}
                            </div>
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
                    {(!profile?.stats || Object.keys(profile.stats).length === 0) && (
                        <p className={styles.emptyText}>プレイ履歴はまだありません</p>
                    )}
                </div>
            </section>

            {
                isMyProfile && (
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
                                                <span>{f.displayName.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className={styles.friendInfo}>
                                            <span className={styles.friendName}>{f.displayName}</span>
                                        </div>
                                    </Link>
                                    {isMyProfile && (
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
                                    )}
                                </div>
                            ))}
                            {friends.length === 0 && <p className={styles.emptyText}>フレンドはいません</p>}
                        </div>
                    </section>
                )
            }

            <Link href="/" className={styles.backLink}>
                トップに戻る
            </Link>
        </div >
    );
}

// Helpers
function getGameName(id: string) {
    const map: any = {
        shogi: '将棋',
        reversi: 'リバーシ',
        chess: 'チェス',
        mahjong: '麻雀',
    };
    return map[id] || id;
}
