import { createReadStream, createWriteStream } from "fs";
import os from "os";
import path from "path";
import readline from "readline";
import {
    computationTable,
    destinationTable,
    isAInstruction,
    jumpTable,
    logger,
    normalizeCInstruction,
    pipe,
    symbolTable,
} from "./util";

const asmFile = process.argv[2];

const { name } = path.parse(asmFile);
const interFile = `${name}.inter`;
const binaryFile = `${name}.hack`;

main();

async function main() {
    logger("Beginning compilation...");
    await pass1();
    logger("Pass 1 complete...");
    logger("Here is the resolved symbol table:");
    logger(symbolTable);
    await pass2();
    logger("Compilation complete.");
}

async function pass1() {
    const interFileWriter = fileWriter(interFile);
    const pass1 = pipe(lines).to(clean).to(buildSymbolTable).to(interFileWriter).build();
    await pass1(asmFile);
}

async function pass2() {
    const binaryFileWriter = fileWriter(binaryFile);
    const pass2 = pipe(lines).to(translate).to(binaryFileWriter).build();
    await pass2(interFile);
}

async function* lines(file: string) {
    const src = createReadStream(file);
    const lineStream = readline.createInterface({ input: src, crlfDelay: Infinity });
    for await (const line of lineStream) yield line;
    lineStream.close();
}

async function* clean(lines: AsyncIterable<string>) {
    for await (const line of lines) {
        const cleanLine = line.replace(/\/\/.*/, "").replace(/\s+/g, "");
        if (cleanLine.length > 0) yield cleanLine;
    }
}

async function* buildSymbolTable(cleanLines: AsyncIterable<string>): AsyncIterable<string> {
    let lineNumber = 0;
    for await (const line of cleanLines) {
        if (line.startsWith("(")) {
            const label = line.slice(1, -1);
            symbolTable[label] = lineNumber;
            continue;
        }
        lineNumber++;
        yield line;
    }
}

async function* translate(mnemonics: AsyncIterable<string>): AsyncIterable<string> {
    let variableCounter = 0;
    for await (const mnemonic of mnemonics) {
        if (isAInstruction(mnemonic)) {
            const aValue = mnemonic.slice(1);
            const translated = /^\d+$/.test(aValue)
                ? Number(aValue)
                : (symbolTable[aValue] ??= 16 + variableCounter++);
            yield translated.toString(2).padStart(16, "0");
        } else {
            const normalizedMnemonic = normalizeCInstruction(mnemonic);
            const [dest, compJump] = normalizedMnemonic.split("=");
            const [comp, jump] = compJump.split(";");
            const destBits = destinationTable[dest];
            const compBits = computationTable[comp];
            const jumpBits = jumpTable[jump];
            yield `111${compBits}${destBits}${jumpBits}`;
        }
    }
}

function fileWriter(file: string) {
    return async (lines: AsyncIterable<string>) => {
        const writer = createWriteStream(file);
        for await (const line of lines) writer.write(line + os.EOL);
        writer.close();
    };
}
