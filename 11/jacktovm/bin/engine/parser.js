"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilationUnit = void 0;
const vm_1 = require("../services/codegen/vm");
const xml_1 = require("../services/codegen/xml");
const class_1 = require("../services/contexts/class");
const subroutine_1 = require("../services/contexts/subroutine");
const definitions_1 = require("./definitions");
class CompilationUnit {
    constructor(lexemes) {
        this.lexemes = lexemes;
        this.labelId = 0;
    }
    static async new(lexemes) {
        const instance = new CompilationUnit(await lexemes);
        await instance.initialize();
        await instance.compileClass();
        await instance.teardown();
    }
    async initialize() {
        this.codegen = new vm_1.Codegen();
        this.tokgen = new xml_1.TokenGen();
    }
    async teardown() {
        await this.codegen.cleanup();
        await this.tokgen.cleanup();
    }
    /**
     * `class` className `{` classVarDec* subroutineDec* `}`
     */
    async compileClass() {
        await this.startSegment("class");
        await this.consumeLexeme("class");
        this.context = new class_1.ClassContext(await this.nextLexeme());
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
    async compileClassVarDec() {
        await this.startSegment("classVarDec");
        const kind = (await this.nextLexeme());
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
    async compileSubroutineDec() {
        await this.startSegment("subroutineDec");
        const kind = (await this.nextLexeme());
        const returnType = await this.nextLexeme();
        const name = await this.nextLexeme();
        this.subroutineContext = new subroutine_1.SubroutineContext(this.context.name, kind, returnType, name);
        await this.consumeLexeme("(");
        await this.startSegment("parameterList");
        if (!(await this.checkLexeme(")")))
            await this.compileParameterList();
        await this.endSegment("parameterList");
        await this.consumeLexeme(")");
        await this.compileSubroutineBody();
    }
    /**
     * (parameter (`,` parameter)*)?
     */
    async compileParameterList() {
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
    async compileSubroutineBody() {
        await this.startSegment("subroutineBody");
        await this.consumeLexeme("{");
        while (await this.checkLexeme(/^var$/))
            await this.compileVarDec();
        await this.codegen.funcDecl(this.context, this.subroutineContext);
        await this.compileStatements();
        await this.consumeLexeme("}");
        await this.endSegment("subroutineBody");
        await this.endSegment("subroutineDec");
    }
    async compileVarDec() {
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
    async compileStatements() {
        await this.startSegment("statements");
        while (await this.checkLexeme(/^let$|^if$|^while$|^do$|^return$/))
            if (await this.checkLexeme("let"))
                await this.compileLetStatement();
            else if (await this.checkLexeme("if"))
                await this.compileIfStatement();
            else if (await this.checkLexeme("while"))
                await this.compileWhileStatement();
            else if (await this.checkLexeme("do"))
                await this.compileDoStatement();
            else
                await this.compileReturn();
        await this.endSegment("statements");
    }
    async compileLetStatement() {
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
        }
        else {
            await this.codegen.pop(variable);
        }
        await this.endSegment("letStatement");
    }
    async compileArraySubscript(variable) {
        await this.codegen.push(variable);
        await this.consumeLexeme("[");
        await this.compileExpression();
        await this.consumeLexeme("]");
        await this.codegen.add();
    }
    async compileIfStatement() {
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
    async compileWhileStatement() {
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
    async compileDoStatement() {
        await this.startSegment("doStatement");
        await this.consumeLexeme("do");
        await this.compileCall(await this.nextLexeme());
        await this.codegen.discardTop();
        await this.consumeLexeme(";");
        await this.endSegment("doStatement");
    }
    async compileCall(callable) {
        let name, argCount = 0;
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
        }
        else {
            await this.codegen.pushRaw("pointer", 0);
            argCount++;
            name = `${this.context.name}.${callable}`; // it is a func
        }
        await this.consumeLexeme("(");
        if (!(await this.checkLexeme(")"))) {
            await this.compileExpression();
            argCount++;
            while (await this.checkLexeme(",")) {
                await this.consumeLexeme(",");
                await this.compileExpression();
                argCount++;
            }
        }
        await this.consumeLexeme(")");
        await this.codegen.call(name, argCount);
    }
    async compileReturn() {
        await this.startSegment("returnStatement");
        await this.consumeLexeme("return");
        if (!(await this.checkLexeme(";"))) {
            await this.compileExpression();
        }
        else {
            await this.codegen.constant(0);
        }
        await this.consumeLexeme(";");
        await this.codegen.return();
        await this.endSegment("returnStatement");
    }
    async compileExpression() {
        await this.startSegment("expression");
        await this.compileTerm();
        while (await this.checkLexeme(/\+|-|\*|\/|&|\||<|>|=|~/)) {
            const operator = await this.nextLexeme();
            await this.compileTerm();
            await this.codegen.binaryOp(operator);
        }
        await this.endSegment("expression");
    }
    async compileTerm() {
        await this.startSegment("term");
        if (await this.checkLexeme(definitions_1.STRINGCONST)) {
            await this.codegen.string(await this.nextLexeme());
        }
        else if (await this.checkLexeme(definitions_1.INTCONST)) {
            await this.codegen.constant(+(await this.nextLexeme()));
        }
        else if (await this.checkLexeme("(")) {
            await this.consumeLexeme("(");
            await this.compileExpression();
            await this.consumeLexeme(")");
        }
        else if (await this.checkLexeme(/^-$|^~$/)) {
            const operator = (await this.nextLexeme());
            await this.compileTerm();
            await this.codegen.unaryOp(operator);
        }
        else if (await this.checkLexeme("this")) {
            await this.consumeLexeme("this");
            await this.codegen.pushRaw("pointer", 0);
        }
        else if (await this.checkLexeme(/^true$|^false$|^null$/)) {
            const value = await this.nextLexeme();
            await this.codegen.constant(value === "true" ? 1 : 0);
        }
        else {
            const name = await this.nextLexeme();
            const variable = this.getSymbolFor(name);
            if (await this.checkLexeme("[")) {
                await this.compileArraySubscript(variable);
                await this.codegen.popRaw("pointer", 1);
                await this.codegen.pushRaw("that", 0);
            }
            else if (await this.checkLexeme(/\(|\./))
                await this.compileCall(name);
            else
                await this.codegen.push(variable);
        }
        await this.endSegment("term");
    }
    getSymbolFor(name) {
        return this.subroutineContext.symbols[name] ?? this.context.symbols[name];
    }
    async consumeLexeme(_symbol) {
        await this.nextLexeme();
    }
    async checkLexeme(symbol) {
        if (symbol instanceof RegExp)
            return symbol.test(await this.peekLexeme());
        else
            return (await this.peekLexeme()) === symbol;
    }
    async peekLexeme() {
        return (await this.lexemes.peek()).value.value;
    }
    async nextLexeme() {
        const next = (await this.lexemes.next()).value;
        this.tokgen.writeLexeme(next);
        return next.value;
    }
    async startSegment(name) {
        await this.tokgen.writeStartSegment(name);
    }
    async endSegment(name) {
        await this.tokgen.writeEndSegment(name);
    }
    makeLabel() {
        return `L${this.labelId++}`;
    }
}
exports.CompilationUnit = CompilationUnit;
//# sourceMappingURL=parser.js.map