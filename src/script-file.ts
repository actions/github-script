import * as path from 'path'
import type {AsyncFunctionArguments} from './args'

export function resolveScriptFilePath(scriptFile: string): string {
  if (scriptFile.startsWith('file://')) {
    throw new Error('"script-file" must not use the "file://" protocol')
  }

  return path.isAbsolute(scriptFile)
    ? scriptFile
    : path.resolve(process.env['GITHUB_WORKSPACE']!, scriptFile)
}

export async function callScriptFile(
  args: AsyncFunctionArguments,
  scriptFile: string,
  requireFn: NodeJS.Require
): Promise<unknown> {
  const resolvedPath = resolveScriptFilePath(scriptFile)
  const scriptFn = requireFn(resolvedPath)

  if (typeof scriptFn !== 'function') {
    throw new Error(
      `"script-file" must export a function, got ${typeof scriptFn}`
    )
  }

  return scriptFn(args)
}
