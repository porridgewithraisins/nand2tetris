import { cleaner } from "./cleaner";
import { lexer } from "./lexer";
import { CompilationUnit } from "./compilation-unit";
import { reader } from "./reader";
import { tokenizer } from "./tokenizer";
import { makePeekable, pipe } from "./util";

export const compile = pipe(reader)
    .to(cleaner)
    .to(tokenizer)
    .to(lexer)
    .to(makePeekable)
    .to(CompilationUnit.new).start;
