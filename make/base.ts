import _ from 'lodash'
import { Base, Form, FormLinkHostMove } from '../index.js'
import { haveMesh, testMesh } from '@tunebond/have'

export const SLOT: Array<keyof FormLinkHostMove> = [
  'base',
  'baseSelf',
  'headSelf',
  'head',
]

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

export function makeFoot(
  base: Base,
  formMesh: Record<string, Record<string, string>>,
) {
  const list: Array<string> = []

  list.push(
    `export const load: Record<Name, Record<FormLinkHostMoveName, z.ZodTypeAny>> = {`,
  )
  for (const name in base) {
    list.push(`${name}: {`)
    for (const slot of SLOT) {
      const slotMesh = formMesh[name]
      haveMesh(slotMesh, 'slotMesh')
      list.push(`${slot}: ${slotMesh[slot]},`)
    }
    list.push(`},`)
  }
  list.push(`}`)

  list.push(
    `export function need<N extends Name>(bond: unknown, form: N, move: FormLinkHostMoveName): asserts bond is Base[N] {`,
  )

  list.push(`const test = load[form][move]`)
  list.push(`test.parse(bond)`)

  list.push(`}`)

  list.push(
    `export function test<N extends Name>(bond: unknown, form: N, move: FormLinkHostMoveName): bond is Base[N] {`,
  )

  list.push(`const test = load[form][move]`)
  list.push(`const make = test.safeParse(bond)`)
  list.push(`if ('error' in make) {`)
  list.push(`console.log(make.error)`)
  list.push(`}`)
  list.push(`return make.success`)

  list.push(`}`)

  list.push(
    `export function take<N extends Name>(bond: unknown, form: N, move: FormLinkHostMoveName): Base[N] {`,
  )

  list.push(`const test = load[form][move] as z.ZodType<Base[N]>`)
  list.push(`return test.parse(bond)`)

  list.push(`}`)
  list.push(``)

  return list
}

export function testForm(bond: unknown): bond is Form {
  return testMesh(bond) && 'link' in bond
}
