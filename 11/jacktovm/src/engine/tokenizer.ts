import { delimiter } from "./definitions";

/**
 * Splits streaming data on a regex and yields the tokens.
 * The regex used to split can be made into a pure DFA i.e no lookaheads, etc,.
 * So it won't be an expensive operation
 * @param cleaned Code with comments removed
 */
export async function* tokenizer(cleaned: AsyncIterable<string>) {
    let prevData = "";
    // mostly stores only one token
    for await (const chunk of cleaned) {
        const splits = (prevData + " " + chunk).split(delimiter);
        // in case our match spans chunks
        prevData += splits.pop();

        for (const split of splits) {
            const token = split.trim();
            if (token) yield token;
        }
    }
}
