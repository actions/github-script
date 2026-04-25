import type {AsyncFunctionArguments} from './args'
export type {AsyncFunctionArguments}

const AsyncFunction = Object.getPrototypeOf(async () => null).constructor

export function callAsyncFunction<T>(
  args: AsyncFunctionArguments,
  source: string
): Promise<T> {
  const fn = new AsyncFunction(...Object.keys(args), source)
  return fn(...Object.values(args))
}
