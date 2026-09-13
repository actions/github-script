/* eslint-disable @typescript-eslint/no-explicit-any */

import * as core from '@actions/core'

// `@actions/github` and the Octokit plugins are ESM-only, so the CommonJS
// Jest runtime cannot load them; stand-ins are used instead. The real
// `github.graphql.paginate` behaviour is covered by the CI workflow
// (integration.yml test-graphql-paginate job).
jest.mock(
  '@actions/github',
  () => ({context: {}, getOctokit: jest.fn(() => ({}))}),
  {virtual: true}
)
jest.mock('@actions/github/lib/utils', () => ({defaults: {}}), {virtual: true})
jest.mock('@octokit/plugin-retry', () => ({retry: jest.fn()}))
jest.mock('@octokit/plugin-request-log', () => ({requestLog: jest.fn()}))
jest.mock('@octokit/plugin-paginate-graphql', () => ({
  paginateGraphQL: jest.fn()
}))

import {getOctokit} from '@actions/github'
import {paginateGraphQL} from '@octokit/plugin-paginate-graphql'
import {requestLog} from '@octokit/plugin-request-log'
import {retry} from '@octokit/plugin-retry'

describe('main wires Octokit plugins', () => {
  const inputs: Record<string, string> = {
    'github-token': 'primary-token',
    debug: 'false',
    retries: '0',
    'result-encoding': 'string',
    script: "getOctokit('secondary-token'); return 'done'"
  }

  beforeAll(async () => {
    for (const [name, value] of Object.entries(inputs)) {
      process.env[`INPUT_${name.toUpperCase()}`] = value
    }
    // wrap-require.ts wraps the bundler-provided require; use Jest's here.
    ;(globalThis as any).__non_webpack_require__ = require
    jest.spyOn(core, 'setOutput').mockImplementation(() => undefined)
    jest.spyOn(core, 'setFailed').mockImplementation(() => undefined)

    // Importing main.ts runs main(): it builds the primary client and
    // evaluates the script above, which creates a secondary client.
    await import('../src/main')
    await new Promise(resolve => setImmediate(resolve))
  })

  test('primary github client gets retry, requestLog and paginateGraphQL', () => {
    expect(getOctokit).toHaveBeenNthCalledWith(
      1,
      'primary-token',
      expect.any(Object),
      retry,
      requestLog,
      paginateGraphQL
    )
  })

  test('secondary clients from getOctokit inherit paginateGraphQL', () => {
    expect(getOctokit).toHaveBeenNthCalledWith(
      2,
      'secondary-token',
      expect.any(Object),
      retry,
      requestLog,
      paginateGraphQL
    )
    expect(core.setFailed).not.toHaveBeenCalled()
  })
})
