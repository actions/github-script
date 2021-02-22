/* eslint-disable @typescript-eslint/no-explicit-any */

import {callAsyncFunction} from '../src/async-function'

describe('callAsyncFunction', () => {
  test('calls the function with its arguments', async () => {
    const result = await callAsyncFunction({foo: 'bar'} as any, 'return foo')
    expect(result).toEqual('bar')
  })

  test('throws on ReferenceError', async () => {
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

  describe('change directory', () => {
    const MOCK_CWD = '/path/to/action'
    const MOCK_GITHUB_WORKSPACE = '/path/to/code'
    const PREV_GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE

    let chdir: jest.SpyInstance

    beforeEach(() => {
      jest.resetModules()
      jest.clearAllMocks()

      let cwd = MOCK_CWD

      chdir = jest.spyOn(process, 'chdir').mockImplementation(directory => {
        cwd = directory
      })
      jest.spyOn(process, 'cwd').mockImplementation(() => {
        return cwd
      })
    })

    afterAll(() => {
      process.env.GITHUB_WORKSPACE = PREV_GITHUB_WORKSPACE
    })

    test('changes to GITHUB_WORKSPACE if environment variable is set', async () => {
      process.env.GITHUB_WORKSPACE = MOCK_GITHUB_WORKSPACE

      await callAsyncFunction({} as any, 'process')

      expect(chdir.mock.calls.length).toBe(2)
      expect(chdir.mock.calls[0][0]).toBe(MOCK_GITHUB_WORKSPACE)
      expect(chdir.mock.calls[1][0]).toBe(MOCK_CWD)
    })

    test('does not change directory if GITHUB_WORKSPACE is not set', async () => {
      delete process.env.GITHUB_WORKSPACE

      await callAsyncFunction({} as any, 'process')

      expect(chdir.mock.calls.length).toBe(0)
    })
  })
})
