import * as VM from 'node:vm'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import {ModuleKind, ScriptTarget, transpileModule} from 'typescript'

import {callAsyncFunction} from './async-function'

export enum SupportedLanguage {
  cjs = 'cjs',
  cts = 'cts',
  mts = 'mts'
}

interface CommonContext {
  context: Context
  core: typeof core
  github: InstanceType<typeof GitHub>
  exec: typeof exec
  glob: typeof glob
  io: typeof io
}

interface CjsContext extends CommonContext {
  require: NodeRequire
  __original_require__: NodeRequire
}

export async function interpretScript<T>(
  language: SupportedLanguage,
  context: CjsContext,
  script: string
): Promise<() => Promise<T>> {
  switch (language) {
    case SupportedLanguage.cjs:
      return async () => callAsyncFunction(context, script)
    case SupportedLanguage.cts:
    case SupportedLanguage.mts: {
      const fileName = `github-script.${language}`

      const compilerResult = transpileModule(script, {
        compilerOptions: {
          module: ModuleKind.CommonJS, // Take the incoming TypeScript and compile it to CommonJS to run in the CommonJS environment of this action.
          target: ScriptTarget.Latest,
          strict: true
        },
        fileName
      })

      return async () => {
        const runContext: CjsContext & Record<string, unknown> = {
          module: {exports: {}},
          exports: {},
          process,
          ...context
        }
        const runResult = VM.runInNewContext(
          compilerResult.outputText,
          runContext
        )

        return runResult
      }
    }
  }
}
