"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const util_1 = require("./util");
const asmFile = process.argv[2];
const { name } = path_1.default.parse(asmFile);
const interFile = `${name}.inter`;
const binaryFile = `${name}.hack`;
main();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.logger)("Beginning compilation...");
        yield pass1();
        (0, util_1.logger)("Pass 1 complete...");
        (0, util_1.logger)("Here is the resolved symbol table:");
        (0, util_1.logger)(util_1.symbolTable);
        yield pass2();
        (0, util_1.logger)("Compilation complete.");
    });
}
function pass1() {
    return __awaiter(this, void 0, void 0, function* () {
        const interFileWriter = fileWriter(interFile);
        const pass1 = (0, util_1.pipe)(lines).to(clean).to(buildSymbolTable).to(interFileWriter).build();
        yield pass1(asmFile);
    });
}
function pass2() {
    return __awaiter(this, void 0, void 0, function* () {
        const binaryFileWriter = fileWriter(binaryFile);
        const pass2 = (0, util_1.pipe)(lines).to(translate).to(binaryFileWriter).build();
        yield pass2(interFile);
    });
}
function lines(file) {
    return __asyncGenerator(this, arguments, function* lines_1() {
        var e_1, _a;
        const src = (0, fs_1.createReadStream)(file);
        const lineStream = readline_1.default.createInterface({ input: src, crlfDelay: Infinity });
        try {
            for (var lineStream_1 = __asyncValues(lineStream), lineStream_1_1; lineStream_1_1 = yield __await(lineStream_1.next()), !lineStream_1_1.done;) {
                const line = lineStream_1_1.value;
                yield yield __await(line);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (lineStream_1_1 && !lineStream_1_1.done && (_a = lineStream_1.return)) yield __await(_a.call(lineStream_1));
            }
            finally { if (e_1) throw e_1.error; }
        }
        lineStream.close();
    });
}
function clean(lines) {
    return __asyncGenerator(this, arguments, function* clean_1() {
        var e_2, _a;
        try {
            for (var lines_2 = __asyncValues(lines), lines_2_1; lines_2_1 = yield __await(lines_2.next()), !lines_2_1.done;) {
                const line = lines_2_1.value;
                const cleanLine = line.replace(/\/\/.*/, "").replace(/\s+/g, "");
                if (cleanLine.length > 0)
                    yield yield __await(cleanLine);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (lines_2_1 && !lines_2_1.done && (_a = lines_2.return)) yield __await(_a.call(lines_2));
            }
            finally { if (e_2) throw e_2.error; }
        }
    });
}
function buildSymbolTable(cleanLines) {
    return __asyncGenerator(this, arguments, function* buildSymbolTable_1() {
        var e_3, _a;
        let lineNumber = 0;
        try {
            for (var cleanLines_1 = __asyncValues(cleanLines), cleanLines_1_1; cleanLines_1_1 = yield __await(cleanLines_1.next()), !cleanLines_1_1.done;) {
                const line = cleanLines_1_1.value;
                if (line.startsWith("(")) {
                    const label = line.slice(1, -1);
                    util_1.symbolTable[label] = lineNumber;
                    continue;
                }
                lineNumber++;
                yield yield __await(line);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (cleanLines_1_1 && !cleanLines_1_1.done && (_a = cleanLines_1.return)) yield __await(_a.call(cleanLines_1));
            }
            finally { if (e_3) throw e_3.error; }
        }
    });
}
function translate(mnemonics) {
    var _a;
    return __asyncGenerator(this, arguments, function* translate_1() {
        var e_4, _b;
        let variableCounter = 0;
        try {
            for (var mnemonics_1 = __asyncValues(mnemonics), mnemonics_1_1; mnemonics_1_1 = yield __await(mnemonics_1.next()), !mnemonics_1_1.done;) {
                const mnemonic = mnemonics_1_1.value;
                if ((0, util_1.isAInstruction)(mnemonic)) {
                    const aValue = mnemonic.slice(1);
                    const translated = /^\d+$/.test(aValue)
                        ? Number(aValue)
                        : ((_a = util_1.symbolTable[aValue]) !== null && _a !== void 0 ? _a : (util_1.symbolTable[aValue] = 16 + variableCounter++));
                    yield yield __await(translated.toString(2).padStart(16, "0"));
                }
                else {
                    const normalizedMnemonic = (0, util_1.normalizeCInstruction)(mnemonic);
                    const [dest, compJump] = normalizedMnemonic.split("=");
                    const [comp, jump] = compJump.split(";");
                    const destBits = util_1.destinationTable[dest];
                    const compBits = util_1.computationTable[comp];
                    const jumpBits = util_1.jumpTable[jump];
                    yield yield __await(`111${compBits}${destBits}${jumpBits}`);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (mnemonics_1_1 && !mnemonics_1_1.done && (_b = mnemonics_1.return)) yield __await(_b.call(mnemonics_1));
            }
            finally { if (e_4) throw e_4.error; }
        }
    });
}
function fileWriter(file) {
    return (lines) => { var lines_3, lines_3_1; return __awaiter(this, void 0, void 0, function* () {
        var e_5, _a;
        const writer = (0, fs_1.createWriteStream)(file);
        try {
            for (lines_3 = __asyncValues(lines); lines_3_1 = yield lines_3.next(), !lines_3_1.done;) {
                const line = lines_3_1.value;
                writer.write(line + os_1.default.EOL);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (lines_3_1 && !lines_3_1.done && (_a = lines_3.return)) yield _a.call(lines_3);
            }
            finally { if (e_5) throw e_5.error; }
        }
        writer.close();
    }); };
}
//# sourceMappingURL=index.js.map