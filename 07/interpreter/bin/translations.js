"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerator = void 0;
const util_1 = require("./util");
class CodeGenerator {
    constructor() {
        this.labelId = 0;
        this.currentFunctionName = "default";
        this.currentFilename = "";
    }
    static get instance() {
        return (this._instance || (this._instance = new this()));
    }
    generateFor(instruction) {
        if (instruction.startsWith(util_1.filenameSentinel)) {
            this.currentFilename = instruction.split(util_1.filenameSentinel)[1];
            return "// " + this.currentFilename + "\n";
        }
        const [command, subject, arg] = instruction.split(" ");
        // command = push, pop, call etc,.
        // subject = segment, function, label, etc,.
        // arg = index, number of arguments, etc,.
        return (`//${instruction}\n` +
            (command === "bootstrap"
                ? this.bootstrap()
                : command in util_1.binaryOps
                    ? this.binaryArithmetic(command)
                    : command in util_1.unaryOps
                        ? this.unaryArithmetic(command)
                        : command in util_1.jumps
                            ? this.jump(command)
                            : command === "label"
                                ? this.label(subject)
                                : command === "goto"
                                    ? this.goto(subject)
                                    : command === "if-goto"
                                        ? this.gotoIf(subject)
                                        : command === "call"
                                            ? this.call(subject, arg)
                                            : command === "function"
                                                ? this.func(subject, arg)
                                                : command === "return"
                                                    ? this.return()
                                                    : command === "push" &&
                                                        (subject in util_1.regularSegments || subject === "constant" || subject === "static") &&
                                                        Number.isInteger(+arg)
                                                        ? this.push(subject, arg)
                                                        : command === "pop" &&
                                                            (subject in util_1.regularSegments || subject === "static") &&
                                                            Number.isInteger(+arg)
                                                            ? this.pop(subject, arg)
                                                            : "// Command not recognized\n"));
    }
    bootstrap() {
        return `@256
        D=A
        @SP
        M=D
        ${this.func("OS", "0")}
        ${this.call("Sys.init", "0")}
        `;
    }
    binaryArithmetic(opName) {
        return `@SP
        AM=M-1
        D=M
        @SP
        A=M-1
        M=M${util_1.binaryOps[opName]}D
        `;
    }
    unaryArithmetic(opName) {
        return `@SP
        A=M-1
        M=${util_1.unaryOps[opName]}M
        `;
    }
    jump(opName) {
        return `@SP
        AM=M-1
        D=M
        @SP
        A=M-1
        D=M-D
        M=-1
        @label${this.labelId}
        D;${util_1.jumps[opName]}
        @SP
        A=M-1
        M=0
        (label${this.labelId++})
        `;
    }
    push(segment, valueOrIndex) {
        const pushConstant = (value) => `@${value}
            D=A
            @SP
            AM=M+1
            A=A-1
            M=D
            `;
        const pushStatic = (index) => `@${this.currentFilename}.${index}
            D=M
            @SP
            A=M
            M=D
            @SP
            M=M+1
            `;
        const pushOther = (segment, index) => `@${index}
            D=A
            ${util_1.regularSegments[segment]}
            ${segment in util_1.globalSegments ? "" : "A=M"}
            A=D+A
            D=M
            @SP
            A=M
            M=D
            @SP
            M=M+1
            `;
        return segment === "constant"
            ? pushConstant(valueOrIndex) //value
            : segment === "static"
                ? pushStatic(valueOrIndex) // index
                : pushOther(segment, valueOrIndex); // index
    }
    pop(segment, index) {
        const popStatic = (index) => `@SP
            AM=M-1
            D=M
            @${this.currentFilename}.${index}
            M=D
        `;
        const popOther = (segment, index) => `@${index}
            D=A
            ${util_1.regularSegments[segment]}
            ${segment in util_1.globalSegments ? "" : "A=M"}
            D=D+A
            @R13
            M=D
            @SP
            AM=M-1
            D=M
            @R13
            A=M
            M=D
        `;
        return segment === "static" ? popStatic(index) : popOther(segment, index);
    }
    label(label) {
        return `(${this.currentFunctionName}.${label})\n`;
    }
    goto(label) {
        return `@${this.currentFunctionName}.${label}
        0;JMP
        `;
    }
    gotoIf(label) {
        return `@SP
        AM=M-1
        D=M
        @${this.currentFunctionName}.${label}
        D;JNE
        `;
    }
    func(name, numLocals) {
        this.currentFunctionName = name;
        const func = `(${name})`;
        const initLocals = new Array(+numLocals).map(() => this.push("constant", "0")).join("");
        return `${func}
        ${initLocals}`;
    }
    call(name, numArgs) {
        const saveReturnAddress = `@label${this.labelId}
        D=A
        @SP
        A=M
        M=D
        @SP
        M=M+1
        `;
        const saveCurrentContext = Object.values(util_1.localSegments).reduce((acc, label) => acc +
            `${label}
                D=M
                @SP
                A=M
                M=D
                @SP
                M=M+1
                `, "");
        const setArgSegmentOffset = `@SP
        D=M
        @5
        D=D-A
        @${numArgs}
        D=D-A
        ${util_1.regularSegments.argument}
        M=D
        `;
        const setLocalToStackPointer = `@SP
        D=M
        ${util_1.regularSegments.local}
        M=D
        `;
        const gotoFunction = `@${name}
        0;JMP
        `;
        const returnLabel = `(label${this.labelId++})\n`;
        return (saveReturnAddress +
            saveCurrentContext +
            setArgSegmentOffset +
            setLocalToStackPointer +
            gotoFunction +
            returnLabel);
    }
    return() {
        const setFrameToLCL = `@LCL
        D=M
        @R13
        M=D
        `;
        const storeReturnAddress = `@5
        A=D-A
        D=M
        @R14
        M=D
        `;
        const repositionReturnValue = `@SP
        AM=M-1
        D=M
        ${util_1.regularSegments.argument}
        A=M
        M=D
        `;
        const restoreSegments = Object.values(util_1.localSegments).reduce((acc, label) => acc +
            `@R13
                AM=M-1
                D=M
                ${label}
                M=D
            `, "");
        const gotoReturnAddress = `@R14
        A=M
        0;JMP
        `;
        return (setFrameToLCL +
            storeReturnAddress +
            repositionReturnValue +
            restoreSegments +
            gotoReturnAddress);
    }
}
exports.CodeGenerator = CodeGenerator;
