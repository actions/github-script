/* eslint-disable @typescript-eslint/no-explicit-any */

import {getRetryOptions} from '../src/retry-options'

describe('getRequestOptions', () => {
  test('retries disabled if retries == 0', async () => {
    const [retryOptions, requestOptions, throttlingOptions] = getRetryOptions(
      0,
      [400, 500, 502],
      []
    )

    expect(retryOptions.enabled).toBe(false)
    expect(retryOptions.doNotRetry).toBeFalsy()

    expect(requestOptions?.retries).toBeFalsy()
    expect(throttlingOptions?.onRateLimit).toBeFalsy()
    expect(throttlingOptions?.onSecondaryRateLimit).toBeFalsy()
  })

  test('properties set if retries > 0', async () => {
    const [retryOptions, requestOptions, throttlingOptions] = getRetryOptions(
      1,
      [400, 500, 502],
      []
    )

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toEqual([400, 500, 502])

    expect(requestOptions?.retries).toEqual(1)
    expect(throttlingOptions?.onRateLimit).toBeDefined()
    expect(throttlingOptions?.onSecondaryRateLimit).toBeDefined()
  })

  test('properties set if retries > 0', async () => {
    const [retryOptions, requestOptions, throttlingOptions] = getRetryOptions(
      1,
      [400, 500, 502],
      []
    )

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toEqual([400, 500, 502])

    expect(requestOptions?.retries).toEqual(1)
    expect(throttlingOptions?.onRateLimit).toBeDefined()
    expect(throttlingOptions?.onSecondaryRateLimit).toBeDefined()
  })

  test('retryOptions.doNotRetry not set if exemptStatusCodes isEmpty', async () => {
    const [retryOptions, requestOptions, throttlingOptions] = getRetryOptions(
      1,
      [],
      []
    )

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toBeUndefined()

    expect(requestOptions?.retries).toEqual(1)
    expect(throttlingOptions?.onRateLimit).toBeDefined()
    expect(throttlingOptions?.onSecondaryRateLimit).toBeDefined()
  })

  test('requestOptions does not override defaults from @actions/github', async () => {
    const [retryOptions, requestOptions, throttlingOptions] = getRetryOptions(
      1,
      [],
      {
        request: {
          agent: 'default-user-agent'
        },
        foo: 'bar'
      }
    )

    expect(retryOptions.enabled).toBe(true)
    expect(retryOptions.doNotRetry).toBeUndefined()

    expect(requestOptions?.retries).toEqual(1)
    expect(requestOptions?.agent).toEqual('default-user-agent')
    expect(requestOptions?.foo).toBeUndefined() // this should not be in the `options.request` object, but at the same level as `request`

    expect(throttlingOptions?.onRateLimit).toBeDefined()
    expect(throttlingOptions?.onSecondaryRateLimit).toBeDefined()
  })
})
