import { randomUUID } from "crypto";
import type { WriteStream } from "fs";
import * as fs from "fs";
import { ClassContext, JackClassSymbol } from "../contexts/class";
import { JackSubroutineSymbol, SubroutineContext } from "../contexts/subroutine";

export class Codegen {
    private static BinaryOpTranslations = {
        "+": "add",
        "-": "sub",
        "*": "call Math.multiply 2",
        "/": "call Math.divide 2",
        "&": "and",
        "|": "or",
        "<": "lt",
        ">": "gt",
        "=": "eq",
    } as const;
    private static UnaryOpTranslations = {
        "-": "neg",
        "~": "not",
    } as const;
    private static kindToSegment = {
        field: "this",
        static: "static",
        var: "local",
        arg: "argument",
    };
    private out: WriteStream;
    private _className?: string;
    private tmpname = `./compiled/${randomUUID()}.vm`;

    public set className(value: string | undefined) {
        this._className = value;
    }
    constructor() {
        this.out = fs.createWriteStream(this.tmpname);
    }

    function(classContext: ClassContext, subroutineContext: SubroutineContext) {
        const { name: className } = classContext;
        const { name, varId } = subroutineContext;
        return new Promise(res => this.out.write(`function ${className}.${name} ${varId}\n`, res));
    }

    async method(...params: Parameters<typeof this.function>) {
        await this.function(...params);
        await this.pushRaw("argument", 0);
        await this.popRaw("pointer", 0);
    }

    async construct(...params: Parameters<typeof this.function>) {
        await this.function(...params);
        await this.constant(params[0].fieldId);
        await this.call("Memory.alloc", 1);
        await this.popRaw("pointer", 0);
    }

    async funcDecl(...params: Parameters<typeof this.function>) {
        const [, { kind }] = params;
        if (kind === "method") {
            await this.method(...params);
        } else if (kind === "constructor") {
            await this.construct(...params);
        } else await this.function(...params);
    }

    pushRaw(segment: string, offset: number) {
        return new Promise(res => this.out.write(`push ${segment} ${offset}\n`, res));
    }

    call(name: string, argCount: number) {
        return new Promise(res => this.out.write(`call ${name} ${argCount}\n`, res));
    }
    popRaw(segment: string, offset: number) {
        return new Promise(res => this.out.write(`pop ${segment} ${offset}\n`, res));
    }

    async push(a: JackClassSymbol | JackSubroutineSymbol) {
        const { kind, id } = a;
        await this.pushRaw(Codegen.kindToSegment[kind], id);
    }
    async pop({ kind, id }: JackClassSymbol | JackSubroutineSymbol) {
        await this.popRaw(Codegen.kindToSegment[kind], id);
    }
    add() {
        return new Promise(res => this.out.write("add\n", res));
    }
    if(label: string) {
        return new Promise(res => this.out.write(`not\nif-goto ${label}\n`, res));
    }
    label(label: string) {
        return new Promise(res => this.out.write(`label ${label}\n`, res));
    }

    goto(label: string) {
        return new Promise(res => this.out.write(`goto ${label}\n`, res));
    }
    async constant(value: number) {
        await this.pushRaw("constant", value);
    }

    return() {
        return new Promise(res => this.out.write(`return\n`, res));
    }

    async discardTop() {
        await this.popRaw("temp", 0);
    }

    async string(str: string) {
        const quotesRemoved = str.slice(1, -1);
        await this.constant(quotesRemoved.length);
        await this.call("String.new", 1);
        for (let i = 0; i < quotesRemoved.length; i++) {
            await this.constant(quotesRemoved.charCodeAt(i));
            await this.call("String.appendChar", 2);
            // String.new will stack `this`
        }
    }

    unaryOp(op: keyof typeof Codegen.UnaryOpTranslations) {
        return new Promise(res => this.out.write(`${Codegen.UnaryOpTranslations[op]}\n`, res));
    }

    binaryOp(op: string) {
        return new Promise(res =>
            this.out.write(
                `${
                    Codegen.BinaryOpTranslations[op as keyof typeof Codegen.BinaryOpTranslations]
                }\n`,
                res
            )
        );
    }

    cleanup() {
        return new Promise(res => {
            this.out.close(() => fs.rename(this.tmpname, `./compiled/${this._className}.vm`, res));
        });
    }
}
