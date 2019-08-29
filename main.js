const core = require('@actions/core')
const {GitHub, context} = require('@actions/github')

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main() {
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
  const script = core.getInput('script', {required: true})
  const token = core.getInput('github-token', {required: true})
  const fn = new AsyncFunction('github', 'context', script)
  const client = new GitHub(token)
  const result = await fn(client, context)
  core.setOutput('result', JSON.stringify(result))
}

function handleError(err) {
  console.error(err)
  core.setFailed(err.message)
}
