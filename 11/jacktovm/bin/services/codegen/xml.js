"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenGen = void 0;
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const util_1 = require("../../engine/util");
class TokenGen {
    constructor() {
        this.indent = 2;
        this.currentIndentLevel = 0;
        this.tmpname = `./artifacts/${(0, crypto_1.randomUUID)()}.xml`;
        this.out = fs.createWriteStream(this.tmpname);
    }
    set className(value) {
        this._className = value;
    }
    async writeStartSegment(name) {
        await this.writeSegment({ name, type: "start" });
        this.currentIndentLevel += this.indent;
    }
    writeEndSegment(name) {
        this.currentIndentLevel = (0, util_1.clampToZero)(this.currentIndentLevel - this.indent);
        return this.writeSegment({ name, type: "end" });
    }
    writeLexeme(lexeme) {
        const kind = TokenGen.KindToSegment[lexeme.kind];
        const value = kind === "stringConstant"
            ? lexeme.value.slice(1, -1)
            : ["&", "<", ">"].includes(lexeme.value)
                ? TokenGen.SymbolSanitizations[lexeme.value]
                : lexeme.value;
        const xml = `<${kind}> ${value} </${kind}>`;
        return this.write(xml);
    }
    writeSegment({ name, type }) {
        const xml = `<${type == "end" ? "/" : ""}${name}>`;
        return this.write(xml);
    }
    async write(xml) {
        const indentation = " ".repeat(this.currentIndentLevel);
        return new Promise(res => this.out.write(indentation + xml + "\n", res));
    }
    cleanup() {
        return new Promise(res => this.out.close(() => fs.rename(this.tmpname, `./artifacts/${this._className}.xml`, res)));
    }
}
exports.TokenGen = TokenGen;
TokenGen.KindToSegment = {
    INTCONST: "integerConstant",
    STRINGCONST: "stringConstant",
    IDENTIFIER: "identifier",
    KEYWORD: "keyword",
    SYMBOL: "symbol",
};
TokenGen.SymbolSanitizations = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
};
//# sourceMappingURL=xml.js.map