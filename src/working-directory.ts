import * as fs from 'fs'
import * as path from 'path'

/**
 * Validates that the given directory exists and is accessible.
 * @param workingDirectory - The directory path to validate
 * @returns The resolved absolute path
 * @throws Error if the directory does not exist or is not a directory
 */
export function validateWorkingDirectory(workingDirectory: string): string {
  const resolved = path.resolve(workingDirectory)

  if (!fs.existsSync(resolved)) {
    throw new Error(
      `working-directory "${workingDirectory}" does not exist (resolved to "${resolved}")`
    )
  }

  const stat = fs.statSync(resolved)
  if (!stat.isDirectory()) {
    throw new Error(
      `working-directory "${workingDirectory}" is not a directory (resolved to "${resolved}")`
    )
  }

  return resolved
}
