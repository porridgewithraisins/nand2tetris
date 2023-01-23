"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reader = void 0;
const fs_1 = require("fs");
// exists purely for code readability (pun intended)
async function* reader(src) {
    yield* (0, fs_1.createReadStream)(src, { encoding: "utf-8" });
}
exports.reader = reader;
//# sourceMappingURL=reader.js.map