# actions/github-script

[![Integration](https://github.com/actions/github-script/actions/workflows/integration.yml/badge.svg?branch=main&event=push)](https://github.com/actions/github-script/actions/workflows/integration.yml)
[![CI](https://github.com/actions/github-script/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/actions/github-script/actions/workflows/ci.yml)
[![Licensed](https://github.com/actions/github-script/actions/workflows/licensed.yml/badge.svg?branch=main&event=push)](https://github.com/actions/github-script/actions/workflows/licensed.yml)

This action makes it easy to quickly write a script in your workflow that
uses the GitHub API and the workflow run context.

### Note

Thank you for your interest in this GitHub action, however, right now we are not taking contributions. 

We continue to focus our resources on strategic areas that help our customers be successful while making developers' lives easier. While GitHub Actions remains a key part of this vision, we are allocating resources towards other areas of Actions and are not taking contributions to this repository at this time. The GitHub public roadmap is the best place to follow along for any updates on features we’re working on and what stage they’re in.

We are taking the following steps to better direct requests related to GitHub Actions, including:

1. We will be directing questions and support requests to our [Community Discussions area](https://github.com/orgs/community/discussions/categories/actions)

2. High Priority bugs can be reported through Community Discussions or you can report these to our support team https://support.github.com/contact/bug-report.

3. Security Issues should be handled as per our [security.md](security.md)

We will still provide security updates for this project and fix major breaking changes during this time.

You are welcome to still raise bugs in this repo.

### This action 

To use this action, provide an input named `script` that contains the body of an asynchronous JavaScript function call.
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

### V8

Version 8 of this action updated the runtime to Node 24 - https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#runs-for-javascript-actions

All scripts are now run with Node 24 instead of Node 20 and are affected by any breaking changes between Node 20 and 24.

**This requires a minimum Actions Runner version of [v2.327.1](https://github.com/actions/runner/releases/tag/v2.327.1)**

### V7

Version 7 of this action updated the runtime to Node 20 - https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#runs-for-javascript-actions

All scripts are now run with Node 20 instead of Node 16 and are affected by any breaking changes between Node 16 and 20

The `previews` input now only applies to GraphQL API calls as REST API previews are no longer necessary - https://github.blog/changelog/2021-10-14-rest-api-preview-promotions/.

### V6

Version 6 of this action updated the runtime to Node 16 - https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#runs-for-javascript-actions

All scripts are now run with Node 16 instead of Node 12 and are affected by any breaking changes between Node 12 and 16.

### V5

Version 5 of this action includes the version 5 of `@actions/github` and `@octokit/plugin-rest-endpoint-methods`. As part of this update, the Octokit context available via `github` no longer has REST methods directly. These methods are available via `github.rest.*` - https://github.com/octokit/plugin-rest-endpoint-methods.js/releases/tag/v5.0.0

For example, `github.issues.createComment` in V4 becomes `github.rest.issues.createComment` in V5

`github.request`, `github.paginate`, and `github.graphql` are unchanged.

## Development

See [development.md](/docs/development.md).

## Passing inputs to the script

Actions expressions are evaluated before the `script` is passed to the action, so the result of any expressions
*will be evaluated as JavaScript code*.

It's highly recommended to *not* evaluate expressions directly in the `script` to avoid
[script injections](https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections)
and potential `SyntaxError`s when the expression is not valid JavaScript code (particularly when it comes to improperly escaped strings).

To pass inputs, set `env` vars on the action step and reference them in your script with `process.env`:

```yaml
- uses: actions/github-script@v8
  env:
    TITLE: ${{ github.event.pull_request.title }}
  with:
    script: |
      const title = process.env.TITLE;
      if (title.startsWith('octocat')) {
        console.log("PR title starts with 'octocat'");
      } else {
        console.error("PR title did not start with 'octocat'");
      }
```

## Reading step results

The return value of the script will be in the step's outputs under the
"result" key.

```yaml
- uses: actions/github-script@v8
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
- uses: actions/github-script@v8
  id: my-script
  with:
    result-encoding: string
    script: return "I will be string (not JSON) encoded!"
```

## Retries

By default, requests made with the `github` instance will not be retried. You can configure this with the `retries` option:

```yaml
- uses: actions/github-script@v8
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
- uses: actions/github-script@v8
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
  uses: actions/github-script@v8
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
      - uses: actions/github-script@v8
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
      - uses: actions/github-script@v8
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
      - uses: actions/github-script@v8
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

                Please make sure you've read our [contributing guide](CONTRIBUTING.md) and we look forward to reviewing your Pull request shortly ✨`
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
      - uses: actions/github-script@v8
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
      - uses: actions/github-script@v8
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
      - uses: actions/checkout@v4
      - uses: actions/github-script@v8
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
      - uses: actions/checkout@v4
      - uses: actions/github-script@v8
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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      # or one-off:
      - run: npm install execa
      - uses: actions/github-script@v8
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
      - uses: actions/checkout@v4
      - uses: actions/github-script@v8
        with:
          script: |
            const { default: printStuff } = await import('${{ github.workspace }}/src/print-stuff.js')

            await printStuff()
```

### Use scripts with jsDoc support

If you want type support for your scripts, you could use the command below to install the
`@actions/github-script` type declaration.
```sh
$ npm i -D @actions/github-script@github:actions/github-script
```

And then add the `jsDoc` declaration to your script like this:
```js
// @ts-check
/** @param {import('@actions/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export default async ({ core, context }) => {
  core.debug("Running something at the moment");
  return context.actor;
};
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
      - uses: actions/github-script@v8
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

### Using exec package

The provided [@actions/exec](https://github.com/actions/toolkit/tree/main/packages/exec) package allows to execute command or tools in a cross platform way:

```yaml
on: push

jobs:
  use-exec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/github-script@v8
        with:
          script: |
            const exitCode = await exec.exec('echo', ['hello'])

            console.log(exitCode)
```

`exec` packages provides `getExecOutput` function to retrieve stdout and stderr from executed command:

```yaml
on: push

jobs:
  use-get-exec-output:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/github-script@v8
        with:
          script: |
            const {
              exitCode,
              stdout,
              stderr
            } = await exec.getExecOutput('echo', ['hello']);

            console.log(exitCode, stdout, stderr)
```      
