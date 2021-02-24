import * as core from '@actions/core'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import * as io from '@actions/io'
import * as actions from './actions'

const AsyncFunction = Object.getPrototypeOf(async () => null).constructor

type AsyncFunctionArguments = {
  actions: typeof actions
  context: Context
  core: typeof core
  github: InstanceType<typeof GitHub>
  io: typeof io
  require: NodeRequire
}

export function callAsyncFunction<T>(
  args: AsyncFunctionArguments,
  source: string
): Promise<T> {
  const fn = new AsyncFunction(...Object.keys(args), source)
  return fn(...Object.values(args))
}
