## Alternative setup

### Example repository structure
In this example we're using the repo structure below, but you are free
to structure it how ever you like. 
```
root # Your repository
 ├── .github
 │   ├── ...
 │   └── workflows
 │       ├── ...
 │       └── ci-workflow.yml
 ├── ...
 ├── actions
 │  ├── action.yml    (optional)
 │  └── ci-test.js
 ├── ...
 └── package.json
```

### 1. Install the github-script type
```sh
$ npm i -D @types/github-script@github:actions/github-script
```


### 2. Create `ci-test.mjs` file
```js
// @ts-check
/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export default async ({ core, context }) => {
  core.debug("Running something at the moment");
  return context.actor;
};
```

### 3. Create `ci-workflow.yml` file
```yml
on: push

permissions:
  pull-requests: read
  contents: read

jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
          
      - run: npm ci
      - uses: actions/github-script@v6
          with:
            github-token: ${{ secrets.GITHUB_TOKEN }}
            result-encoding: string
            script: |
              const { default: script } = await import('${{ github.workspace }}/actions/ci-test.js');
              return await script({ github, context, core, exec, glob, io, fetch, __original_require__ });
```


## Cleaner setup (Optional)

Note that the `ci-workflow.yml` example above can be kind of tedious once you add more of them. So
to address this, one could instead use `composite` actions.
### The `action.yml` file
```yml
name: Typed GitHub Script
author: GitHub
description: Run simple scripts using the GitHub client
branding:
  color: blue
  icon: code
inputs:
  script:
    description: The path to script (e.g actions/ci-test.js)
    required: true
  github-token:
    description: The GitHub token used to create an authenticated client
    default: ${{ github.token }}
    required: false
  debug:
    description: Whether to tell the GitHub client to log details of its requests. true or false. Default is to run in debug mode when the GitHub Actions step debug logging is turned on.
    default: ${{ runner.debug == '1' }}
  user-agent:
    description: An optional user-agent string
    default: actions/github-script
  previews:
    description: A comma-separated list of API previews to accept
  result-encoding:
    description: Either "string" or "json" (default "json")—how the result will be encoded
    default: json
  retries:
    description: The number of times to retry a request
    default: "0"
  retry-exempt-status-codes:
    description: A comma separated list of status codes that will NOT be retried e.g. "400,500". No effect unless `retries` is set
    default: 400,401,403,404,422 # from https://github.com/octokit/plugin-retry.js/blob/9a2443746c350b3beedec35cf26e197ea318a261/src/index.ts#L14

outputs:
  result:
    description: The return value of the script, stringified with `JSON.stringify`
    value: ${{ steps.github-script-result.outputs.result }}

runs:
  using: "composite"
  steps:
    - uses: actions/github-script@v6
      id: github-script-result
      with:
        github-token: ${{ inputs.github-token }}
        result-encoding: ${{ inputs.result-encoding }}
        debug: ${{ inputs.debug }}
        user-agent: ${{ inputs.user-agent }}
        previews: ${{ inputs.previews }}
        retries: ${{ inputs.retries }}
        retry-exempt-status-codes: ${{ inputs.retry-exempt-status-codes }}
        script: |
          const { default: script } = await import(process.env.GITHUB_ACTION_PATH + '/${{ inputs.script }}');
          return await script({ github, context, core, exec, glob, io, fetch, __original_require__ });
```


### The `ci-workflow.yml` file
Note that we only need to specify the script here because the path will be 
resolved to the `uses: ./actions` path by `process.env.GITHUB_ACTION_PATH`.
i.e the same folder as we are executing the action from.
```yml
on: push

permissions:
  pull-requests: read
  contents: read

jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
          
      - run: npm ci
      - uses: ./actions
          with:
            github-token: ${{ secrets.GITHUB_TOKEN }}
            result-encoding: string
            script: ci-test.js
```

