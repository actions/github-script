import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {context, getOctokit} from '@actions/github'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import {retry} from '@octokit/plugin-retry'
import {callAsyncFunction} from './async-function'
import {wrapRequire} from './wrap-require'

process.on('unhandledRejection', handleError)
main().catch(handleError)

type Options = {
  log?: Console
  userAgent?: string
  previews?: string[]
  retry?: {
    doNotRetry?: number[]
    enabled?: boolean
  }
  request?: {
    retries: number
    retryAfter: number
  }
}

async function main(): Promise<void> {
  const token = core.getInput('github-token', {required: true})
  const debug = core.getInput('debug')
  const userAgent = core.getInput('user-agent')
  const previews = core.getInput('previews')
  const retries = parseInt(core.getInput('retries'))
  const retryAfter = parseInt(core.getInput('retry-after'))
  const doNotRetry = parseNumberArray(core.getInput('do-not-retry'))

  const opts: Options = {}
  if (debug === 'true') opts.log = console
  if (userAgent != null) opts.userAgent = userAgent
  if (previews != null) opts.previews = previews.split(',')

  if (retries > 0) {
    if (doNotRetry.length > 0) {
      opts.retry = {doNotRetry}
    }

    opts.request = {
      retries,
      retryAfter
    }

    core.info(
      `GitHub client configured with: (retries: ${retries}, retryAfter: ${retryAfter}, doNotRetry: ${
        doNotRetry.length == 0
          ? 'octokit default: [400, 401, 403, 404, 422]'
          : doNotRetry
      })`
    )
  } else {
    opts.retry = {
      enabled: false
    }
  }

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

function parseNumberArray(listString: string): number[] {
  if (!listString) {
    return []
  }

  const split = listString.trim().split(',')
  return split.map(x => parseInt(x))
}
