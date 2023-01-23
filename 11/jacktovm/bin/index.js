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
Object.defineProperty(exports, "__esModule", { value: true });
const fsp = __importStar(require("fs/promises"));
const engine_1 = require("./engine");
async function main() {
    const src = process.argv[2];
    const stats = await fsp.stat(src);
    await fsp.mkdir("./compiled", { recursive: true });
    await fsp.mkdir("./artifacts", { recursive: true });
    if (stats.isFile()) {
        if (src.endsWith(".jack"))
            await (0, engine_1.compile)(src);
    }
    else if (stats.isDirectory()) {
        const files = await fsp.readdir(src);
        const jackFiles = files.filter(file => file.endsWith(".jack"));
        const compilationProcesses = jackFiles.map(file => (0, engine_1.compile)(`${src}/${file}`));
        await Promise.all(compilationProcesses);
    }
    else {
        throw new Error("Invalid source");
    }
}
main();
//# sourceMappingURL=index.js.map