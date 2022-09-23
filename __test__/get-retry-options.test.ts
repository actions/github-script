/* eslint-disable @typescript-eslint/no-explicit-any */

import {getRetryOptions} from '../src/retry-options'

describe('getRequestOptions', () => {
  test('retries disabled if retries == 0', async () => {
    const [retryOptions, requestOptions] = getRetryOptions(0, 8, [
      400,
      500,
      502
    ])

    expect(retryOptions.enabled).toBe(false)
    expect(retryOptions.doNotRetry).toBeFalsy()

    expect(requestOptions.retries).toBeFalsy()
  })

  test('properties set if retries > 0', async () => {
    const [retryOptions, requestOptions] = getRetryOptions(1, 8, [
      400,
      500,
      502
    ])

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toEqual([400, 500, 502])

    expect(requestOptions.retries).toEqual(1)
    expect(requestOptions.retryAfter).toEqual(8)
  })

  test('properties set if retries > 0', async () => {
    const [retryOptions, requestOptions] = getRetryOptions(1, 8, [
      400,
      500,
      502
    ])

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toEqual([400, 500, 502])

    expect(requestOptions.retries).toEqual(1)
    expect(requestOptions.retryAfter).toEqual(8)
  })

  test('retryAfter can be set to zero', async () => {
    const [retryOptions, requestOptions] = getRetryOptions(1, 0, [
      400,
      500,
      502
    ])

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toEqual([400, 500, 502])

    expect(requestOptions.retries).toEqual(1)
    expect(requestOptions.retryAfter).toEqual(0)
  })

  test('retryOptions.doNotRetry not set if doNotRetry isEmpty', async () => {
    const [retryOptions, requestOptions] = getRetryOptions(1, 0, [])

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toBeUndefined()

    expect(requestOptions.retries).toEqual(1)
    expect(requestOptions.retryAfter).toEqual(0)
  })
})
