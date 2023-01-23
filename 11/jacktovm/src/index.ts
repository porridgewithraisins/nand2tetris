import * as fsp from "fs/promises";
import { compile } from "./engine";

async function main() {
    const src = process.argv[2];
    const stats = await fsp.stat(src);
    await fsp.mkdir("./compiled", { recursive: true });
    await fsp.mkdir("./artifacts", { recursive: true });
    if (stats.isFile()) {
        if (src.endsWith(".jack")) await compile(src);
    } else if (stats.isDirectory()) {
        const files = await fsp.readdir(src);
        const jackFiles = files.filter(file => file.endsWith(".jack"));
        const compilationProcesses = jackFiles.map(file => compile(`${src}/${file}`));
        await Promise.all(compilationProcesses);
    } else {
        throw new Error("Invalid source");
    }
}

main();
