const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor

type AsyncFunctionArguments = {[key: string]: any}

export async function callAsyncFunction(
  args: AsyncFunctionArguments,
  source: string
): Promise<any> {
  const fn = new AsyncFunction(...Object.keys(args), source)
  return fn(...Object.values(args))
}
