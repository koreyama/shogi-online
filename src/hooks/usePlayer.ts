import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserProfile } from '@/lib/firebase/users';

const STORAGE_KEY_NAME = 'asobi_lounge_player_name';
const STORAGE_KEY_ID = 'asobi_lounge_player_id';

export const usePlayer = () => {
    const { user } = useAuth();
    const [localName, setLocalName] = useState<string>('');
    const [playerId, setPlayerId] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState(false);

    const [profileName, setProfileName] = useState<string>('');
    const [profileLoaded, setProfileLoaded] = useState(false);

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

    // Sync with Firebase Profile if logged in
    useEffect(() => {
        if (!user) {
            setProfileName('');
            setProfileLoaded(true);
            return;
        }

        let isMounted = true;

        getUserProfile(user.uid).then(profile => {
            if (isMounted && profile && typeof profile.displayName === 'string') {
                setProfileName(profile.displayName);
            }
            if (isMounted) setProfileLoaded(true);
        });

        return () => { isMounted = false; };
    }, [user]);

    const savePlayerName = (name: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_NAME, name);
            setLocalName(name);
        }
    };

    // Priority: Custom Profile Name > Google Auth Name > Local Name
    const playerName = profileName || user?.displayName || localName;

    return { playerName, playerId, isLoaded: isLoaded && profileLoaded, savePlayerName };
};
