/* eslint-disable @typescript-eslint/no-explicit-any */

import {getRetryOptions} from '../src/retry-options'

describe('getRequestOptions', () => {
  test('retries disabled if retries == 0', async () => {
    const retryOptions = getRetryOptions(0, [400, 500, 502])

    expect(retryOptions.enabled).toBe(false)
    expect(retryOptions.doNotRetry).toBeFalsy()
  })

  test('properties set if retries > 0', async () => {
    const retryOptions = getRetryOptions(1, [400, 500, 502])

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toEqual([400, 500, 502])
  })

  test('properties set if retries > 0', async () => {
    const retryOptions = getRetryOptions(1, [400, 500, 502])

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toEqual([400, 500, 502])
  })

  test('retryOptions.doNotRetry not set if exemptStatusCodes isEmpty', async () => {
    const retryOptions = getRetryOptions(1, [])

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toBeUndefined()
  })
})
