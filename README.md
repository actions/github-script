# actions/github-script

[![.github/workflows/integration.yml](https://github.com/actions/github-script/workflows/Integration/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3AIntegration+branch%3Amain+event%3Apush)
[![.github/workflows/ci.yml](https://github.com/actions/github-script/workflows/CI/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3ACI+branch%3Amain+event%3Apush)
[![.github/workflows/licensed.yml](https://github.com/actions/github-script/workflows/Licensed/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3ALicensed+branch%3Amain+event%3Apush)

This action makes it easy to quickly write a script in your workflow that
uses the GitHub API and the workflow run context.

In order to use this action, a `script` input is provided. The value of that
input should be the body of an asynchronous function call. The following
arguments will be provided:

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

## Breaking changes in V5

Version 5 of this action includes the version 5 of `@actions/github` and `@octokit/plugin-rest-endpoint-methods`. As part of this update, the Octokit context available via `github` no longer has REST methods directly. These methods are available via `github.rest.*` - https://github.com/octokit/plugin-rest-endpoint-methods.js/releases/tag/v5.0.0

For example, `github.issues.createComment` in V4 becomes `github.rest.issues.createComment` in V5

`github.request`, `github.paginate`, and `github.graphql` are unchanged.

## Development

See [development.md](/docs/development.md).

## Reading step results

The return value of the script will be in the step's outputs under the
"result" key.

```yaml
- uses: actions/github-script@v5
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
- uses: actions/github-script@v5
  id: my-script
  with:
    result-encoding: string
    script: return "I will be string (not JSON) encoded!"
```

## Examples

Note that `github-token` is optional in this action, and the input is there
in case you need to use a non-default token.

By default, github-script will use the token provided to your workflow.

### Print the available attributes of context

```yaml
- name: View context attributes
  uses: actions/github-script@v5
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
      - uses: actions/github-script@v5
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
      - uses: actions/github-script@v5
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

```yaml
on: pull_request

jobs:
  welcome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v5
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
              body: 'Welcome, new contributor!'
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
      - uses: actions/github-script@v5
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
      - uses: actions/github-script@v5
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
      - uses: actions/github-script@v5
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
      - uses: actions/github-script@v5
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
      - uses: actions/github-script@v5
        with:
          script: |
            const execa = require('execa')

            const { stdout } = await execa('echo', ['hello', 'world'])

            console.log(stdout)
```

### Use env as input

You can set env vars to use them in your script:

```yaml
on: push

jobs:
  echo-input:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v5
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
      - uses: actions/github-script@v5
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
