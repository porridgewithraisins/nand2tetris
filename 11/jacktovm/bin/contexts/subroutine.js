"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubroutineContext = void 0;
class SubroutineContext {
    constructor(name, type, returns, className) {
        this.name = name;
        this.type = type;
        this.returns = returns;
        this.className = className;
        this.symbols = {};
        this.argId = 0;
        this.varId = 0;
        if (type == "method")
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