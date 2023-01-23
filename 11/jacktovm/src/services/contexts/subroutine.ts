export class SubroutineContext {
    symbols: Record<string, JackSubroutineSymbol> = {};
    argId = 0;
    varId = 0;

    constructor(
        public className: string,
        public kind: string,
        public returnType: string,
        public name: string
    ) {
        if (kind == "method") this.addArg("this", className);
    }

    addArg(type: string, name: string) {
        this.symbols[name] = { kind: "arg", type, id: this.argId++ };
    }
    addVar(type: string, name: string) {
        this.symbols[name] = { kind: "var", type, id: this.varId++ };
    }
}

export type JackSubroutineSymbol = {
    kind: "arg" | "var";
    type: string;
    id: number;
};
