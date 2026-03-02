import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import * as glob from '@actions/glob'
import * as io from '@actions/io'

const AsyncFunction = Object.getPrototypeOf(async () => null).constructor

export declare type AsyncFunctionArguments = {
  context: Context
  core: typeof core
  github: InstanceType<typeof GitHub>
  octokit: InstanceType<typeof GitHub>
  exec: typeof exec
  glob: typeof glob
  io: typeof io
  require: NodeRequire
  __original_require__: NodeRequire
}

export function callAsyncFunction<T>(
  args: AsyncFunctionArguments,
  source: string
): Promise<T> {
  const fn = new AsyncFunction(...Object.keys(args), source)
  return fn(...Object.values(args))
}
