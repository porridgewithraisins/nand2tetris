export const pipe = <A, B>(f: ($: A) => B) => {
    return {
        to: <C>(g: ($: B) => C) => pipe((arg: A) => g(f(arg))),
        start: (arg: A) => f(arg),
    };
};

export interface PeekableAsyncGenerator<T = unknown, R = any, N = unknown>
    extends AsyncGenerator<T, R, N> {
    peek(): Promise<IteratorResult<T, R>>;
}

export async function makePeekable<T>(gen: AsyncGenerator<T>) {
    let state = await gen.next();
    const ret = (async function* () {
        while (!state.done) {
            const current = state.value;
            state = await gen.next();
            yield current;
        }
        return state.value;
    })() as PeekableAsyncGenerator<T, T>;
    ret.peek = async () => state;
    return ret;
}

export const clampToZero = (n: number) => Math.max(n, 0);
