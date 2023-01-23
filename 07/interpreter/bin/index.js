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
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fs = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const translations_1 = require("./translations");
const util_1 = require("./util");
main();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const src = process.argv[2];
        const name = path_1.default.basename(src, ".vm");
        const dir = path_1.default.dirname(src);
        const dest = path_1.default.join(dir, `${name}.asm`);
        const writer = fileWriter(dest);
        const interpreter = (0, util_1.pipe)(reader).to(cleaner).to(translator).to(minifier).to(writer);
        // each line of VM code in file(s) -> clean -> translate to ASM -> minify -> write to file
        yield interpreter.start(src);
        console.log("done");
    });
}
function cleaner(lines) {
    return __asyncGenerator(this, arguments, function* cleaner_1() {
        var e_1, _a;
        try {
            for (var lines_1 = __asyncValues(lines), lines_1_1; lines_1_1 = yield __await(lines_1.next()), !lines_1_1.done;) {
                const line = lines_1_1.value;
                const cleanLine = line
                    .replace(/\/\/.*/, "") // remove comments
                    .replace(/\s{2,}/g, " ") // remove extra whitespace
                    .trim(); // remove leading and trailing whitespace
                if (cleanLine.length > 0)
                    yield yield __await(cleanLine);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (lines_1_1 && !lines_1_1.done && (_a = lines_1.return)) yield __await(_a.call(lines_1));
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
function reader(source) {
    return __asyncGenerator(this, arguments, function* reader_1() {
        const statResult = yield __await(fs.stat(source));
        if (statResult.isFile())
            yield __await(yield* __asyncDelegator(__asyncValues((0, util_1.fileContents)(source))));
        else
            for (const file of yield __await(fs.readdir(source)))
                yield __await(yield* __asyncDelegator(__asyncValues((0, util_1.fileContents)(path_1.default.join(source, file)))));
    });
}
function translator(instructions) {
    return __asyncGenerator(this, arguments, function* translator_1() {
        var e_2, _a;
        const codegen = translations_1.CodeGenerator.instance;
        yield yield __await("// This file was generated by Sandy's VM Interpreter\n");
        if (!process.argv.includes("--no-bootstrap")) {
            yield yield __await("// Bootstrap code\n");
            yield yield __await(codegen.generateFor("bootstrap"));
        }
        try {
            for (var instructions_1 = __asyncValues(instructions), instructions_1_1; instructions_1_1 = yield __await(instructions_1.next()), !instructions_1_1.done;) {
                const instruction = instructions_1_1.value;
                yield yield __await(codegen.generateFor(instruction));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (instructions_1_1 && !instructions_1_1.done && (_a = instructions_1.return)) yield __await(_a.call(instructions_1));
            }
            finally { if (e_2) throw e_2.error; }
        }
    });
}
function minifier(instructions) {
    return __asyncGenerator(this, arguments, function* minifier_1() {
        var e_3, _a;
        try {
            for (var instructions_2 = __asyncValues(instructions), instructions_2_1; instructions_2_1 = yield __await(instructions_2.next()), !instructions_2_1.done;) {
                const instruction = instructions_2_1.value;
                yield yield __await(instruction.replace(/(\n)\s+/g, "$1"));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (instructions_2_1 && !instructions_2_1.done && (_a = instructions_2.return)) yield __await(_a.call(instructions_2));
            }
            finally { if (e_3) throw e_3.error; }
        }
    });
}
function fileWriter(file) {
    return (text) => { var text_1, text_1_1; return __awaiter(this, void 0, void 0, function* () {
        var e_4, _a;
        const writer = (0, fs_1.createWriteStream)(file);
        try {
            for (text_1 = __asyncValues(text); text_1_1 = yield text_1.next(), !text_1_1.done;) {
                const chunk = text_1_1.value;
                writer.write(chunk);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (text_1_1 && !text_1_1.done && (_a = text_1.return)) yield _a.call(text_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        writer.close();
    }); };
}
