import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {context, getOctokit} from '@actions/github'
import {defaults as defaultGitHubOptions} from '@actions/github/lib/utils'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import {retry} from '@octokit/plugin-retry'
import {RequestRequestOptions} from '@octokit/types'
import {callAsyncFunction} from './async-function'
import {getRetryOptions, parseNumberArray, RetryOptions} from './retry-options'
import {wrapRequire} from './wrap-require'

process.on('unhandledRejection', handleError)
main().catch(handleError)

type Options = {
  log?: Console
  userAgent?: string
  previews?: string[]
  retry?: RetryOptions
  request?: RequestRequestOptions
}

async function main(): Promise<void> {
  const token = core.getInput('github-token', {required: true})
  const debug = core.getInput('debug')
  const userAgent = core.getInput('user-agent')
  const previews = core.getInput('previews')
  const retries = parseInt(core.getInput('retries'))
  const exemptStatusCodes = parseNumberArray(
    core.getInput('retry-exempt-status-codes')
  )
  const [retryOpts, requestOpts] = getRetryOptions(
    retries,
    exemptStatusCodes,
    defaultGitHubOptions
  )

  const opts: Options = {}
  if (debug === 'true') opts.log = console
  if (userAgent != null) opts.userAgent = userAgent
  if (previews != null) opts.previews = previews.split(',')
  if (retryOpts) opts.retry = retryOpts
  if (requestOpts) opts.request = requestOpts

  const github = getOctokit(token, opts, retry)
  const script = core.getInput('script', {required: true})

  // Using property/value shorthand on `require` (e.g. `{require}`) causes compilation errors.
  const result = await callAsyncFunction(
    {
      require: wrapRequire,
      __original_require__: __non_webpack_require__,
      github,
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
