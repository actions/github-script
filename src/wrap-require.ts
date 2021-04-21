import * as path from 'path'

declare const __non_webpack_require__: NodeRequire

export const wrapRequire = new Proxy(__non_webpack_require__, {
  apply: (target, thisArg, [moduleID]) => {
    if (moduleID.startsWith('.')) {
      moduleID = path.join(process.cwd(), moduleID)
    }
    return target.apply(thisArg, [moduleID])
  },

  get: (target, prop, receiver) => {
    Reflect.get(target, prop, receiver)
  }
})
