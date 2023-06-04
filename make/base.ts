import _ from 'lodash'
import loveCode from '@tunebond/love-code'
import { Base, Form } from '../index.js'
import { testMesh } from '@tunebond/have'

export function makeFormText(form: string) {
  switch (form) {
    case 'text':
    case 'string':
    case 'uuid':
    case 'cuid':
    case 'date':
      return 'string'
    case 'mark':
      return 'number'
    case 'number':
      return 'number'
    case 'wave':
      return 'boolean'
    case 'boolean':
      return 'boolean'
    default:
      return formCodeCase(form)
  }
}

export function makeFormZodText(form: string) {
  switch (form) {
    case 'text':
    case 'string':
    case 'uuid':
    case 'cuid':
      return 'z.string()'
    case 'mark':
    case 'number':
      return 'z.number()'
    case 'wave':
    case 'boolean':
      return 'z.boolean()'
    case 'date':
      return 'z.string().datetime()'
    default:
      return `z.lazy(() => ${formCodeCase(form)}Load)`
  }
}

export function formCodeCase(text: string) {
  return _.startCase(_.camelCase(text)).replace(/ /g, '')
}

export function makeZodFoot(base: Base) {
  const list: Array<string> = []

  list.push(`export const Load: Record<Name, z.ZodTypeAny> = {`)
  for (const name in base) {
    list.push(`${name}: ${formCodeCase(name)}Load,`)
  }
  list.push(`}`)

  list.push(
    `export function need<Name extends Name>(bond: unknown, form: Name): asserts bond is Base[Name] {`,
  )

  list.push(`const test = Load[form]`)
  list.push(`test.parse(bond)`)

  list.push(`}`)

  list.push(
    `export function test<Name extends Name>(bond: unknown, form: Name): bond is Base[Name] {`,
  )

  list.push(`const test = Load[form]`)
  list.push(`const make = test.safeParse(bond)`)
  list.push(`if ('error' in make) {`)
  list.push(`console.log(make.error)`)
  list.push(`}`)
  list.push(`return make.success`)

  list.push(`}`)

  list.push(
    `export function take<Name extends Name>(bond: unknown, form: Name): Base[Name] {`,
  )

  list.push(`const test = Load[form] as z.ZodType<Base[Name]>`)
  list.push(`return test.parse(bond)`)

  list.push(`}`)
  list.push(``)

  return list
}

export function testForm(bond: unknown): bond is Form {
  return testMesh(bond) && 'link' in bond
}
