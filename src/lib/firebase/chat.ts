import { db } from '../firebase';
import { ref, push, set, onValue, serverTimestamp, runTransaction, query, limitToLast, orderByChild, update, get } from 'firebase/database';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    targetId: string;
    content: string;
    timestamp: number;
    read: boolean;
}

// 1. Send Message
export const sendPrivateMessageWithRoomId = async (senderId: string, senderName: string, targetId: string, content: string) => {
    const chatRoomId = [senderId, targetId].sort().join('_');
    const messagesRef = ref(db, `private_messages/${chatRoomId}`);

    // Push message
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
        senderId,
        senderName,
        targetId,
        content,
        timestamp: serverTimestamp(),
        read: false
    });

    // Increment Unread Count for Target
    const unreadRef = ref(db, `unread_counts/${targetId}/${senderId}`);
    await runTransaction(unreadRef, (current) => {
        return (current || 0) + 1;
    });
};

// 2. Subscribe to Conversation (and mark as read)
export const subscribeToConversation = (currentUserId: string, friendId: string, callback: (messages: ChatMessage[]) => void) => {
    const chatRoomId = [currentUserId, friendId].sort().join('_');
    const messagesRef = query(ref(db, `private_messages/${chatRoomId}`), limitToLast(50));

    // Listen to messages
    const unsubscribe = onValue(messagesRef, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((child) => {
            messages.push({
                id: child.key as string,
                ...child.val()
            });
        });
        callback(messages);
    });

    // Clear unread count immediately upon subscription
    set(ref(db, `unread_counts/${currentUserId}/${friendId}`), 0);

    // Async task to mark unread messages as read
    get(ref(db, `private_messages/${chatRoomId}`)).then((snap) => {
        if (!snap.exists()) return;
        const updates: any = {};
        snap.forEach((child) => {
            const val = child.val();
            if (val.targetId === currentUserId && !val.read) {
                updates[`${child.key}/read`] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            update(ref(db, `private_messages/${chatRoomId}`), updates);
        }
    });

    return unsubscribe;
};

// 3. Subscribe to Unread Counts (Global)
export const subscribeToUnread = (currentUserId: string, callback: (counts: Record<string, number>) => void) => {
    const unreadRef = ref(db, `unread_counts/${currentUserId}`);
    return onValue(unreadRef, (snapshot) => {
        const counts = snapshot.val() || {};
        callback(counts);
    });
};

export const markAsRead = async (messageIds: string[]) => {
    // No-op or specific logic if needed manually.
    // The subscribe function handles it.
};
