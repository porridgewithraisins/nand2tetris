"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipe = exports.logger = exports.jumpTable = exports.destinationTable = exports.computationTable = exports.symbolTable = exports.normalizeCInstruction = exports.isAInstruction = void 0;
const Computations_json_1 = __importDefault(require("./translations/Computations.json"));
const DefaultSymbolTable_json_1 = __importDefault(require("./translations/DefaultSymbolTable.json"));
const Destinations_json_1 = __importDefault(require("./translations/Destinations.json"));
const Jumps_json_1 = __importDefault(require("./translations/Jumps.json"));
const isAInstruction = (instruction) => instruction.startsWith("@");
exports.isAInstruction = isAInstruction;
const normalizeCInstruction = (instruction) => {
    if (!instruction.includes("="))
        instruction = `null=${instruction}`;
    if (!instruction.includes(";"))
        instruction = `${instruction};null`;
    return instruction;
};
exports.normalizeCInstruction = normalizeCInstruction;
exports.symbolTable = DefaultSymbolTable_json_1.default;
exports.computationTable = Computations_json_1.default;
exports.destinationTable = Destinations_json_1.default;
exports.jumpTable = Jumps_json_1.default;
const showSteps = process.argv.includes("--show-steps");
const logger = (...args) => showSteps && console.log(...args);
exports.logger = logger;
const pipe = (f) => {
    return {
        to: (g) => (0, exports.pipe)((arg) => g(f(arg))),
        build: () => f,
    };
};
exports.pipe = pipe;
//# sourceMappingURL=util.js.map