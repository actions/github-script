export async function callAsyncFunction<A = {}, R = unknown>(
  args: A,
  source: string
): Promise<R> {
  const argsKeys = Object.keys(args).join(',')

  const wrappedFunction: (args: A) => Promise<R> = eval(`async({${argsKeys}}) => {
    ${source}
  }`)

  return wrappedFunction(args)
}
