import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {validateWorkingDirectory} from '../src/working-directory'

describe('validateWorkingDirectory', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-script-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, {recursive: true, force: true})
  })

  test('returns resolved path for existing directory', () => {
    const result = validateWorkingDirectory(tmpDir)
    expect(result).toBe(tmpDir)
  })

  test('resolves relative paths', () => {
    const result = validateWorkingDirectory(tmpDir)
    expect(path.isAbsolute(result)).toBe(true)
  })

  test('throws for non-existent directory', () => {
    const nonExistent = path.join(tmpDir, 'does-not-exist')
    expect(() => validateWorkingDirectory(nonExistent)).toThrow(
      /does not exist/
    )
    expect(() => validateWorkingDirectory(nonExistent)).toThrow(nonExistent)
  })

  test('throws for file path instead of directory', () => {
    const filePath = path.join(tmpDir, 'file.txt')
    fs.writeFileSync(filePath, 'content')
    expect(() => validateWorkingDirectory(filePath)).toThrow(
      /is not a directory/
    )
    expect(() => validateWorkingDirectory(filePath)).toThrow(filePath)
  })
})
