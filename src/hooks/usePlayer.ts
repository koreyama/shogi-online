import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const STORAGE_KEY_NAME = 'asobi_lounge_player_name';
const STORAGE_KEY_ID = 'asobi_lounge_player_id';

export const usePlayer = () => {
    const { user } = useAuth();
    const [localName, setLocalName] = useState<string>('');
    const [playerId, setPlayerId] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // クライアントサイドでのみ実行
        if (typeof window !== 'undefined') {
            const storedName = localStorage.getItem(STORAGE_KEY_NAME);
            const storedId = localStorage.getItem(STORAGE_KEY_ID);

            if (storedName) setLocalName(storedName);

            if (storedId) {
                setPlayerId(storedId);
            } else {
                const newId = Math.random().toString(36).substring(2, 15);
                localStorage.setItem(STORAGE_KEY_ID, newId);
                setPlayerId(newId);
            }

            setIsLoaded(true);
        }
    }, []);

    const savePlayerName = (name: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_NAME, name);
            setLocalName(name);
        }
    };

    // Googleログインしている場合はその名前を優先、なければローカル保存の名前
    const playerName = user?.displayName || localName;

    return { playerName, playerId, isLoaded, savePlayerName };
};
