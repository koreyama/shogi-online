import { Room, Client } from "colyseus";
import { WerewolfState, WerewolfPlayer, ChatMessage } from "./schema/WerewolfState";

export class WerewolfRoom extends Room<WerewolfState> {
    maxClients = 20;
    timerInterval: NodeJS.Timeout | null = null;
    timerCallback: (() => void) | null = null;

    onCreate(options: any) {
        // Ensure mode metadata is set (default to public) to satisfy filterBy
        this.setMetadata({ mode: options.mode || "public" });
        this.setState(new WerewolfState());

        this.onMessage("start_game", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.isHost) {
                this.startGame();
            }
        });

        this.onMessage("update_settings", (client, settings: any) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.isHost && this.state.phase === "lobby") {
                if (settings.discussionTime) this.state.settings.discussionTime = settings.discussionTime;
                if (settings.nightTime) this.state.settings.nightTime = settings.nightTime;

                // Update role counts
                if (settings.villagerCount !== undefined) this.state.settings.villagerCount = settings.villagerCount;
                if (settings.werewolfCount !== undefined) this.state.settings.werewolfCount = settings.werewolfCount;
                if (settings.seerCount !== undefined) this.state.settings.seerCount = settings.seerCount;
                if (settings.mediumCount !== undefined) this.state.settings.mediumCount = settings.mediumCount;
                if (settings.bodyguardCount !== undefined) this.state.settings.bodyguardCount = settings.bodyguardCount;
                if (settings.madmanCount !== undefined) this.state.settings.madmanCount = settings.madmanCount;
                if (settings.villagerCount !== undefined) this.state.settings.villagerCount = settings.villagerCount;
                if (settings.canFirstNightAttack !== undefined) this.state.settings.canFirstNightAttack = settings.canFirstNightAttack;

                this.broadcast("settings_updated", this.state.settings);
            }
        });

        this.onMessage("chat", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            // Chat restrictions
            if (!player.isAlive) {
                // Dead chat - only visible to dead players (filtered on client side or handled separately)
                // For simplicity, we broadcast everything with type, client filters
                this.state.messages.push(new ChatMessage(player.id, player.name, message.content, "dead"));
            } else if (message.type === "werewolf") {
                // Werewolf chat - only if player is werewolf and it's night
                // Or maybe allow day werewolf chat? usually night only or specific rules.
                // Let's allow anytime for simplicity, or restricted to night.
                // Standard: Werewolves can talk at night.
                if (player.role === "werewolf") {
                    this.state.messages.push(new ChatMessage(player.id, player.name, message.content, "werewolf"));
                }
            } else {
                // Normal chat - only during lobby or day_conversation
                if (this.state.phase === "lobby" || this.state.phase === "day_conversation" || this.state.phase === "result") {
                    this.state.messages.push(new ChatMessage(player.id, player.name, message.content, "normal"));
                }
            }
        });

        this.onMessage("vote", (client, targetId) => {
            if (this.state.phase !== "day_vote") return;
            const player = this.state.players.get(client.sessionId);
            if (!player || !player.isAlive) return;

            // Check if already voted? Or allow change?
            // Let's allow change until timer ends or everyone voted
            player.votedFor = targetId;

            // Check if everyone voted
            const alivePlayers = Array.from(this.state.players.values()).filter(p => p.isAlive);
            const votedPlayers = alivePlayers.filter(p => p.votedFor !== "");
            if (alivePlayers.length === votedPlayers.length) {
                // End voting phase early
                this.skipTimer();
            }
        });

        this.onMessage("night_action", (client, targetId) => {
            if (this.state.phase !== "night_action") return;
            const player = this.state.players.get(client.sessionId);
            if (!player || !player.isAlive) return;

            if (player.role === "werewolf") {
                player.votedFor = targetId; // Reuse votedFor for night target
            } else if (player.role === "seer") {
                console.log("Seer action received", targetId);
                if (player.checked) {
                    console.log("Seer already checked");
                    return;
                }

                const target = Array.from(this.state.players.values()).find(p => p.id === targetId);
                if (target) {
                    const isWerewolf = target.role === "werewolf";
                    console.log("Seer result:", target.name, isWerewolf);
                    client.send("seer_result", { targetName: target.name, isWerewolf });
                    player.checked = true; // Mark action done
                } else {
                    console.log("Seer target not found", targetId);
                }
            } else if (player.role === "bodyguard") {
                player.votedFor = targetId; // Guard target
            }

            this.checkNightPhaseEnd();
        });

        this.onMessage("skip_discussion", (client) => {
            if (this.state.phase !== "day_conversation") return;
            const player = this.state.players.get(client.sessionId);
            if (!player || !player.isAlive) return;

            player.wantsToSkip = !player.wantsToSkip;

            // Check ratio (80%)
            const alivePlayers = Array.from(this.state.players.values()).filter(p => p.isAlive);
            const skippedCount = alivePlayers.filter(p => p.wantsToSkip).length;

            if (alivePlayers.length > 0 && (skippedCount / alivePlayers.length) >= 0.8) {
                this.state.messages.push(new ChatMessage("system", "GM", "時短投票が成立しました。議論を終了します。", "system"));
                this.skipTimer();
            }
        });

        this.onMessage("reset_game", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player && player.isHost && this.state.phase === "result") {
                this.resetGame();
            }
        });
    }

    onJoin(client: Client, options: any) {
        const player = new WerewolfPlayer(client.sessionId, options.name || `Player ${this.clients.length + 1}`);
        if (this.clients.length === 1) {
            player.isHost = true;
        }
        this.state.players.set(client.sessionId, player);

        this.state.messages.push(new ChatMessage("system", "GM", `${player.name} が参加しました`, "system"));
    }

    onLeave(client: Client, consented: boolean) {
        const player = this.state.players.get(client.sessionId);
        if (player) {
            this.state.messages.push(new ChatMessage("system", "GM", `${player.name} が退出しました`, "system"));
            this.state.players.delete(client.sessionId);

            // Host migration
            if (player.isHost && this.state.players.size > 0) {
                const nextHost = this.state.players.values().next().value;
                if (nextHost) nextHost.isHost = true;
            }
        }
    }

    startGame() {
        if (this.state.players.size < 4) { // Minimum 4 for simple game
            this.broadcast("error", "プレイヤー人数が不足しています (最低4人)");
            return;
        }

        // Validate Role Counts
        const settings = this.state.settings;
        const totalPlayers = this.state.players.size;

        // Rule: Werewolf Team (Werewolves + Madmen) must be less than half of total players
        if ((settings.werewolfCount + settings.madmanCount) >= totalPlayers / 2) {
            this.broadcast("error", "人狼陣営(人狼+狂人)の人数が多すぎます (プレイヤーの半数未満に設定してください)");
            return;
        }

        // Assign Roles
        this.assignRoles();

        this.state.dayCount = 1;
        this.state.phase = "night_action"; // Start with night (or day 1? usually night 0 or day 1)
        // Let's do Day 1 Night (First night)
        // Some rules skip first night execution/divination. Let's do standard: Night 1 (Divination possible, No attack often, but let's allow everything for simple rules or restrict)
        // Simplest: Start Day 1 Conversation.
        this.state.phase = "day_conversation";

        this.startPhaseTimer(this.state.settings.discussionTime, () => {
            this.state.phase = "day_vote";
            this.state.timeLeft = 60; // 60s for voting
            this.startPhaseTimer(60, () => {
                this.handleVoteResult();
            });
        });

        this.state.messages.push(new ChatMessage("system", "GM", "ゲーム開始！ 1日目の議論を開始します。", "system"));
    }

    assignRoles() {
        const players = Array.from(this.state.players.values());
        // Shuffle players
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }

        // Apply roles based on settings (simplified logic for now)
        // We iterate through available roles and assign
        const settings = this.state.settings;
        let pIndex = 0;

        const assign = (role: string, count: number) => {
            for (let i = 0; i < count; i++) {
                if (pIndex < players.length) {
                    players[pIndex].role = role;
                    pIndex++;
                }
            }
        };

        assign("werewolf", settings.werewolfCount);
        assign("seer", settings.seerCount);
        assign("medium", settings.mediumCount);
        assign("bodyguard", settings.bodyguardCount);
        assign("madman", settings.madmanCount);
        assign("villager", settings.villagerCount);

        // Fill rest with villagers
        while (pIndex < players.length) {
            players[pIndex].role = "villager";
            pIndex++;
        }

        // Notify each player of their role
        this.clients.forEach(client => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                client.send("your_role", player.role);
            }
        });
    }

    handleVoteResult() {
        // Tally votes
        const voteCounts: { [key: string]: number } = {};
        let maxVotes = 0;
        let candidates: string[] = [];

        this.state.players.forEach(player => {
            if (player.isAlive && player.votedFor) {
                voteCounts[player.votedFor] = (voteCounts[player.votedFor] || 0) + 1;
            }
            player.votedFor = ""; // Reset
        });

        // Find max
        for (const [targetId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                candidates = [targetId];
            } else if (count === maxVotes) {
                candidates.push(targetId);
            }
        }

        // Tie-breaker: random or no execution? Let's random for now
        let executedId = "";
        if (candidates.length > 0) {
            executedId = candidates[Math.floor(Math.random() * candidates.length)];
        }

        this.state.phase = "day_execution";
        this.state.executedPlayerId = executedId;

        if (executedId) {
            const victim = Array.from(this.state.players.values()).find(p => p.id === executedId);
            if (victim) {
                victim.isAlive = false;
                this.state.messages.push(new ChatMessage("system", "GM", `${victim.name} が処刑されました。`, "system"));
            }
        } else {
            this.state.messages.push(new ChatMessage("system", "GM", `処刑は行われませんでした。`, "system"));
        }

        // Check Win
        if (this.checkWinCondition()) return;

        // Determine Medium Result
        // Send info to Meduims
        const victim = executedId ? Array.from(this.state.players.values()).find(p => p.id === executedId) : null;
        if (victim) {
            const isWerewolf = victim.role === 'werewolf';
            this.state.players.forEach((p, sessionId) => {
                if (p.role === "medium" && p.isAlive) {
                    const client = this.clients.find(c => c.sessionId === sessionId);
                    client?.send("medium_result", { targetName: victim.name, isWerewolf });
                }
            });
        }

        // Proceed to Night
        setTimeout(() => {
            if (this.state.winner) return;
            this.startNightPhase();
        }, 5000);
    }

    startNightPhase() {
        this.state.phase = "night_action";
        this.state.messages.push(new ChatMessage("system", "GM", "夜が来ました。能力者は行動してください。", "system"));

        this.startPhaseTimer(this.state.settings.nightTime, () => {
            this.handleNightResult();
        });
    }

    handleNightResult() {
        // Tally Werewolf Votes
        const wwVotes: { [key: string]: number } = {};

        // Check First Night Attack Rule
        const canAttack = this.state.dayCount > 1 || this.state.settings.canFirstNightAttack;

        this.state.players.forEach(p => {
            if (p.isAlive && p.role === "werewolf" && p.votedFor && canAttack) {
                wwVotes[p.votedFor] = (wwVotes[p.votedFor] || 0) + 1;
            }
        });

        // Find most voted target
        let targetId = "";
        let max = 0;
        for (const [id, count] of Object.entries(wwVotes)) {
            if (count > max) {
                max = count;
                targetId = id;
            } else if (count === max && max > 0) {
                // random tie break for wolves
                if (Math.random() < 0.5) targetId = id;
            }
        }

        // --- Process Attack & Protection ---
        let victimId = "";
        if (targetId) {
            // Check Bodyguard protection
            const protectedId = Array.from(this.state.players.values()).find(p => p.role === "bodyguard" && p.isAlive)?.votedFor;

            if (protectedId !== targetId) {
                victimId = targetId;
                const victim = this.state.players.get(victimId);
                if (victim) {
                    victim.isAlive = false;
                    this.state.messages.push(new ChatMessage("system", "GM", `${victim.name} が無惨な姿で発見されました。`, "system"));
                }
            } else {
                this.state.messages.push(new ChatMessage("system", "GM", `昨晩の犠牲者はいませんでした。`, "system"));
            }
        } else {
            this.state.messages.push(new ChatMessage("system", "GM", `昨晩の犠牲者はいませんでした。`, "system"));
        }

        // --- Common Cleanup & Progression ---

        // Clear temp data
        this.state.players.forEach(p => {
            p.votedFor = "";
            p.checked = false;
            p.protected = false;
        });

        // Check Win Condition
        if (this.checkWinCondition()) return;

        // Next Day
        this.state.dayCount++;
        this.state.phase = "day_conversation";
        this.state.messages.push(new ChatMessage("system", "GM", `${this.state.dayCount}日目の朝が来ました。`, "system"));

        this.startPhaseTimer(this.state.settings.discussionTime, () => {
            if (this.state.phase !== "day_conversation") return;
            this.state.phase = "day_vote";
            this.state.timeLeft = 60;
            this.startPhaseTimer(60, () => {
                if (this.state.phase !== "day_vote") return;
                this.handleVoteResult();
            });
        });
    }

    checkWinCondition() {
        const alivePlayers = Array.from(this.state.players.values()).filter(p => p.isAlive);
        const aliveWolves = alivePlayers.filter(p => p.role === "werewolf").length;
        const aliveHumans = alivePlayers.length - aliveWolves;

        if (aliveWolves === 0) {
            this.state.winner = "villagers";
            this.state.phase = "result";
            this.broadcast("game_over", { winner: "villagers" });
            if (this.timerInterval) clearInterval(this.timerInterval);

            // Auto-reset after 10 seconds
            setTimeout(() => this.resetGame(), 10000); // 10s delay

            return true;
        }

        if (aliveWolves >= aliveHumans) {
            this.state.winner = "werewolves";
            this.state.phase = "result";
            this.broadcast("game_over", { winner: "werewolves" });
            if (this.timerInterval) clearInterval(this.timerInterval);

            // Auto-reset after 10 seconds
            setTimeout(() => this.resetGame(), 10000); // 10s delay

            return true;
        }

        return false;
    }

    startPhaseTimer(seconds: number, onComplete: () => void) {
        if (this.timerInterval) clearInterval(this.timerInterval);

        // Reset skip votes
        this.state.players.forEach(p => p.wantsToSkip = false);

        this.state.timeLeft = seconds;
        this.timerCallback = onComplete;

        this.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            if (this.state.timeLeft <= 0) {
                this.skipTimer();
            }
        }, 1000);
    }

    skipTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
        if (this.timerCallback) {
            const cb = this.timerCallback;
            this.timerCallback = null;
            cb();
        }
    }

    checkNightPhaseEnd() {
        const alivePlayers = Array.from(this.state.players.values()).filter(p => p.isAlive);
        const canAttack = this.state.dayCount > 1 || this.state.settings.canFirstNightAttack;

        const allDone = alivePlayers.every(p => {
            if (p.role === "werewolf" && canAttack) return p.votedFor !== "";
            if (p.role === "werewolf" && !canAttack) return true;
            if (p.role === "seer") return p.checked;
            if (p.role === "bodyguard") return p.votedFor !== "";
            return true; // No action needed
        });

        if (allDone) {
            this.skipTimer();
        }
    }
    resetGame() {
        this.state.phase = "lobby";
        this.state.dayCount = 0;
        this.state.winner = "";
        this.state.executedPlayerId = "";

        this.state.players.forEach(p => {
            p.role = "villager"; // Reset role
            p.isAlive = true;
            p.votedFor = "";
            p.checked = false;
            p.protected = false;
            p.wantsToSkip = false;
        });

        this.state.messages.push(new ChatMessage("system", "GM", "ゲームがリセットされました。", "system"));
        this.broadcast("game_reset");
    }
}
