# Development

## How this action works

This action works by evaluating the user input as the body of an asynchronous
JavaScript function. See [main.ts](/src/main.ts) for details.

## Building

Before the action can be used, it needs to be compiled to JavaScript:

```shell
bash> npm run build
```

It also has a pre-commit hook configured via
[husky](https://www.npmjs.com/package/husky) that should run the build script
before each commit. Additionally, this hook formats code and lints it, as
well.

## Releasing

Releases are done manually, for now:

1. Ensure that the build is up to date with `npm run build`. It's also good to ensure you have the correct dependencies installed by running `npm install` before you build.
1. Bump the [package.json](/package.json#L3) and [package-lock.json](/package-lock.json#L3) version numbers and commit them. I like to do this with `npm version {major,minor,patch} --no-git-tag-version`. This will bump the version numbers but let you manually commit and tag, yourself.
1. Update documentation (including updated version numbers).
1. Tag main with the new version number and create a GitHub release. Make sure you also force-create and force-push tags for minor and patch updates. For example, when creating v5.2.0 (a minor bump), you want to create (or update) `v5`, `v5.2`, and `v5.2.0`.
