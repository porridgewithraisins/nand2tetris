"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
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
exports.fileContents = exports.pipe = exports.filenameSentinel = exports.regularSegments = exports.globalSegments = exports.localSegments = exports.binaryOps = exports.unaryOps = exports.jumps = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
exports.jumps = {
    eq: "JEQ",
    gt: "JGT",
    lt: "JLT",
};
exports.unaryOps = {
    neg: "-",
    not: "!",
};
exports.binaryOps = {
    add: "+",
    sub: "-",
    and: "&",
    or: "|",
};
exports.localSegments = {
    local: "@LCL",
    argument: "@ARG",
    this: "@THIS",
    that: "@THAT",
};
exports.globalSegments = {
    pointer: "@3",
    temp: "@5",
};
exports.regularSegments = Object.assign(Object.assign({}, exports.localSegments), exports.globalSegments);
exports.filenameSentinel = "###";
const pipe = (f) => {
    return {
        to: (g) => (0, exports.pipe)((arg) => g(f(arg))),
        start: (arg) => f(arg),
    };
};
exports.pipe = pipe;
function fileContents(file) {
    return __asyncGenerator(this, arguments, function* fileContents_1() {
        var e_1, _a;
        yield yield __await(exports.filenameSentinel + path_1.default.basename(file, ".vm")); // so the translator can switch execution contexts
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
exports.fileContents = fileContents;
