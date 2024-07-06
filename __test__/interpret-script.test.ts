/* eslint-disable @typescript-eslint/no-explicit-any */

import {SupportedLanguage, interpretScript} from '../src/interpret-script'

const scripts: Record<SupportedLanguage, string> = {
  [SupportedLanguage.cjs]: `
  const FS = require('node:fs') // Proof that we are in CommonJS.
  var a // Proof that we are NOT in TypeScript.
  return foo // Proof that we executed correctly. Also, this is the pre-existing function-style syntax.
  `,
  [SupportedLanguage.cts]: `
  const FS = require('node:fs') // Proof that we are in CommonJS.
  let a: string // Proof that we are in TypeScript.
  exports = foo // Proof that we executed correctly.
  `,
  [SupportedLanguage.mts]: `
  import FS from 'node:fs' // Proof that we are in an ES Module.
  let a: string // Proof that we are in TypeScript.
  export default foo // Proof that we executed correctly.
  `
}

describe(interpretScript.name, () => {
  describe(`language set to ${SupportedLanguage.cjs}`, () => {
    test(`throws when given a ${SupportedLanguage.cts} script`, async () => {
      return expect(
        interpretScript(
          SupportedLanguage.cjs,
          {foo: 'bar', require} as any,
          scripts.cts
        )
      ).rejects
    })

    test(`throws when given an ${SupportedLanguage.mts} script`, async () => {
      return expect(
        interpretScript(
          SupportedLanguage.cjs,
          {foo: 'bar', require} as any,
          scripts.mts
        )
      ).rejects
    })

    test(`interprets a ${SupportedLanguage.cjs} script`, async () => {
      return expect(
        interpretScript(
          SupportedLanguage.cjs,
          {foo: 'bar', require} as any,
          scripts.cjs
        )
      ).resolves
    })

    test(`when given a ${SupportedLanguage.cjs} script returns a function that can run it correctly`, async () => {
      const result = await interpretScript(
        SupportedLanguage.cjs,
        {foo: 'bar', require} as any,
        scripts.cjs
      )
      return expect(result()).resolves.toEqual('bar')
    })
  })

  describe(`language set to ${SupportedLanguage.cts}`, () => {
    test(`throws when given a ${SupportedLanguage.cjs} script`, async () => {
      return expect(
        interpretScript(
          SupportedLanguage.cts,
          {foo: 'bar', require} as any,
          scripts.cjs
        )
      ).rejects
    })

    test(`throws when given an ${SupportedLanguage.mts} script`, async () => {
      return expect(
        interpretScript(
          SupportedLanguage.cts,
          {foo: 'bar', require} as any,
          scripts.mts
        )
      ).rejects
    })

    test(`interprets a ${SupportedLanguage.cts} script`, async () => {
      return expect(
        interpretScript(
          SupportedLanguage.cts,
          {foo: 'bar', require} as any,
          scripts.cts
        )
      ).resolves
    })

    test(`when given a ${SupportedLanguage.cts} script returns a function that can run it correctly`, async () => {
      const result = await interpretScript(
        SupportedLanguage.cts,
        {foo: 'bar', require} as any,
        scripts.cts
      )
      return expect(result()).resolves.toEqual('bar')
    })

    test(`a script imports a script from disk`, async () => {
      const result = await interpretScript(
        SupportedLanguage.cts,
        {require} as any,
        `
        const {test} = require('../test/requireable')
        exports = test()
        `
      )
      return expect(result()).resolves.toEqual('hello')
    })
  })

  describe(`language set to ${SupportedLanguage.mts}`, () => {
    test(`throws when given a ${SupportedLanguage.cjs} script`, async () => {
      return expect(
        interpretScript(SupportedLanguage.mts, {foo: 'bar'} as any, scripts.cjs)
      ).rejects
    })

    test(`throws when given a ${SupportedLanguage.cts} script`, async () => {
      return expect(
        interpretScript(SupportedLanguage.mts, {foo: 'bar'} as any, scripts.cts)
      ).rejects
    })

    test(`interprets an ${SupportedLanguage.mts} script`, async () => {
      return expect(
        interpretScript(SupportedLanguage.mts, {foo: 'bar'} as any, scripts.mts)
      ).resolves
    })

    test(`when given an ${SupportedLanguage.mts} script returns a function that can run it correctly`, async () => {
      const result = await interpretScript(
        SupportedLanguage.mts,
        {foo: 'bar'} as any,
        scripts.mts
      )
      return expect(result()).resolves.toEqual('bar')
    })

    test(`can access console`, async () => {
      const result = await interpretScript(
        SupportedLanguage.mts,
        {} as any,
        `console`
      )
      return expect(result()).resolves
    })

    test(`can access process`, async () => {
      const result = await interpretScript(
        SupportedLanguage.mts,
        {} as any,
        `process`
      )
      return expect(result()).resolves
    })

    test(`a script that returns an object`, async () => {
      const result = await interpretScript(
        SupportedLanguage.mts,
        {} as any,
        `export default {a: 'b'}`
      )
      return expect(result()).resolves.toEqual({a: 'b'})
    })

    test.skip(`a script that uses a root level await`, async () => {
      // Will not work until we can actually run in ESM. Current code is transpiling the mts to cjs, so we don't get root level awaits yet.
      const result = await interpretScript(
        SupportedLanguage.mts,
        {} as any,
        `await Promise.resolve()`
      )
      return expect(result()).resolves
    })

    test.skip(`a script imports a script from disk`, async () => {
      // Will not work until we can actually run in ESM. Current code is transpiling the mts to cjs, so we don't get root level awaits yet.
      const result = await interpretScript(
        SupportedLanguage.mts,
        {require} as any,
        `
        const {test} = await import('../test/importable')
        export default test()
        `
      )
      return expect(result()).resolves.toEqual('hello')
    })
  })
})
