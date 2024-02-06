import _ from 'lodash'
import { TestBack } from './cast.js'
import { RefinementCtx } from 'zod'

export function toPascalCase(text: string) {
  return _.startCase(_.camelCase(text)).replace(/ /g, '')
}

export function MAKE(
  name: string,
  fn: (bond: any, ctx: RefinementCtx, name: string) => any,
): (bond: any, ctx: RefinementCtx) => any {
  return (bond: any, ctx: RefinementCtx): any => {
    return fn(bond, ctx, name)
  }
}

export function TEST(
  name: string,
  fn: (bond: any, name: string) => boolean | string | TestBack,
): (bond: any) => boolean | TestBack {
  return (bond: any): boolean | TestBack => {
    const back = fn(bond, name)
    if (typeof back === 'string') {
      return {
        message: back,
      }
    } else if (typeof back === 'boolean' || back == null) {
      return !!back
    } else {
      return back
    }
  }
}

export type StringCase = 'snakeCase' | 'camelCase' | 'pascalCase'

const STRING_CASE: Record<StringCase, (val: string) => string> = {
  snakeCase: _.snakeCase,
  camelCase: _.camelCase,
  pascalCase: toPascalCase,
}

export function convertObjectKeyCase(
  input: Record<string, any>,
  to: StringCase,
) {
  const out: Record<string, any> = {}
  for (const name in input) {
    let val = input[name]
    if (val) {
      if (_.isPlainObject(val)) {
        val = convertObjectKeyCase(val as Record<string, any>, to)
      } else if (Array.isArray(val)) {
        val = val.map(v => {
          if (_.isPlainObject(v)) {
            return convertObjectKeyCase(v as Record<string, any>, to)
          }

          return v as unknown
        })
      }
    }
    out[STRING_CASE[to](name)] = val
  }
  return out
}
