import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class GameLogEntrySchema extends Schema {
    @type("string") id: string = "";
    @type("string") text: string = "";
    @type("number") timestamp: number = 0;
}

export class StatusEffectSchema extends Schema {
    @type("string") id: string = "";
    @type("string") type: string = "";
    @type("string") name: string = "";
    @type("number") value: number = 0;
    @type("number") duration: number = 0;
}

export class EquipmentSchema extends Schema {
    @type("string") weapon: string = "";
    @type("string") armor: string = "";
    @type("number") armorDurability: number = 0;
    @type("string") enchantment: string = "";
}

export class PlayerStateSchema extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") avatarId: string = "";
    @type("number") hp: number = 0;
    @type("number") maxHp: number = 0;
    @type("number") mp: number = 0;
    @type("number") maxMp: number = 0;
    @type("string") status: string = "alive";
    @type("number") money: number = 0;
    @type("boolean") ultimateUsed: boolean = false;
    @type("boolean") isManaChargeMode: boolean = false;

    // Arrays of strings
    @type(["string"]) hand = new ArraySchema<string>();
    @type(["string"]) deck = new ArraySchema<string>();
    @type(["string"]) discardPile = new ArraySchema<string>();
    @type(["string"]) manaZone = new ArraySchema<string>();

    // Nested Objects
    @type(EquipmentSchema) equipment = new EquipmentSchema();
    @type([StatusEffectSchema]) statusEffects = new ArraySchema<StatusEffectSchema>();

    // Note: selectedForCharge is UI state mostly, but we can sync it if needed. 
    // Usually selection is local until confirmed, but for "Mode" persistence we might need it.
    // Let's skip precise selection sync for now unless required.
}

export class FieldSchema extends Schema {
    @type("string") cardId: string = "";
    @type("string") name: string = "";
    @type("string") effectId: string = "";
    @type("string") element: string = "";
}

export class TrapSchema extends Schema {
    @type("string") id: string = "";
    @type("string") cardId: string = "";
    @type("string") name: string = "";
    @type("string") ownerId: string = "";
    @type("string") effectId: string = "";
}

export class TurnStateSchema extends Schema {
    @type("boolean") hasAttacked: boolean = false;
    @type("boolean") hasDiscarded: boolean = false;
    @type("number") cardsPlayedCount: number = 0;
    @type(["string"]) freeCardIds = new ArraySchema<string>();
    @type("boolean") isComboChain: boolean = false;
    @type("number") manaChargeCount: number = 0;
}

export class CardGameState extends Schema {
    @type("string") roomId: string = "";
    @type("string") turnPlayerId: string = "";
    @type("string") phase: string = "draw";
    @type("number") turnCount: number = 1;
    @type("string") winner: string = "";

    @type({ map: PlayerStateSchema }) players = new MapSchema<PlayerStateSchema>();
    @type([GameLogEntrySchema]) log = new ArraySchema<GameLogEntrySchema>();

    @type(FieldSchema) field = new FieldSchema(); // Nullable normally, but Schema needs instance. We'll verify how to handle nulls.
    @type([TrapSchema]) traps = new ArraySchema<TrapSchema>();

    @type(TurnStateSchema) turnState = new TurnStateSchema();

    // Last Played Card
    @type("string") lastPlayedCardId: string = "";
    @type("string") lastPlayedPlayerId: string = "";
    @type("number") lastPlayedTimestamp: number = 0;

    // Helper to handle "null" field by checking empty ID
}
