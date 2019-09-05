# github-script

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

## Examples

### Comment on an issue

```yaml
on:
  issue: {type: opened}

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@0.1.0
        with:
          github-token: ${{github.token}}
          script: |
            github.issues.createComment({...context.issue, body: '👋 Thanks for reporting!'})
```

### Apply a label to an issue

```yaml
on:
  issue: {type: opened}

jobs:
  apply-label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@0.1.0
        with:
          github-token: ${{github.token}}
          script: |
            github.issues.addLabels({...context.issue, labels: ['Triage']})
```

### Welcome a first-time contributor

```yaml
on: pull_request

jobs:
  welcome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@0.1.0
        with:
          github-token: ${{github.token}}
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

            await github.issues.createComment({...context.issue, body: 'Welcome, new contributor!'})
```
