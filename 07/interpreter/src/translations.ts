import {
    binaryOps,
    filenameSentinel,
    globalSegments,
    jumps,
    localSegments,
    regularSegments,
    unaryOps,
} from "./util";

export class CodeGenerator {
    private labelId = 0;
    private currentFunctionName = "default";
    private currentFilename: string = "";

    private constructor() {}
    private static _instance?: CodeGenerator;
    public static get instance() {
        return (this._instance ||= new this());
    }

    public generateFor(instruction: string) {
        if (instruction.startsWith(filenameSentinel)) {
            this.currentFilename = instruction.split(filenameSentinel)[1];
            return "// " + this.currentFilename + "\n";
        }

        const [command, subject, arg] = instruction.split(" ");
        // command = push, pop, call etc,.
        // subject = segment, function, label, etc,.
        // arg = index, number of arguments, etc,.
        return (
            `//${instruction}\n` +
            (command === "bootstrap"
                ? this.bootstrap()
                : command in binaryOps
                ? this.binaryArithmetic(command as keyof typeof binaryOps)
                : command in unaryOps
                ? this.unaryArithmetic(command as keyof typeof unaryOps)
                : command in jumps
                ? this.jump(command as keyof typeof jumps)
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
                  (subject in regularSegments || subject === "constant" || subject === "static") &&
                  Number.isInteger(+arg)
                ? this.push(subject as Parameters<typeof this.push>[0], arg)
                : command === "pop" &&
                  (subject in regularSegments || subject === "static") &&
                  Number.isInteger(+arg)
                ? this.pop(subject as Parameters<typeof this.pop>[0], arg)
                : "// Command not recognized\n")
        );
    }

    private bootstrap() {
        return `@256
        D=A
        @SP
        M=D
        ${this.func("OS", "0")}
        ${this.call("Sys.init", "0")}
        `;
    }

    private binaryArithmetic(opName: keyof typeof binaryOps) {
        return `@SP
        AM=M-1
        D=M
        @SP
        A=M-1
        M=M${binaryOps[opName]}D
        `;
    }

    private unaryArithmetic(opName: keyof typeof unaryOps) {
        return `@SP
        A=M-1
        M=${unaryOps[opName]}M
        `;
    }

    private jump(opName: keyof typeof jumps) {
        return `@SP
        AM=M-1
        D=M
        @SP
        A=M-1
        D=M-D
        M=-1
        @label${this.labelId}
        D;${jumps[opName]}
        @SP
        A=M-1
        M=0
        (label${this.labelId++})
        `;
    }

    private push(
        segment: "constant" | keyof typeof regularSegments | "static",
        valueOrIndex: string
    ) {
        const pushConstant = (value: string) =>
            `@${value}
            D=A
            @SP
            AM=M+1
            A=A-1
            M=D
            `;

        const pushStatic = (index: string) =>
            `@${this.currentFilename}.${index}
            D=M
            @SP
            A=M
            M=D
            @SP
            M=M+1
            `;
        const pushOther = (segment: keyof typeof regularSegments, index: string) =>
            `@${index}
            D=A
            ${regularSegments[segment]}
            ${segment in globalSegments ? "" : "A=M"}
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

    private pop(segment: keyof typeof regularSegments | "static", index: string) {
        const popStatic = (index: string) =>
            `@SP
            AM=M-1
            D=M
            @${this.currentFilename}.${index}
            M=D
        `;
        const popOther = (segment: keyof typeof regularSegments, index: string) =>
            `@${index}
            D=A
            ${regularSegments[segment]}
            ${segment in globalSegments ? "" : "A=M"}
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
    private label(label: string) {
        return `(${this.currentFunctionName}.${label})\n`;
    }
    private goto(label: string) {
        return `@${this.currentFunctionName}.${label}
        0;JMP
        `;
    }
    private gotoIf(label: string) {
        return `@SP
        AM=M-1
        D=M
        @${this.currentFunctionName}.${label}
        D;JNE
        `;
    }
    private func(name: string, numLocals: string) {
        this.currentFunctionName = name;
        const func = `(${name})`;
        const initLocals = new Array(+numLocals).map(() => this.push("constant", "0")).join("");
        return `${func}
        ${initLocals}`;
    }
    private call(name: string, numArgs: string) {
        const saveReturnAddress = `@label${this.labelId}
        D=A
        @SP
        A=M
        M=D
        @SP
        M=M+1
        `;

        const saveCurrentContext = Object.values(localSegments).reduce(
            (acc, label) =>
                acc +
                `${label}
                D=M
                @SP
                A=M
                M=D
                @SP
                M=M+1
                `,
            ""
        );

        const setArgSegmentOffset = `@SP
        D=M
        @5
        D=D-A
        @${numArgs}
        D=D-A
        ${regularSegments.argument}
        M=D
        `;

        const setLocalToStackPointer = `@SP
        D=M
        ${regularSegments.local}
        M=D
        `;

        const gotoFunction = `@${name}
        0;JMP
        `;

        const returnLabel = `(label${this.labelId++})\n`;

        return (
            saveReturnAddress +
            saveCurrentContext +
            setArgSegmentOffset +
            setLocalToStackPointer +
            gotoFunction +
            returnLabel
        );
    }

    private return() {
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
        ${regularSegments.argument}
        A=M
        M=D
        `;
        const restoreSegments = Object.values(localSegments).reduce(
            (acc, label) =>
                acc +
                `@R13
                AM=M-1
                D=M
                ${label}
                M=D
            `,
            ""
        );

        const gotoReturnAddress = `@R14
        A=M
        0;JMP
        `;

        return (
            setFrameToLCL +
            storeReturnAddress +
            repositionReturnValue +
            restoreSegments +
            gotoReturnAddress
        );
    }
}
