import { Room, Client } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class LobbyUser extends Schema {
    @type("string") userId: string = "";
    @type("string") name: string = "";
    @type("string") status: string = "online"; // online, playing, idle
}

export class ChatMessage extends Schema {
    @type("string") id: string = "";
    @type("string") senderId: string = "";
    @type("string") senderName: string = "";
    @type("string") content: string = "";
    @type("string") type: string = "normal"; // normal, system, invite
    @type("number") timestamp: number = 0;
}

export class LobbyState extends Schema {
    @type({ map: LobbyUser }) users = new MapSchema<LobbyUser>();
    @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();
}

export class LobbyRoom extends Room<LobbyState> {
    maxClients = 1000;

    onCreate(options: any) {
        this.setState(new LobbyState());

        this.onMessage("chat", (client, message) => {
            const user = this.state.users.get(client.sessionId);
            if (!user) return;

            const chatMsg = new ChatMessage();
            chatMsg.id = Math.random().toString(36).substr(2, 9);
            chatMsg.senderId = user.userId;
            chatMsg.senderName = user.name;
            chatMsg.content = message.content;
            chatMsg.type = message.type || "normal";
            chatMsg.timestamp = Date.now();

            this.state.messages.push(chatMsg);

            // Keep only last 50 messages
            if (this.state.messages.length > 50) {
                this.state.messages.shift();
            }
        });

        this.onMessage("private_message", (client, message) => {
            const sender = this.state.users.get(client.sessionId);
            if (!sender || !message.targetUserId || !message.content) return;

            // Find target sessionId
            let targetSessionId = "";
            this.state.users.forEach((u, sessionId) => {
                if (u.userId === message.targetUserId) {
                    targetSessionId = sessionId;
                }
            });

            const payload = {
                id: Math.random().toString(36).substr(2, 9),
                senderId: sender.userId,
                senderName: sender.name,
                targetId: message.targetUserId,
                content: message.content,
                timestamp: Date.now()
            };

            // Send to target if online
            if (targetSessionId) {
                const targetClient = this.clients.find(c => c.sessionId === targetSessionId);
                if (targetClient) {
                    targetClient.send("private_message", payload);
                }
            }

            // Echo back to sender
            client.send("private_message", payload);
        });

        this.onMessage("update_status", (client, status) => {
            const user = this.state.users.get(client.sessionId);
            if (user) {
                user.status = status;
            }
        });
    }

    onJoin(client: Client, options: any) {
        const user = new LobbyUser();
        user.userId = options.userId || "guest";
        user.name = options.name || `Guest-${client.sessionId.substr(0, 4)}`;
        user.status = "online";
        this.state.users.set(client.sessionId, user);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.users.delete(client.sessionId);
    }
}
