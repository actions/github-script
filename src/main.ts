import * as core from '@actions/core'
import {context, GitHub} from '@actions/github'
import * as vm from 'vm'

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
  const fn = wrapFunction(script)

  const result = await vm.runInNewContext(
    fn,
    {
      github,
      console,
      context,
      actions: {core},
      require: require // Otherwise, the build step will compile this incorrectly.
    },
    {
      lineOffset: -1
    }
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

function wrapFunction(fn: string) {
  return `(async function() {
${fn}
  })()`
}

function handleError(err: any) {
  console.error(err)

  if (err && err.message) {
    core.setFailed(err.message)
  } else {
    core.setFailed(`Unhandled error: ${err}`)
  }
}
