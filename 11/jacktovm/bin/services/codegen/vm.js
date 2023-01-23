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
exports.Codegen = void 0;
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
class Codegen {
    constructor() {
        this.tmpname = `./compiled/${(0, crypto_1.randomUUID)()}.vm`;
        this.out = fs.createWriteStream(this.tmpname);
    }
    set className(value) {
        this._className = value;
    }
    function(classContext, subroutineContext) {
        const { name: className } = classContext;
        const { name, varId } = subroutineContext;
        return new Promise(res => this.out.write(`function ${className}.${name} ${varId}\n`, res));
    }
    async method(...params) {
        await this.function(...params);
        await this.pushRaw("argument", 0);
        await this.popRaw("pointer", 0);
    }
    async construct(...params) {
        await this.function(...params);
        await this.constant(params[0].fieldId);
        await this.call("Memory.alloc", 1);
        await this.popRaw("pointer", 0);
    }
    async funcDecl(...params) {
        const [, { kind }] = params;
        if (kind === "method") {
            await this.method(...params);
        }
        else if (kind === "constructor") {
            await this.construct(...params);
        }
        else
            await this.function(...params);
    }
    pushRaw(segment, offset) {
        return new Promise(res => this.out.write(`push ${segment} ${offset}\n`, res));
    }
    call(name, argCount) {
        return new Promise(res => this.out.write(`call ${name} ${argCount}\n`, res));
    }
    popRaw(segment, offset) {
        return new Promise(res => this.out.write(`pop ${segment} ${offset}\n`, res));
    }
    async push(a) {
        const { kind, id } = a;
        await this.pushRaw(Codegen.kindToSegment[kind], id);
    }
    async pop({ kind, id }) {
        await this.popRaw(Codegen.kindToSegment[kind], id);
    }
    add() {
        return new Promise(res => this.out.write("add\n", res));
    }
    if(label) {
        return new Promise(res => this.out.write(`not\nif-goto ${label}\n`, res));
    }
    label(label) {
        return new Promise(res => this.out.write(`label ${label}\n`, res));
    }
    goto(label) {
        return new Promise(res => this.out.write(`goto ${label}\n`, res));
    }
    async constant(value) {
        await this.pushRaw("constant", value);
    }
    return() {
        return new Promise(res => this.out.write(`return\n`, res));
    }
    async discardTop() {
        await this.popRaw("temp", 0);
    }
    async string(str) {
        const quotesRemoved = str.slice(1, -1);
        await this.constant(quotesRemoved.length);
        await this.call("String.new", 1);
        for (let i = 0; i < quotesRemoved.length; i++) {
            await this.constant(quotesRemoved.charCodeAt(i));
            await this.call("String.appendChar", 2);
            // String.new will stack `this`
        }
    }
    unaryOp(op) {
        return new Promise(res => this.out.write(`${Codegen.UnaryOpTranslations[op]}\n`, res));
    }
    binaryOp(op) {
        return new Promise(res => this.out.write(`${Codegen.BinaryOpTranslations[op]}\n`, res));
    }
    cleanup() {
        return new Promise(res => {
            this.out.close(() => fs.rename(this.tmpname, `./compiled/${this._className}.vm`, res));
        });
    }
}
exports.Codegen = Codegen;
Codegen.BinaryOpTranslations = {
    "+": "add",
    "-": "sub",
    "*": "call Math.multiply 2",
    "/": "call Math.divide 2",
    "&": "and",
    "|": "or",
    "<": "lt",
    ">": "gt",
    "=": "eq",
};
Codegen.UnaryOpTranslations = {
    "-": "neg",
    "~": "not",
};
Codegen.kindToSegment = {
    field: "this",
    static: "static",
    var: "local",
    arg: "argument",
};
//# sourceMappingURL=vm.js.map