import { Codegen } from "../services/codegen/vm";
import { TokenGen } from "../services/codegen/xml";
import { ClassContext, JackClassSymbol } from "../services/contexts/class";
import { JackSubroutineSymbol, SubroutineContext } from "../services/contexts/subroutine";
import { INTCONST, Lexeme, STRINGCONST } from "./definitions";
import { PeekableAsyncGenerator } from "./util";

export class CompilationUnit {
    context!: ClassContext;
    subroutineContext!: SubroutineContext;
    codegen!: Codegen;
    tokgen!: TokenGen;
    labelId = 0;

    private constructor(readonly lexemes: PeekableAsyncGenerator<Lexeme, Lexeme>) {}

    static async new(lexemes: Promise<PeekableAsyncGenerator<Lexeme, Lexeme>>) {
        const instance = new CompilationUnit(await lexemes);
        await instance.initialize();
        await instance.compileClass();
        await instance.teardown();
    }

    private async initialize() {
        this.codegen = new Codegen();
        this.tokgen = new TokenGen();
    }

    private async teardown() {
        await this.codegen.cleanup();
        await this.tokgen.cleanup();
    }

    /**
     * `class` className `{` classVarDec* subroutineDec* `}`
     */
    private async compileClass() {
        await this.startSegment("class");

        await this.consumeLexeme("class");

        this.context = new ClassContext(await this.nextLexeme());
        this.codegen.className = this.context.name;
        this.tokgen.className = this.context.name;

        await this.consumeLexeme("{");

        while (await this.checkLexeme(/^static$|^field$/)) {
            await this.compileClassVarDec();
        }

        while (await this.checkLexeme(/^constructor$|^function$|^method$/)) {
            await this.compileSubroutineDec();
        }

        await this.consumeLexeme("}");

        await this.endSegment("class");
    }

    /**
     * {`static` | `field`} type varName (`,` varName)* `;`
     */
    private async compileClassVarDec() {
        await this.startSegment("classVarDec");

        const kind = (await this.nextLexeme()) as "static" | "field";
        const type = await this.nextLexeme();
        const name = await this.nextLexeme();
        this.context.define(kind, type, name);
        while (await this.checkLexeme(",")) {
            await this.consumeLexeme(",");
            const name = await this.nextLexeme();
            this.context.define(kind, type, name);
        }
        await this.consumeLexeme(";");

        await this.endSegment("classVarDec");
    }
    /**
     * (`constructor` | `function` | `method`) (`void` | type) subroutineName `(` parameterList `)` subroutineBody
     */
    private async compileSubroutineDec() {
        await this.startSegment("subroutineDec");

        const kind = (await this.nextLexeme()) as "constructor" | "function" | "method";
        const returnType = await this.nextLexeme();
        const name = await this.nextLexeme();

        this.subroutineContext = new SubroutineContext(this.context.name, kind, returnType, name);

        await this.consumeLexeme("(");

        await this.startSegment("parameterList");

        if (!(await this.checkLexeme(")"))) await this.compileParameterList();

        await this.endSegment("parameterList");

        await this.consumeLexeme(")");
        await this.compileSubroutineBody();
    }

    /**
     * (parameter (`,` parameter)*)?
     */
    private async compileParameterList() {
        const type = await this.nextLexeme();
        const name = await this.nextLexeme();
        this.subroutineContext.addArg(type, name);
        while (await this.checkLexeme(",")) {
            await this.consumeLexeme(",");
            const type = await this.nextLexeme();
            const name = await this.nextLexeme();
            this.subroutineContext.addArg(type, name);
        }
    }

    private async compileSubroutineBody() {
        await this.startSegment("subroutineBody");

        await this.consumeLexeme("{");
        while (await this.checkLexeme(/^var$/)) await this.compileVarDec();
        await this.codegen.funcDecl(this.context, this.subroutineContext);
        await this.compileStatements();
        await this.consumeLexeme("}");

        await this.endSegment("subroutineBody");
        await this.endSegment("subroutineDec");
    }

    private async compileVarDec() {
        await this.startSegment("varDec");

        await this.consumeLexeme("var");
        const type = await this.nextLexeme();
        const name = await this.nextLexeme();
        this.subroutineContext.addVar(type, name);
        while (await this.checkLexeme(",")) {
            await this.consumeLexeme(",");
            const name = await this.nextLexeme();
            this.subroutineContext.addVar(type, name);
        }
        await this.consumeLexeme(";");

        await this.endSegment("varDec");
    }

    private async compileStatements() {
        await this.startSegment("statements");

        while (await this.checkLexeme(/^let$|^if$|^while$|^do$|^return$/))
            if (await this.checkLexeme("let")) await this.compileLetStatement();
            else if (await this.checkLexeme("if")) await this.compileIfStatement();
            else if (await this.checkLexeme("while")) await this.compileWhileStatement();
            else if (await this.checkLexeme("do")) await this.compileDoStatement();
            else await this.compileReturn();

        await this.endSegment("statements");
    }

    private async compileLetStatement() {
        await this.startSegment("letStatement");

        await this.consumeLexeme("let");
        const name = await this.nextLexeme();
        const variable = this.getSymbolFor(name);
        let arrayAssignment = await this.checkLexeme("[");
        if (arrayAssignment) {
            await this.compileArraySubscript(variable);
        }
        await this.consumeLexeme("=");
        await this.compileExpression();
        await this.consumeLexeme(";");
        if (arrayAssignment) {
            await this.codegen.popRaw("temp", 0);
            await this.codegen.popRaw("pointer", 1);
            await this.codegen.pushRaw("temp", 0);
            await this.codegen.popRaw("that", 0);
        } else {
            await this.codegen.pop(variable);
        }

        await this.endSegment("letStatement");
    }

    private async compileArraySubscript(variable: JackClassSymbol | JackSubroutineSymbol) {
        await this.codegen.push(variable);
        await this.consumeLexeme("[");
        await this.compileExpression();
        await this.consumeLexeme("]");
        await this.codegen.add();
    }

    private async compileIfStatement() {
        await this.startSegment("ifStatement");

        await this.consumeLexeme("if");
        await this.consumeLexeme("(");
        await this.compileExpression();
        await this.consumeLexeme(")");
        await this.consumeLexeme("{");
        const endLabel = this.makeLabel();
        const labelWhenFalse = this.makeLabel();
        await this.codegen.if(labelWhenFalse);
        await this.compileStatements();
        await this.codegen.goto(endLabel);
        await this.codegen.label(labelWhenFalse);
        await this.consumeLexeme("}");
        if ((await this.peekLexeme()) === "else") {
            await this.consumeLexeme("else");
            await this.consumeLexeme("{");
            await this.compileStatements();
            await this.consumeLexeme("}");
        }
        await this.codegen.label(endLabel);

        await this.endSegment("ifStatement");
    }

    private async compileWhileStatement() {
        await this.startSegment("whileStatement");

        await this.consumeLexeme("while");
        const topLabel = this.makeLabel();
        const endLabel = this.makeLabel();
        await this.codegen.label(topLabel);
        await this.consumeLexeme("(");
        await this.compileExpression();
        await this.consumeLexeme(")");
        await this.consumeLexeme("{");
        await this.codegen.if(endLabel);
        await this.compileStatements();
        await this.codegen.goto(topLabel);
        await this.codegen.label(endLabel);
        await this.consumeLexeme("}");

        await this.endSegment("whileStatement");
    }

    private async compileDoStatement() {
        await this.startSegment("doStatement");

        await this.consumeLexeme("do");
        await this.compileCall(await this.nextLexeme());
        await this.codegen.discardTop();
        await this.consumeLexeme(";");

        await this.endSegment("doStatement");
    }

    private async compileCall(callable: string) {
        let name,
            argCount = 0;
        if (await this.checkLexeme(".")) {
            await this.consumeLexeme(".");
            const symbol = this.getSymbolFor(callable);
            const className = symbol?.type || callable;
            const funcName = await this.nextLexeme();
            name = `${className}.${funcName}`;

            if (symbol) {
                await this.codegen.push(symbol);
                argCount++;
            }
        } else {
            await this.codegen.pushRaw("pointer", 0);
            argCount++;
            name = `${this.context.name}.${callable}`; // it is a func
        }
        await this.consumeLexeme("(");

        await this.startSegment("expressionList");

        if (!(await this.checkLexeme(")"))) {
            await this.compileExpression();
            argCount++;
            while (await this.checkLexeme(",")) {
                await this.consumeLexeme(",");
                await this.compileExpression();
                argCount++;
            }
        }

        await this.endSegment("expressionList");

        await this.consumeLexeme(")");

        await this.codegen.call(name, argCount);
    }

    private async compileReturn() {
        await this.startSegment("returnStatement");

        await this.consumeLexeme("return");
        if (!(await this.checkLexeme(";"))) {
            await this.compileExpression();
        } else {
            await this.codegen.constant(0);
        }
        await this.consumeLexeme(";");
        await this.codegen.return();

        await this.endSegment("returnStatement");
    }

    private async compileExpression() {
        await this.startSegment("expression");

        await this.compileTerm();
        while (await this.checkLexeme(/\+|-|\*|\/|&|\||<|>|=|~/)) {
            const operator = await this.nextLexeme();
            await this.compileTerm();
            await this.codegen.binaryOp(operator);
        }

        await this.endSegment("expression");
    }

    private async compileTerm() {
        await this.startSegment("term");

        if (await this.checkLexeme(STRINGCONST)) {
            await this.codegen.string(await this.nextLexeme());
        } else if (await this.checkLexeme(INTCONST)) {
            await this.codegen.constant(+(await this.nextLexeme()));
        } else if (await this.checkLexeme("(")) {
            await this.consumeLexeme("(");
            await this.compileExpression();
            await this.consumeLexeme(")");
        } else if (await this.checkLexeme(/^-$|^~$/)) {
            const operator = (await this.nextLexeme()) as "-" | "~";
            await this.compileTerm();
            await this.codegen.unaryOp(operator);
        } else if (await this.checkLexeme("this")) {
            await this.consumeLexeme("this");
            await this.codegen.pushRaw("pointer", 0);
        } else if (await this.checkLexeme(/^true$|^false$|^null$/)) {
            await this.codegen.constant(0);
            const value = await this.nextLexeme();
            if (value === "true") await this.codegen.unaryOp("~");
        } else {
            const name = await this.nextLexeme();
            const variable = this.getSymbolFor(name);
            if (await this.checkLexeme("[")) {
                await this.compileArraySubscript(variable);
                await this.codegen.popRaw("pointer", 1);
                await this.codegen.pushRaw("that", 0);
            } else if (await this.checkLexeme(/\(|\./)) await this.compileCall(name);
            else await this.codegen.push(variable);
        }

        await this.endSegment("term");
    }

    private getSymbolFor(name: string) {
        return this.subroutineContext.symbols[name] ?? this.context.symbols[name];
    }

    private async consumeLexeme(_symbol: string | RegExp) {
        await this.nextLexeme();
    }

    private async checkLexeme(symbol: string | RegExp) {
        if (symbol instanceof RegExp) return symbol.test(await this.peekLexeme());
        else return (await this.peekLexeme()) === symbol;
    }

    private async peekLexeme() {
        return (await this.lexemes.peek()).value.value;
    }
    private async nextLexeme() {
        const next = (await this.lexemes.next()).value;
        this.tokgen.writeLexeme(next);
        return next.value;
    }

    private async startSegment(name: string) {
        await this.tokgen.writeStartSegment(name);
    }

    private async endSegment(name: string) {
        await this.tokgen.writeEndSegment(name);
    }

    private makeLabel() {
        return `L${this.labelId++}`;
    }
}
