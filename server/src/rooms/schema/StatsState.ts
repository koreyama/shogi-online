import { Schema, type } from "@colyseus/schema";

export class StatsState extends Schema {
    @type("number") count: number = 0;
}
