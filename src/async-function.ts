import * as core from '@actions/core'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import * as glob from '@actions/glob'
import * as io from '@actions/io'

const AsyncFunction = Object.getPrototypeOf(async () => null).constructor

type AsyncFunctionArguments = {
  context: Context
  core: typeof core
  github: InstanceType<typeof GitHub>
  glob: typeof glob
  io: typeof io
  require: NodeRequire
}

export function callAsyncFunction<T>(
  args: AsyncFunctionArguments,
  source: string
): Promise<T> {
  const previousWorkingDirectory = process.cwd()
  try {
    if (process.env.GITHUB_WORKSPACE !== undefined) {
      process.chdir(process.env.GITHUB_WORKSPACE)
    }

    const fn = new AsyncFunction(...Object.keys(args), source)
    return fn(...Object.values(args))
  } finally {
    if (previousWorkingDirectory !== process.cwd()) {
      process.chdir(previousWorkingDirectory)
    }
  }
}
