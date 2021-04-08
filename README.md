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
  [octokit/core.js](https://github.com/octokit/core.js#readme) client with REST endpoints and pagination plugins
- `context` An object containing the [context of the workflow
  run](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts)
- `core` A reference to the [@actions/core](https://github.com/actions/toolkit/tree/main/packages/core) package
- `glob` A reference to the [@actions/glob](https://github.com/actions/toolkit/tree/main/packages/glob) package
- `io` A reference to the [@actions/io](https://github.com/actions/toolkit/tree/main/packages/io) package

Since the `script` is just a function body, these values will already be
defined, so you don't have to (see examples below).

See [octokit/rest.js](https://octokit.github.io/rest.js/) for the API client
documentation.

**Note** This action is still a bit of an experiment—the API may change in
future versions. 🙂

## Development

See [development.md](/docs/development.md).

## Reading step results

The return value of the script will be in the step's outputs under the
"result" key.

```yaml
- uses: actions/github-script@v3
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
- uses: actions/github-script@v3
  id: my-script
  with:
    github-token: ${{secrets.GITHUB_TOKEN}}
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
  uses: actions/github-script@v3
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
      - uses: actions/github-script@v3
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            github.issues.createComment({
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
      - uses: actions/github-script@v3
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            github.issues.addLabels({
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
      - uses: actions/github-script@v3
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            // Get a list of all issues created by the PR opener
            // See: https://octokit.github.io/rest.js/#pagination
            const creator = context.payload.sender.login
            const opts = github.issues.listForRepo.endpoint.merge({
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

            await github.issues.createComment({
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
      - uses: actions/github-script@v3
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
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
      - uses: actions/github-script@v3
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
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
      - uses: actions/github-script@v3
        with:
          script: |
            const script = require(`./path/to/script.js`)
            console.log(script({github, context}))
```

The script will be run within the [`GITHUB_WORKSPACE`](https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables#default-environment-variables)
directory.

And then export a function from your module:

```javascript
module.exports = ({github, context}) => {
  return context.payload.client_payload.value
}
```

You can also use async functions in this manner, as long as you `await` it in
the inline script.

Note that because you can't `require` things like the GitHub context or
Actions Toolkit libraries, you'll want to pass them as arguments to your
external function.

Additionally, you'll want to use the [checkout
action](https://github.com/actions/checkout) to make sure your script file is
available.

### Use npm packages

Like importing your own files above, you can also use installed modules:

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
      - uses: actions/github-script@v3
        with:
          script: |
            const execa = require(`${process.env.GITHUB_WORKSPACE}/node_modules/execa`)

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
      - uses: actions/github-script@v3
        env:
          FIRST_NAME: Mona
          LAST_NAME: Octocat
        with:
          script: |
            const { FIRST_NAME, LAST_NAME } = process.env

            console.log(`Hello ${FIRST_NAME} ${LAST_NAME}`)
```
