"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Client, Room } from "colyseus.js";
import { client as colyseusClientInstance } from '@/lib/colyseus'; // Renamed to avoid conflict
import BilliardsGame from '@/components/billiards/BilliardsGame';
import { MatchingWaitingScreen } from '@/components/game/MatchingWaitingScreen';
import { useAuth } from '@/hooks/useAuth';

interface Props {
    mode: 'solo' | 'multiplayer';
    isPrivate?: boolean;
    roomId?: string;
    onBack: () => void;
}

export default function ColyseusBilliardsGame({ mode, isPrivate, roomId, onBack }: Props) {
    const { user, loading } = useAuth(); // Get loading state
    const [room, setRoom] = useState<Room | null>(null);
    const [myPlayerName, setMyPlayerName] = useState<string>(""); // Store fetched player name
    const [error, setError] = useState<string | null>(null);
    const roomRef = useRef<Room | null>(null);
    const dataEffectCalled = useRef(false);
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished'>('connecting');

    useEffect(() => {
        if (loading) return;

        if (mode === 'solo') {
            setStatus('playing');
            setMyPlayerName(user?.displayName || "Player");
            return;
        }

        if (dataEffectCalled.current) return;
        dataEffectCalled.current = true;

        const connect = async () => {
            try {
                // Fetch user profile name 
                let playerName = user?.displayName || "Guest";
                if (user) {
                    try {
                        const { getUserProfile } = await import('@/lib/firebase/users');
                        const profile = await getUserProfile(user.uid);
                        if (profile?.displayName) {
                            playerName = profile.displayName;
                        }
                    } catch (e) {
                        console.error("Failed to fetch profile name:", e);
                    }
                }
                setMyPlayerName(playerName);

                console.log("Connecting to billiards...");
                let currentRoom: Room;

                if (roomId) {
                    // Join specific room
                    currentRoom = await colyseusClientInstance.joinById(roomId, {
                        playerName: playerName
                    });
                } else if (isPrivate) {
                    // Create private room
                    currentRoom = await colyseusClientInstance.create("billiards", {
                        playerName: playerName,
                        mode: "room"
                    });
                } else {
                    // Join random public room
                    console.log("Joining/Creating Random Match...");
                    currentRoom = await colyseusClientInstance.joinOrCreate("billiards", {
                        playerName: playerName,
                        mode: "random"
                    });
                }

                setRoom(currentRoom);
                roomRef.current = currentRoom;
                console.log("Joined billiards room:", currentRoom.roomId);

                currentRoom.onStateChange((state: any) => {
                    if (state.status === 'playing') {
                        setStatus('playing');
                    } else if (state.status === 'ended') {
                        setStatus('finished');
                    } else if (state.status === 'waiting') {
                        setStatus('waiting');
                    }
                });

                // Set initial status based on state
                if (currentRoom.state?.status === 'playing') {
                    setStatus('playing');
                } else {
                    setStatus('waiting');
                }

            } catch (e: any) {
                console.error("Connection failed:", e);
                let msg = e.message || "Connection failed";
                if (msg.includes("not found")) msg = "ルームが見つかりませんでした (IDを確認してください)";
                setError(msg);
            }
        };

        connect();

        return () => {
            // Cleanup if needed
        };
    }, [mode, loading, isPrivate, roomId]);

    // ... cleanup effect ...

    // ... error render ...

    return (
        <>
            <BilliardsGame
                mode={mode === 'solo' ? 'solo' : 'multiplayer'}
                room={room || undefined}
                playerName={myPlayerName || user?.displayName || "Guest"}
            />

            {/* Matching Screen Overlay */}
            {mode === 'multiplayer' && (status === 'waiting' || status === 'connecting') && (
                <MatchingWaitingScreen
                    status={status === 'waiting' ? 'waiting' : 'connecting'}
                    mode={isPrivate || roomId ? "room" : "random"}
                    roomId={room?.roomId}
                    onCancel={onBack}
                />
            )}
        </>
    );
}

