const core = require('@actions/core')
const {GitHub, context} = require('@actions/github')

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main() {
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
  const token = core.getInput('github-token', {required: true})
  const debug = core.getInput('debug')
  const userAgent = core.getInput('user-agent')
  const previews = core.getInput('previews')
  const opts = {}
  if (debug === 'true') opts.log = console
  if (userAgent != null) opts.userAgent = userAgent
  if (previews != null) opts.previews = previews.split(',')
  const client = new GitHub(token, opts)
  const script = core.getInput('script', {required: true})
  const fn = new AsyncFunction('require', 'github', 'context', script)
  const result = await fn(require, client, context)

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

function handleError(err) {
  console.error(err)
  core.setFailed(err.message)
}
