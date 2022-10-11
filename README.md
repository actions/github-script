# actions/github-script

[![.github/workflows/integration.yml](https://github.com/actions/github-script/workflows/Integration/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3AIntegration+branch%3Amain+event%3Apush)
[![.github/workflows/ci.yml](https://github.com/actions/github-script/workflows/CI/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3ACI+branch%3Amain+event%3Apush)
[![.github/workflows/licensed.yml](https://github.com/actions/github-script/workflows/Licensed/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3ALicensed+branch%3Amain+event%3Apush)

This action makes it easy to quickly write a script in your workflow that
uses the GitHub API and the workflow run context.

To use this action, provide an input named `script` that contains the body of an asynchronous function call.
The following arguments will be provided:

- `github` A pre-authenticated
  [octokit/rest.js](https://octokit.github.io/rest.js) client with pagination plugins
- `context` An object containing the [context of the workflow
  run](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts)
- `core` A reference to the [@actions/core](https://github.com/actions/toolkit/tree/main/packages/core) package
- `glob` A reference to the [@actions/glob](https://github.com/actions/toolkit/tree/main/packages/glob) package
- `io` A reference to the [@actions/io](https://github.com/actions/toolkit/tree/main/packages/io) package
- `exec` A reference to the [@actions/exec](https://github.com/actions/toolkit/tree/main/packages/exec) package
- `require` A proxy wrapper around the normal Node.js `require` to enable
  requiring relative paths (relative to the current working directory) and
  requiring npm packages installed in the current working directory. If for
  some reason you need the non-wrapped `require`, there is an escape hatch
  available: `__original_require__` is the original value of `require` without
  our wrapping applied.

Since the `script` is just a function body, these values will already be
defined, so you don't have to import them (see examples below).

See [octokit/rest.js](https://octokit.github.io/rest.js/) for the API client
documentation.

## Breaking Changes

### Breaking changes in V6

Version 6 of this action updated the runtime to Node 16 - https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#example-using-nodejs-v16

All scripts are now run with Node 16 instead of Node 12 and are affected by any breaking changes between Node 12 and 16.

### Breaking changes in V5

Version 5 of this action includes the version 5 of `@actions/github` and `@octokit/plugin-rest-endpoint-methods`. As part of this update, the Octokit context available via `github` no longer has REST methods directly. These methods are available via `github.rest.*` - https://github.com/octokit/plugin-rest-endpoint-methods.js/releases/tag/v5.0.0

For example, `github.issues.createComment` in V4 becomes `github.rest.issues.createComment` in V5

`github.request`, `github.paginate`, and `github.graphql` are unchanged.

## Development

See [development.md](/docs/development.md).

## Reading step results

The return value of the script will be in the step's outputs under the
"result" key.

```yaml
- uses: actions/github-script@v6
  id: set-result
  with:
    script: return "Hello!"
    result-encoding: string
- name: Get result
  run: echo "${{steps.set-result.outputs.result}}"
```

See ["Result encoding"](#result-encoding) for details on how the encoding of
these outputs can be changed.

## Result encoding

By default, the JSON-encoded return value of the function is set as the "result" in the
output of a github-script step. For some workflows, string encoding is preferred. This option can be set using the
`result-encoding` input:

```yaml
- uses: actions/github-script@v6
  id: my-script
  with:
    result-encoding: string
    script: return "I will be string (not JSON) encoded!"
```

## Retries

By default, requests made with the `github` instance will not be retried. You can configure this with the `retries` option:

```yaml
- uses: actions/github-script@v6
  id: my-script
  with:
    result-encoding: string
    retries: 3
    script: |
      github.rest.issues.get({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
      })
```

In this example, request failures from `github.rest.issues.get()` will be retried up to 3 times.

You can also configure which status codes should be exempt from retries via the `retry-exempt-status-codes` option:

```yaml
- uses: actions/github-script@v6
  id: my-script
  with:
    result-encoding: string
    retries: 3
    retry-exempt-status-codes: 400,401
    script: |
      github.rest.issues.get({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
      })
```

By default, the following status codes will not be retried: `400, 401, 403, 404, 422` [(source)](https://github.com/octokit/plugin-retry.js/blob/9a2443746c350b3beedec35cf26e197ea318a261/src/index.ts#L14).

These retries are implemented using the [octokit/plugin-retry.js](https://github.com/octokit/plugin-retry.js) plugin. The retries use [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) to space out retries. ([source](https://github.com/octokit/plugin-retry.js/blob/9a2443746c350b3beedec35cf26e197ea318a261/src/error-request.ts#L13))

## Examples

Note that `github-token` is optional in this action, and the input is there
in case you need to use a non-default token.

By default, github-script will use the token provided to your workflow.

### Print the available attributes of context

```yaml
- name: View context attributes
  uses: actions/github-script@v6
  with:
    script: console.log(context)
```

### Comment on an issue

```yaml
on:
  issues:
    types: [opened]

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '👋 Thanks for reporting!'
            })
```

### Apply a label to an issue

```yaml
on:
  issues:
    types: [opened]

jobs:
  apply-label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.addLabels({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: ['Triage']
            })
```

### Welcome a first-time contributor

You can format text in comments using the same [Markdown syntax](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) as the GitHub web interface:

```yaml
on: pull_request_target

jobs:
  welcome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            // Get a list of all issues created by the PR opener
            // See: https://octokit.github.io/rest.js/#pagination
            const creator = context.payload.sender.login
            const opts = github.rest.issues.listForRepo.endpoint.merge({
              ...context.issue,
              creator,
              state: 'all'
            })
            const issues = await github.paginate(opts)

            for (const issue of issues) {
              if (issue.number === context.issue.number) {
                continue
              }

              if (issue.pull_request) {
                return // Creator is already a contributor.
              }
            }

            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `**Welcome**, new contributor!

                Please make sure you're read our [contributing guide](CONTRIBUTING.md) and we look forward to reviewing your Pull request shortly ✨`
            })
```

### Download data from a URL

You can use the `github` object to access the Octokit API. For
instance, `github.request`

```yaml
on: pull_request

jobs:
  diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            const diff_url = context.payload.pull_request.diff_url
            const result = await github.request(diff_url)
            console.log(result)
```

_(Note that this particular example only works for a public URL, where the
diff URL is publicly accessible. Getting the diff for a private URL requires
using the API.)_

This will print the full diff object in the screen; `result.data` will
contain the actual diff text.

### Run custom GraphQL queries

You can use the `github.graphql` object to run custom GraphQL queries against the GitHub API.

```yaml
jobs:
  list-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            const query = `query($owner:String!, $name:String!, $label:String!) {
              repository(owner:$owner, name:$name){
                issues(first:100, labels: [$label]) {
                  nodes {
                    id
                  }
                }
              }
            }`;
            const variables = {
              owner: context.repo.owner,
              name: context.repo.repo,
              label: 'wontfix'
            }
            const result = await github.graphql(query, variables)
            console.log(result)
```

### Run a separate file

If you don't want to inline your entire script that you want to run, you can
use a separate JavaScript module in your repository like so:

```yaml
on: push

jobs:
  echo-input:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/github-script@v6
        with:
          script: |
            const script = require('./path/to/script.js')
            console.log(script({github, context}))
```

And then export a function from your module:

```javascript
module.exports = ({github, context}) => {
  return context.payload.client_payload.value
}
```

Note that because you can't `require` things like the GitHub context or
Actions Toolkit libraries, you'll want to pass them as arguments to your
external function.

Additionally, you'll want to use the [checkout
action](https://github.com/actions/checkout) to make sure your script file is
available.

### Run a separate file with an async function

You can also use async functions in this manner, as long as you `await` it in
the inline script.

In your workflow:

```yaml
on: push

jobs:
  echo-input:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/github-script@v6
        env:
          SHA: '${{env.parentSHA}}'
        with:
          script: |
            const script = require('./path/to/script.js')
            await script({github, context, core})
```

And then export an async function from your module:

```javascript
module.exports = async ({github, context, core}) => {
  const {SHA} = process.env
  const commit = await github.rest.repos.getCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: `${SHA}`
  })
  core.exportVariable('author', commit.data.commit.author.email)
}
```

### Use npm packages

Like importing your own files above, you can also use installed modules.
Note that this is achieved with a wrapper on top `require`, so if you're
trying to require a module inside your own file, you might need to import
it externally or pass the `require` wrapper to your file:

```yaml
on: push

jobs:
  echo-input:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 14
      - run: npm ci
      # or one-off:
      - run: npm install execa
      - uses: actions/github-script@v6
        with:
          script: |
            const execa = require('execa')

            const { stdout } = await execa('echo', ['hello', 'world'])

            console.log(stdout)
```

### Use ESM `import`

To import an ESM file, you'll need to reference your script by an absolute path and ensure you have a `package.json` file with `"type": "module"` specified.

For a script in your repository `src/print-stuff.js`:

```js
export default function printStuff() {
  console.log('stuff')
}
```

```yaml
on: push

jobs:
  print-stuff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/github-script@v6
        with:
          script: |
            const { default: printStuff } = await import('${{ github.workspace }}/src/print-stuff.js')

            await printStuff()
```

### Use env as input

You can set env vars to use them in your script:

```yaml
on: push

jobs:
  echo-input:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        env:
          FIRST_NAME: Mona
          LAST_NAME: Octocat
        with:
          script: |
            const { FIRST_NAME, LAST_NAME } = process.env

            console.log(`Hello ${FIRST_NAME} ${LAST_NAME}`)
```

### Using a separate GitHub token

The `GITHUB_TOKEN` used by default is scoped to the current repository, see [Authentication in a workflow](https://docs.github.com/actions/reference/authentication-in-a-workflow).

If you need access to a different repository or an API that the `GITHUB_TOKEN` doesn't have permissions to, you can provide your own [PAT](https://help.github.com/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) as a secret using the `github-token` input.

[Learn more about creating and using encrypted secrets](https://docs.github.com/actions/reference/encrypted-secrets)

```yaml
on:
  issues:
    types: [opened]

jobs:
  apply-label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.MY_PAT }}
          script: |
            github.rest.issues.addLabels({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: ['Triage']
            })
```
