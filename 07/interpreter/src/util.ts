import { createReadStream } from "fs";
import path from "path";
import readline from "readline";
import { Fun } from "./types";

export const jumps = {
    eq: "JEQ",
    gt: "JGT",
    lt: "JLT",
} as const;

export const unaryOps = {
    neg: "-",
    not: "!",
} as const;

export const binaryOps = {
    add: "+",
    sub: "-",
    and: "&",
    or: "|",
} as const;

export const localSegments = {
    local: "@LCL",
    argument: "@ARG",
    this: "@THIS",
    that: "@THAT",
} as const;

export const globalSegments = {
    pointer: "@3",
    temp: "@5",
} as const;

export const regularSegments = {
    ...localSegments,
    ...globalSegments,
} as const;

export const filenameSentinel = "###";

export const pipe = <A, B>(f: Fun<A, B>) => {
    return {
        to: <C>(g: Fun<B, C>) => pipe((arg: A) => g(f(arg))),
        start: (arg: A) => f(arg),
    };
};

export async function* fileContents(file: string) {
    yield filenameSentinel + path.basename(file, ".vm"); // so the translator can switch execution contexts

    const src = createReadStream(file);
    const lineStream = readline.createInterface({ input: src, crlfDelay: Infinity });

    for await (const line of lineStream) yield line;

    lineStream.close();
}
