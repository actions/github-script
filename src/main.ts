import * as core from '@actions/core'
import {context, GitHub} from '@actions/github'
import {callAsyncFunction} from './async-function'

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main() {
  const token = core.getInput('github-token', {required: true})
  const debug = core.getInput('debug')
  const userAgent = core.getInput('user-agent')
  const previews = core.getInput('previews')
  const opts: {[key: string]: any} = {}
  if (debug === 'true') opts.log = console
  if (userAgent != null) opts.userAgent = userAgent
  if (previews != null) opts.previews = previews.split(',')
  const github = new GitHub(token, opts)
  const script = core.getInput('script', {required: true})

  // Using property/value shorthand on `require` (e.g. `{require}`) causes compilatin errors.
  const result = await callAsyncFunction(
    {require: require, github, context},
    script
  )
  console.log('test result', result)

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

function handleError(err: any) {
  console.error(err)

  if (err && err.message) {
    core.setFailed(err.message)
  } else {
    core.setFailed(`Unhandled error: ${err}`)
  }
}
