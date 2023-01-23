"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizer = void 0;
const definitions_1 = require("./definitions");
/**
 * Splits streaming data on a regex and yields the tokens.
 * The regex used to split can be made into a pure DFA i.e no lookaheads, etc,.
 * So it won't be an expensive operation
 * @param cleaned Code with comments removed
 */
async function* tokenizer(cleaned) {
    let prevData = "";
    // mostly stores only one token
    for await (const chunk of cleaned) {
        const splits = (prevData + " " + chunk).split(definitions_1.delimiter);
        // in case our match spans chunks
        prevData += splits.pop();
        for (const split of splits) {
            const token = split.trim();
            if (token)
                yield token;
        }
    }
}
exports.tokenizer = tokenizer;
//# sourceMappingURL=tokenizer.js.map