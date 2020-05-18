import * as core from '@actions/core'
import {context, GitHub} from '@actions/github'
import * as fs from 'fs'
import * as path from 'path'
import {callAsyncFunction} from './async-function'

process.on('unhandledRejection', handleError)
main().catch(handleError)

type Options = {
  log?: Console
  userAgent?: string
  previews?: string[]
}

async function main(): Promise<void> {
  const token = core.getInput('github-token', {required: true})
  const debug = core.getInput('debug')
  const userAgent = core.getInput('user-agent')
  const previews = core.getInput('previews')

  const opts: Options = {}
  if (debug === 'true') opts.log = console
  if (userAgent != null) opts.userAgent = userAgent
  if (previews != null) opts.previews = previews.split(',')

  const github = new GitHub(token, opts)
  const script = getScript()

  // Using property/value shorthand on `require` (e.g. `{require}`) causes compilation errors.
  const result = await callAsyncFunction(
    {require: require, github, context, core},
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

function getScript(): string {
  const script = core.getInput('script')
  const filePath = core.getInput('file')

  if (script && filePath) {
    core.setFailed('A script and a file were provided; only one is allowed')
    process.exit(1)
  }

  if (!(script || filePath)) {
    core.setFailed('Neither a script nor a file were provided')
    process.exit(1)
  }

  if (filePath) {
    return fs.readFileSync(path.resolve(filePath)).toString('utf-8')
  }

  return script
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleError(err: any): void {
  console.error(err)
  core.setFailed(`Unhandled error: ${err}`)
}
