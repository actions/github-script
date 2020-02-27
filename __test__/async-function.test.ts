import {callAsyncFunction} from '../src/async-function'

describe('callAsyncFunction', () => {
  test('calls the function with its arguments', async () => {
    const result = await callAsyncFunction({foo: 'bar'}, 'return foo')
    expect(result).toEqual('bar')
  })

  test('throws on ReferenceError', async () => {
    expect.assertions(1)

    try {
      await callAsyncFunction({}, 'proces')
    } catch (err) {
      expect(err).toBeInstanceOf(ReferenceError)
    }
  })

  test('can access process', async () => {
    await callAsyncFunction({}, 'process')
  })

  test('can access console', async () => {
    await callAsyncFunction({}, 'console')
  })
})
