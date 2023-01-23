"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexer = void 0;
const definitions_1 = require("./definitions");
/**
 * Lexes the tokens as per the given grammar.
 * @param tokens cleaned tokens to be lexed
 */
async function* lexer(tokens) {
    const matcher = {
        KEYWORD: definitions_1.KEYWORD,
        SYMBOL: definitions_1.SYMBOL,
        INTCONST: definitions_1.INTCONST,
        STRINGCONST: definitions_1.STRINGCONST,
        IDENTIFIER: definitions_1.IDENTIFIER,
    };
    for await (const token of tokens) {
        const [kind] = Object.entries(matcher).find(([, regex]) => regex.test(token)) || [
            undefined,
        ];
        yield { kind, value: token };
    }
}
exports.lexer = lexer;
//# sourceMappingURL=lexer.js.map