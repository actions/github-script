import * as path from 'node:path'
import * as os from 'node:os'
import * as fs from 'node:fs'
import {callScriptFile, resolveScriptFilePath} from '../src/script-file'

const fullArgs = {
  github: {},
  octokit: {},
  getOctokit: () => null,
  context: {},
  core: {},
  exec: {},
  glob: {},
  io: {},
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require: require,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  __original_require__: require
}

describe('resolveScriptFilePath', () => {
  test('rejects file:// protocol', () => {
    expect(() => resolveScriptFilePath('file:///some/path.js')).toThrow(
      '"script-file" must not use the "file://" protocol'
    )
  })

  test('returns absolute path as-is', () => {
    const abs = '/absolute/path/to/script.js'
    expect(resolveScriptFilePath(abs)).toEqual(abs)
  })

  test('resolves relative path against GITHUB_WORKSPACE when set', () => {
    const original = process.env['GITHUB_WORKSPACE']
    process.env['GITHUB_WORKSPACE'] = '/workspace'
    try {
      expect(resolveScriptFilePath('scripts/run.js')).toEqual(
        '/workspace/scripts/run.js'
      )
    } finally {
      if (original === undefined) {
        delete process.env['GITHUB_WORKSPACE']
      } else {
        process.env['GITHUB_WORKSPACE'] = original
      }
    }
  })
})

describe('callScriptFile', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-script-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, {recursive: true, force: true})
  })

  test('calls the exported function with args', async () => {
    const scriptPath = path.join(tmpDir, 'script.js')
    fs.writeFileSync(
      scriptPath,
      'module.exports = async ({core}) => core.value'
    )

    const result = await callScriptFile(
      {...fullArgs, core: {value: 42}} as never,
      scriptPath,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require
    )

    expect(result).toEqual(42)
  })

  test('forwards all injected args to the exported function', async () => {
    const scriptPath = path.join(tmpDir, 'all-args.js')
    fs.writeFileSync(
      scriptPath,
      `module.exports = async (args) => Object.keys(args).sort()`
    )

    const result = await callScriptFile(
      fullArgs as never,
      scriptPath,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require
    )

    expect(result).toEqual(Object.keys(fullArgs).sort())
  })

  test('throws when file does not export a function', async () => {
    const scriptPath = path.join(tmpDir, 'not-a-fn.js')
    fs.writeFileSync(scriptPath, 'module.exports = 42')

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      callScriptFile(fullArgs as never, scriptPath, require)
    ).rejects.toThrow('"script-file" must export a function, got number')
  })

  test('throws when file does not exist', async () => {
    const scriptPath = path.join(tmpDir, 'nonexistent.js')

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      callScriptFile(fullArgs as never, scriptPath, require)
    ).rejects.toThrow()
  })

  test('propagates rejection from the exported function', async () => {
    const scriptPath = path.join(tmpDir, 'throws.js')
    fs.writeFileSync(
      scriptPath,
      "module.exports = async () => { throw new Error('boom') }"
    )

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      callScriptFile(fullArgs as never, scriptPath, require)
    ).rejects.toThrow('boom')
  })

  test('rejects file:// path before loading', async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      callScriptFile(fullArgs as never, 'file:///some/path.js', require)
    ).rejects.toThrow('"script-file" must not use the "file://" protocol')
  })
})
