import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import {Octokit} from '@octokit/action'
import {retry} from '@octokit/plugin-retry'
import {requestLog} from '@octokit/plugin-request-log'
import {callAsyncFunction} from './async-function.js'
import {Context} from './context.js'
import {getRetryOptions, parseNumberArray} from './retry-options.js'
import {wrapRequire} from './wrap-require.js'
import {OctokitOptions} from '@octokit/core'

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main(): Promise<void> {
  // @octokit/aciton will use @octokit/auth-action which automatically
  // reads the GITHUB_TOKEN input
  // We should still validate that the token is provided early though
  core.getInput('github-token', {required: true})

  const debug = core.getBooleanInput('debug')
  const userAgent = core.getInput('user-agent')
  const previews = core.getInput('previews')
  const baseUrl = core.getInput('base-url')
  const retries = parseInt(core.getInput('retries'))
  const exemptStatusCodes = parseNumberArray(
    core.getInput('retry-exempt-status-codes')
  )
  const retryOpts = getRetryOptions(retries, exemptStatusCodes)

  const opts: OctokitOptions = {
    log: debug ? console : undefined,
    userAgent: userAgent || undefined,
    previews: previews ? previews.split(',') : undefined,
    retry: retryOpts,
    request: {
      retries
    }
  }

  // Setting `baseUrl` to undefined will prevent the default value from being used
  // https://github.com/actions/github-script/issues/436
  if (baseUrl) {
    opts.baseUrl = baseUrl
  }

  const OctokitWithPlugins = Octokit.plugin(retry, requestLog)
  const octokit = new OctokitWithPlugins(opts)
  const script = core.getInput('script', {required: true})

  // Using property/value shorthand on `require` (e.g. `{require}`) causes compilation errors.
  const result = await callAsyncFunction(
    {
      require: wrapRequire,
      __original_require__: __non_webpack_require__,
      github: octokit,
      octokit,
      context: new Context(),
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
