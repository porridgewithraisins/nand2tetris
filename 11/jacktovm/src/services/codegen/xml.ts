import { randomUUID } from "crypto";
import * as fs from "fs";
import { Lexeme } from "../../engine/definitions";
import { clampToZero } from "../../engine/util";

export class TokenGen {
    private out: fs.WriteStream;
    private indent = 2;
    private currentIndentLevel = 0;
    private tmpname = `./artifacts/${randomUUID()}.xml`;
    private _className?: string | undefined;

    private static KindToSegment = {
        INTCONST: "integerConstant",
        STRINGCONST: "stringConstant",
        IDENTIFIER: "identifier",
        KEYWORD: "keyword",
        SYMBOL: "symbol",
    } as const;

    private static SymbolSanitizations: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
    };

    constructor() {
        this.out = fs.createWriteStream(this.tmpname);
    }

    public set className(value: string | undefined) {
        this._className = value;
    }

    public async writeStartSegment(name: string) {
        await this.writeSegment({ name, type: "start" });
        this.currentIndentLevel += this.indent;
    }

    public writeEndSegment(name: string) {
        this.currentIndentLevel = clampToZero(this.currentIndentLevel - this.indent);
        return this.writeSegment({ name, type: "end" });
    }

    public writeLexeme(lexeme: Lexeme) {
        const kind = TokenGen.KindToSegment[lexeme.kind];
        const value =
            kind === "stringConstant"
                ? lexeme.value.slice(1, -1)
                : ["&", "<", ">"].includes(lexeme.value)
                ? TokenGen.SymbolSanitizations[lexeme.value]
                : lexeme.value;
        const xml = `<${kind}> ${value} </${kind}>`;
        return this.write(xml);
    }

    private writeSegment({ name, type }: Segment) {
        const xml = `<${type == "end" ? "/" : ""}${name}>`;
        return this.write(xml);
    }

    private async write(xml: string) {
        const indentation = " ".repeat(this.currentIndentLevel);
        return new Promise(res => this.out.write(indentation + xml + "\n", res));
    }

    public cleanup() {
        return new Promise(res =>
            this.out.close(() => fs.rename(this.tmpname, `./artifacts/${this._className}.xml`, res))
        );
    }
}

export type Segment = {
    name: string;
    type: "start" | "end";
};
