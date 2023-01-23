/**
 * Removes comments from the code readying it for tokenization
 * Takes care to not remove comments inside strings
 * @param chunks chunks of code
 */

export async function* cleaner(chunks: AsyncIterable<string>) {
    let isInComment = false;
    let isInBlockComment = false;
    for await (const chunk of chunks) {
        let quotesCount = 0;
        let i = 0;
        let commentsRemoved = "";
        while (i < chunk.length) {
            if (!isInComment && !isInBlockComment && chunk[i] === '"') {
                quotesCount++;
                commentsRemoved += chunk[i];
                i++;
                continue;
            }

            if (quotesCount % 2 == 1) {
                commentsRemoved += chunk[i];
                i++;
                continue;
            }
            if (chunk.slice(i, i + 2) === "//") {
                isInComment = true;
                i += 2;
                continue;
            }
            if (chunk.slice(i, i + 2) === "/*") {
                isInBlockComment = true;
                i += 2;
                continue;
            }
            if (chunk.slice(i, i + 2) === "*/") {
                isInBlockComment = false;
                i += 2;
                continue;
            }
            if (chunk[i] == "\n") {
                isInComment = false;
                i++;
                continue;
            }
            if (isInComment || isInBlockComment) {
                i++;
                continue;
            }

            commentsRemoved += chunk[i];
            i++;
        }

        yield commentsRemoved;
    }
}
