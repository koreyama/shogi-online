'use client';

import React, { useState, useEffect } from 'react';
import * as Colyseus from 'colyseus.js';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import HideChatBot from '@/components/HideChatBot';

import WerewolfLobby from '@/components/werewolf/WerewolfLobby';
import WerewolfGame from '@/components/werewolf/WerewolfGame';

export default function WerewolfPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [client, setClient] = useState<Colyseus.Client | null>(null);
    const [room, setRoom] = useState<Colyseus.Room | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial players state for smooth transition
    const [initialPlayers, setInitialPlayers] = useState<any[]>([]);

    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_COLYSEUS_URL) {
            setError("Configuration Error: NEXT_PUBLIC_COLYSEUS_URL not set");
            return;
        }
        setClient(new Colyseus.Client(process.env.NEXT_PUBLIC_COLYSEUS_URL));
    }, []);

    const connect = async (action: () => Promise<Colyseus.Room>) => {
        if (!client || !user) return;
        setIsConnecting(true);
        setError(null);

        try {
            const r = await action();
            console.log("Joined room", r.sessionId);

            // Capture initial state immediately (Generic Schema support)
            if (r.state.players) {
                const currentPlayers: any[] = [];
                if (r.state.players.forEach) {
                    r.state.players.forEach((p: any) => currentPlayers.push(p));
                } else { // Fallback if it's an object/map
                    Object.values(r.state.players).forEach((p: any) => currentPlayers.push(p));
                }
                setInitialPlayers(currentPlayers);
            }

            setRoom(r);
        } catch (e: any) {
            console.error("Join failed", e);
            let msg = e.message || "Unknown error";
            if (msg.includes("not found")) msg = "指定されたルームが見つかりませんでした。";
            if (msg.includes("not defined")) msg = "サーバー設定エラー: 再起動が必要です。";
            setError(msg);
        } finally {
            setIsConnecting(false);
        }
    };

    const getPlayerName = async () => {
        if (!user) return "Guest";
        try {
            const { getUserProfile } = await import('@/lib/firebase/users');
            const profile = await getUserProfile(user.uid);
            return profile?.displayName || user.displayName || "Guest";
        } catch (e) {
            console.error("Failed to fetch profile", e);
            return user.displayName || "Guest";
        }
    };

    const handleJoinRandom = async () => {
        const playerName = await getPlayerName();
        connect(() => client!.joinOrCreate("werewolf", {
            name: playerName,
            uid: user?.uid,
            mode: "public"
        }));
    };

    const handleCreateRoom = async () => {
        const playerName = await getPlayerName();
        connect(() => client!.create("werewolf", {
            name: playerName,
            uid: user?.uid,
            mode: "private"
        }));
    };

    const handleJoinById = async (roomId: string) => {
        const playerName = await getPlayerName();
        connect(() => client!.joinById(roomId, {
            name: playerName,
            uid: user?.uid
        }));
    };

    const handleLeave = () => {
        room?.leave();
        setRoom(null);
        setInitialPlayers([]);
        setError(null);
    };

    if (authLoading) return null;

    return (
        <main>
            <HideChatBot />
            {!room ? (
                <WerewolfLobby
                    onJoinRandom={handleJoinRandom}
                    onCreateRoom={handleCreateRoom}
                    onJoinById={handleJoinById}
                    onBack={() => router.push('/')}
                    error={error}
                />
            ) : (
                <WerewolfGame
                    client={client!}
                    room={room}
                    initialPlayers={initialPlayers}
                    onLeave={handleLeave}
                    onError={(msg) => {
                        handleLeave();
                        setError(msg);
                    }}
                />
            )}
        </main>
    );
}
