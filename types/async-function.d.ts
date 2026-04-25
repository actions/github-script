import type { AsyncFunctionArguments } from './args';
export type { AsyncFunctionArguments };
export declare function callAsyncFunction<T>(args: AsyncFunctionArguments, source: string): Promise<T>;
