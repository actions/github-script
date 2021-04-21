import * as path from 'path'

export const wrapRequire = new Proxy(__non_webpack_require__, {
  apply: (target, thisArg, [moduleID]) => {
    if (moduleID.startsWith('.')) {
      moduleID = path.resolve(moduleID)
      return target.apply(thisArg, [moduleID])
    }

    const modulePath = target.resolve.apply(thisArg, [
      moduleID,
      {
        // Search the current working directory first, then the existing paths.
        // Webpack does not have an escape hatch for getting the actual
        // module, other than `eval`.
        paths: [process.cwd(), ...eval('module').paths]
      }
    ])

    return target.apply(thisArg, [modulePath])
  },

  get: (target, prop, receiver) => {
    Reflect.get(target, prop, receiver)
  }
})
