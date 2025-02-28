/* eslint-disable @typescript-eslint/no-explicit-any */

import {callAsyncFunction} from '../src/async-function'

describe(callAsyncFunction.name, () => {
  test('calls the function with its arguments', async () => {
    const result = await callAsyncFunction({foo: 'bar'} as any, 'return foo')
    expect(result).toEqual('bar')
  })

  test('can await a Promise', async () => {
    const result = await callAsyncFunction(
      {} as any,
      'return await new Promise(resolve => resolve("bar"))'
    )
    expect(result).toEqual('bar')
  })

  test(`throws an ${ReferenceError.name}`, async () => {
    expect.assertions(1)

    try {
      await callAsyncFunction({} as any, 'proces')
    } catch (err) {
      expect(err).toBeInstanceOf(ReferenceError)
    }
  })

  test('can access process', async () => {
    await callAsyncFunction({} as any, 'process')
  })

  test('can access console', async () => {
    await callAsyncFunction({} as any, 'console')
  })
})
