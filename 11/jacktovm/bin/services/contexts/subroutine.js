"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubroutineContext = void 0;
class SubroutineContext {
    constructor(className, kind, returnType, name) {
        this.className = className;
        this.kind = kind;
        this.returnType = returnType;
        this.name = name;
        this.symbols = {};
        this.argId = 0;
        this.varId = 0;
        if (kind == "method")
            this.addArg("this", className);
    }
    addArg(type, name) {
        this.symbols[name] = { kind: "arg", type, id: this.argId++ };
    }
    addVar(type, name) {
        this.symbols[name] = { kind: "var", type, id: this.varId++ };
    }
}
exports.SubroutineContext = SubroutineContext;
//# sourceMappingURL=subroutine.js.map