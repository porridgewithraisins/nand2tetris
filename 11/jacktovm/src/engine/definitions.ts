export const KEYWORD =
    /^class$|^method$|^constructor$|^function$|^field$|^static$|^var$|^int$|^char$|^boolean$|^void$|^true$|^false$|^null$|^this$|^let$|^do$|^if$|^else$|^while$|^return$/;

export const SYMBOL = /\{|\}|\(|\)|\[|\]|\.|,|;|\+|-|\*|\/|&|\||\<|\>|=|~/;

export const INTCONST = /^\d+$/;

export const STRINGCONST = /"[^"]*"/;

export const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const delimiter = new RegExp("(" + SYMBOL.source + "|" + STRINGCONST.source + '|' + /\s+/.source + ")");

export interface Lexeme {
    kind: "KEYWORD" | "SYMBOL" | "INTCONST" | "STRINGCONST" | "IDENTIFIER";
    value: string;
}
