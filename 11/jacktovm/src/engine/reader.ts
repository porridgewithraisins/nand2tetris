import { createReadStream } from "fs";

// exists purely for code readability (pun intended)
export async function* reader(src: string) {
    yield* createReadStream(src, { encoding: "utf-8" });
}
