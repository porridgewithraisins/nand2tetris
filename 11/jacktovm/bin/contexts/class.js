"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassContext = void 0;
class ClassContext {
    constructor(name) {
        this.name = name;
        this.symbols = {};
        this.staticId = 0;
        this.fieldId = 0;
    }
    define(kind, type, name) {
        this.symbols[name] = { kind, type, id: this.fieldId++ };
    }
}
exports.ClassContext = ClassContext;
//# sourceMappingURL=class.js.map