import { Room, Client } from "colyseus";
import { StatsState } from "./schema/StatsState";

export class StatsRoom extends Room<StatsState> {
    onCreate(options: any) {
        this.setState(new StatsState());
    }

    onJoin(client: Client, options: any) {
        // onJoin is called before the client is added to this.clients list?
        // Actually, let's just use the current clients length + 1 safely,
        // or just increment. Colyseus behavior: onJoin happens, then connection is established.
        // But we want to broadcast the TOTAL number.
        // Simplest: this.state.count = this.clients.length + 1; (since this client isn't fully in the array yet? Wait, let's check docs safely by just incrementing).
        // A safer way for accurate "site-wide" stats might be to use a static variable or a presence key,
        // but since this is a single process server for now:
        this.state.count++;
        console.log("StatsRoom joined. Count:", this.state.count);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.count--;
        if (this.state.count < 0) this.state.count = 0;
        console.log("StatsRoom left. Count:", this.state.count);
    }
}
