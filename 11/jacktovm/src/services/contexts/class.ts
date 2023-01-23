export class ClassContext {
    symbols: Record<string, JackClassSymbol> = {};
    staticId = 0;
    fieldId = 0;
    constructor(public name: string) {}
    define(kind: "field" | "static", type: string, name: string) {
        this.symbols[name] = { kind, type, id: this.fieldId++ };
    }
}

export type JackClassSymbol = {
    kind: "field" | "static";
    type: string;
    id: number;
};
