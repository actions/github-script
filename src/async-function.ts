type AsyncFunction<A, R> = (args: A) => Promise<R>

export async function callAsyncFunction<A = {}, R = unknown>(
  args: A,
  source: string
): Promise<R> {
  const argsKeys = Object.keys(args).join(',')

  const wrappedFunction: AsyncFunction<A, R> = eval(`async({${argsKeys}}) => {
    ${source}
  }`)

  return wrappedFunction(args)
}
