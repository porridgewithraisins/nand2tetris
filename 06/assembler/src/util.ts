import ComputationTranslations from "./translations/Computations.json";
import DefaultSymbolTable from "./translations/DefaultSymbolTable.json";
import DestinationTranslations from "./translations/Destinations.json";
import JumpTranslations from "./translations/Jumps.json";
import { Fun } from "./types";

export const isAInstruction = (instruction: string) => instruction.startsWith("@");
export const normalizeCInstruction = (instruction: string) => {
    if (!instruction.includes("=")) instruction = `null=${instruction}`;
    if (!instruction.includes(";")) instruction = `${instruction};null`;
    return instruction;
};

export const symbolTable = DefaultSymbolTable as Record<string, number>;
export const computationTable = ComputationTranslations as Record<string, string>;
export const destinationTable = DestinationTranslations as Record<string, string>;
export const jumpTable = JumpTranslations as Record<string, string>;

const showSteps = process.argv.includes("--show-steps");

export const logger = (...args: any[]) => showSteps && console.log(...args);

export const pipe = <A, B>(f: Fun<A, B>) => {
    return {
        to: <C>(g: Fun<B, C>) => pipe((arg: A) => g(f(arg))),
        build: () => f,
    };
};
