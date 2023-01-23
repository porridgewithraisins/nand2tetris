"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
const cleaner_1 = require("./cleaner");
const lexer_1 = require("./lexer");
const compilation_unit_1 = require("./compilation-unit");
const reader_1 = require("./reader");
const tokenizer_1 = require("./tokenizer");
const util_1 = require("./util");
exports.compile = (0, util_1.pipe)(reader_1.reader)
    .to(cleaner_1.cleaner)
    .to(tokenizer_1.tokenizer)
    .to(lexer_1.lexer)
    .to(util_1.makePeekable)
    .to(compilation_unit_1.CompilationUnit.new).start;
//# sourceMappingURL=index.js.map