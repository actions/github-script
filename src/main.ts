import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {context} from '@actions/github'
import {
  defaults as defaultGitHubOptions,
  GitHub
} from '@actions/github/lib/utils'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import {createTokenAuth} from '@octokit/auth-token'
import {createUnauthenticatedAuth} from '@octokit/auth-unauthenticated'
import {OctokitOptions} from '@octokit/core/dist-types/types'
import {requestLog} from '@octokit/plugin-request-log'
import {retry} from '@octokit/plugin-retry'
import fetch from 'node-fetch'
import {callAsyncFunction} from './async-function'
import {getRetryOptions, parseNumberArray} from './retry-options'
import {wrapRequire} from './wrap-require'

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main(): Promise<void> {
  const allowEmptyToken = core.getBooleanInput('allow-empty-token', {
    required: true
  })
  const token = core.getInput('github-token', {required: !allowEmptyToken})
  const debug = core.getBooleanInput('debug')
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

  const opts: OctokitOptions = {
    log: debug ? console : undefined,
    userAgent: userAgent || undefined,
    previews: previews ? previews.split(',') : undefined,
    retry: retryOpts,
    request: requestOpts,
    authStrategy:
      allowEmptyToken && !token ? createUnauthenticatedAuth : createTokenAuth,
    auth:
      allowEmptyToken && !token
        ? {
            reason:
              'No github-token was provided to actions/github-scripts, and allow-empty-token is true.'
          }
        : token
  }

  const GitHubWithPlugins = GitHub.plugin(retry, requestLog)
  const github = new GitHubWithPlugins(opts)
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
      io,
      fetch
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
