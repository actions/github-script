# github-script ![.github/workflows/integration.yml](https://github.com/actions/github-script/workflows/.github/workflows/integration.yml/badge.svg?event=push) ![.github/workflows/ci.yml](https://github.com/actions/github-script/workflows/.github/workflows/ci.yml/badge.svg?event=push)

This action makes it easy to quickly write a script in your workflow that
uses the GitHub API and the workflow run context.

In order to use this action, a `script` input is provided. The value of that
input should be the body of an asynchronous function call. Two arguments will
be provided:

- `github` A pre-authenticated
  [octokit/rest.js](https://github.com/octokit/rest.js) client
- `context` An object containing the [context of the workflow
  run](https://github.com/actions/toolkit/tree/master/packages/github)

Since the `script` is just a function body, these values will already be
defined, so you don't have to (see examples below).

See [octokit/rest.js](https://octokit.github.io/rest.js/) for the API client
documentation.

**Note** This action is still a bit of an experiment—the API may change in
*future versions. 🙂

## Development

See [development.md](/docs/development.md).

## Examples

Note that `github-token` is optional in this action, and the input is there
in case you need to use a non-default token.

By default, github-script will use the token provided to your workflow.

### Comment on an issue

```yaml
on:
  issues: {types: opened}

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@0.6.0
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
  issues: {types: opened}

jobs:
  apply-label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@0.6.0
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
      - uses: actions/github-script@0.6.0
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
on:
  pull_request

jobs:
  diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@0.6.0
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            const diff_url = context.payload.pull_request.diff_url
            const result = await github.request(diff_url)
            console.log(result)
```

This will print the full diff object in the screen; `result.data` will
contain the actual diff text.

### Result encoding

By default, the JSON-encoded return value of the function is set as the "result" in the
output of a github-script step. For some workflows, string encoding is preferred. This option can be set using the
`result-encoding` input:


```yaml
- uses: actions/github-script@0.6.0
  with:
    github-token: ${{secrets.GITHUB_TOKEN}}
    result-encoding: string
    script: |
      return "I will be string (not JSON) encoded!"
```
