import * as core from '@actions/core'

export type RetryOptions = {
  doNotRetry?: number[]
  enabled?: boolean
}

export type RequestOptions = {
  retries?: number
  retryAfter?: number
}

export function getRetryOptions(
  retries: number,
  retryAfter: number,
  doNotRetry: number[]
): [RetryOptions, RequestOptions] {
  if (retries <= 0) {
    return [{enabled: false}, {}]
  }

  const retryOptions: RetryOptions = {
    enabled: true
  }

  if (doNotRetry.length > 0) {
    retryOptions.doNotRetry = doNotRetry
  }

  const requestOptions: RequestOptions = {
    retries,
    retryAfter: retryAfter
  }

  core.info(
    `GitHub client configured with: (retries: ${
      requestOptions.retries
    }, retryAfter: ${requestOptions.retryAfter}, doNotRetry: ${
      retryOptions?.doNotRetry ?? 'octokit default: [400, 401, 403, 404, 422]'
    })`
  )

  return [retryOptions, requestOptions]
}

export function parseNumberArray(listString: string): number[] {
  if (!listString) {
    return []
  }

  const split = listString.trim().split(',')
  return split.map(x => parseInt(x))
}
