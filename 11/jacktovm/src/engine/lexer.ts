import { IDENTIFIER, INTCONST, KEYWORD, Lexeme, STRINGCONST, SYMBOL } from "./definitions";

/**
 * Lexes the tokens as per the given grammar.
 * @param tokens cleaned tokens to be lexed
 */
export async function* lexer(tokens: AsyncIterable<string>) {
    const matcher = {
        KEYWORD,
        SYMBOL,
        INTCONST,
        STRINGCONST,
        IDENTIFIER,
    } as const;
    for await (const token of tokens) {
        const [kind] = Object.entries(matcher).find(([, regex]) => regex.test(token)) || [
            undefined,
        ];
        yield { kind, value: token } as Lexeme;
    }
}
