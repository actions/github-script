import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {context, getOctokit} from '@actions/github'
import {defaults as defaultGitHubOptions} from '@actions/github/lib/utils'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import {requestLog} from '@octokit/plugin-request-log'
import {retry} from '@octokit/plugin-retry'
import {RequestRequestOptions} from '@octokit/types'
import {callAsyncFunction} from './async-function'
import {RetryOptions, getRetryOptions, parseNumberArray} from './retry-options'
import {wrapRequire} from './wrap-require'

process.on('unhandledRejection', handleError)
main().catch(handleError)

type Options = {
  log?: Console
  userAgent?: string
  baseUrl?: string
  previews?: string[]
  retry?: RetryOptions
  request?: RequestRequestOptions
}

async function main(): Promise<void> {
  const token = core.getInput('github-token', {required: true})
  const debug = core.getBooleanInput('debug')
  const userAgent = core.getInput('user-agent')
  const previews = core.getInput('previews')
  const baseUrl = core.getInput('base-url')
  const retries = parseInt(core.getInput('retries'))
  const exemptStatusCodes = parseNumberArray(
    core.getInput('retry-exempt-status-codes')
  )
  const [retryOpts, requestOpts] = getRetryOptions(
    retries,
    exemptStatusCodes,
    defaultGitHubOptions
  )

  const baseUserAgent = userAgent || 'actions/github-script'
  const finalUserAgent = getUserAgentWithOrchestrationId(baseUserAgent)

  const opts: Options = {
    log: debug ? console : undefined,
    userAgent: finalUserAgent,
    previews: previews ? previews.split(',') : undefined,
    retry: retryOpts,
    request: requestOpts
  }

  // Setting `baseUrl` to undefined will prevent the default value from being used
  // https://github.com/actions/github-script/issues/436
  if (baseUrl) {
    opts.baseUrl = baseUrl
  }

  const github = getOctokit(token, opts, retry, requestLog)
  const script = core.getInput('script', {required: true})

  // Using property/value shorthand on `require` (e.g. `{require}`) causes compilation errors.
  const result = await callAsyncFunction(
    {
      require: wrapRequire,
      __original_require__: __non_webpack_require__,
      github,
      octokit: github,
      context,
      core,
      exec,
      glob,
      io
    },
    script
  )

  let encoding = core.getInput('result-encoding')
  encoding = encoding ? encoding : 'json'

  let output

  switch (encoding) {
    case 'json':
      output = JSON.stringify(result)
      break
    case 'string':
      output = String(result)
      break
    default:
      throw new Error('"result-encoding" must be either "string" or "json"')
  }

  core.setOutput('result', output)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleError(err: any): void {
  console.error(err)
  core.setFailed(`Unhandled error: ${err}`)
}

/**
 * Gets the user agent string with orchestration ID appended if available
 * @param userAgent The base user agent string
 * @returns The user agent string with orchestration ID appended if ACTIONS_ORCHESTRATION_ID is set
 */
function getUserAgentWithOrchestrationId(userAgent: string): string {
  const orchestrationId = process.env['ACTIONS_ORCHESTRATION_ID']
  if (!orchestrationId) {
    return userAgent
  }

  // Sanitize orchestration ID - replace invalid characters with underscore
  const sanitized = orchestrationId.replace(/[^a-zA-Z0-9._-]/g, '_')

  return `${userAgent} actions_orchestration_id/${sanitized}`
}
