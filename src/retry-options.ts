import * as core from '@actions/core'

export type RetryOptions = {
  doNotRetry?: number[]
  enabled?: boolean
}

export function getRetryOptions(
  retries: number,
  exemptStatusCodes: number[]
): RetryOptions {
  if (retries <= 0) {
    return {enabled: false}
  }

  const retryOptions: RetryOptions = {
    enabled: true
  }

  if (exemptStatusCodes.length > 0) {
    retryOptions.doNotRetry = exemptStatusCodes
  }

  core.debug(
    `GitHub client configured with: (retries: ${retries}, retry-exempt-status-code: ${
      retryOptions.doNotRetry ?? 'octokit default: [400, 401, 403, 404, 422]'
    })`
  )

  return retryOptions
}

export function parseNumberArray(listString: string): number[] {
  if (!listString) {
    return []
  }

  const split = listString.trim().split(',')
  return split.map(x => parseInt(x))
}
