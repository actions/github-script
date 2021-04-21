import * as path from 'path'

export const wrapRequire = new Proxy(__non_webpack_require__, {
  apply: (target, thisArg, [moduleID]) => {
    if (moduleID.startsWith('.')) {
      moduleID = path.join(process.cwd(), moduleID)
      return target.apply(thisArg, [moduleID])
    }

    try {
      return target.apply(thisArg, [moduleID])
    } catch (err) {
      return target.resolve(moduleID, {paths: [...module.paths, process.cwd()]})
    }
  },

  get: (target, prop, receiver) => {
    Reflect.get(target, prop, receiver)
  }
})
