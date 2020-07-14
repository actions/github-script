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

1. Ensure that the build is up to date with `npm run build`.
1. Bump the [package.json](/package.json#L3) and [package-lock.json](/package-lock.json#L3) version numbers and commit them.
1. Update documentation (including updated version numbers).
1. Tag main with the new version number and create a GitHub release.
