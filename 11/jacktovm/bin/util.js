"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePeekable = exports.pipe = void 0;
const pipe = (f) => {
    return {
        to: (g) => (0, exports.pipe)((arg) => g(f(arg))),
        start: (arg) => f(arg),
    };
};
exports.pipe = pipe;
async function makePeekable(gen) {
    let state = await gen.next();
    const _i = (async function* () {
        while (!state.done) {
            const current = state.value;
            state = await gen.next();
            yield current;
        }
        return state.value;
    })();
    _i.peek = async () => state;
    return _i;
}
exports.makePeekable = makePeekable;
//# sourceMappingURL=util.js.map