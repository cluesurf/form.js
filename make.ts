import _ from 'lodash'

import { Base } from './index.js'
import loveCode from '@tunebond/love-code'

export default async function make(base: Base) {
  const face = await makeFace(base)
  const back = await makeBack(base)
  return { back, face }
}

async function makeFace(base: Base) {
  const form = await makeFaceForm(base)
  const test = await makeFaceTest(base)
  return { form, test }
}

async function makeBack(base: Base) {
  const form = await makeBackForm(base)
  const test = await makeBackTest(base)
  return { form, test }
}

async function makeFaceTest(base: Base) {
  const list: Array<string> = []

  list.push(`import { z } from 'zod'`)
  list.push(`import { Face } from './form.js'`)

  for (const name in base) {
    list.push(
      `export const ${pascal(name)}Test: z.ZodType<Face.Form.${pascal(
        name,
      )}> = z.object({`,
    )
    const form = base[name]
    if (!form) {
      continue
    }

    for (const linkName in form.link) {
      const link = form.link[linkName]
      if (!link) {
        continue
      }

      const bond: Array<string> = []

      if (link.void) {
        bond.push(`z.optional(`)
      }

      if (link.list) {
        bond.push(`z.array(`)
      }

      if (Array.isArray(link.form)) {
        bond.push(`z.union(`)
        link.form.forEach(form => {
          bond.push(makeFormZodText(form) + ',')
        })
        bond.push(`)`)
      } else {
        bond.push(makeFormZodText(link.form))
      }

      if (link.list) {
        bond.push(`)`)
      }

      if (link.void) {
        bond.push(`)`)
      }

      list.push(`${linkName}: ${bond.join('\n')},`)
    }

    list.push(`})`)
    list.push(``)
  }

  list.push(...makeZodFoot(base, `Face`))

  const text = await loveCode(list.join('\n'))

  return text
}

async function makeBackTest(base: Base) {
  const list: Array<string> = []

  list.push(`import { z } from 'zod'`)
  list.push(`import { Back } from './form.js'`)

  for (const name in base) {
    list.push(
      `export const ${pascal(name)}Test: z.ZodType<Back.Form.${pascal(
        name,
      )}> = z.object({`,
    )
    const form = base[name]
    if (!form) {
      continue
    }

    for (const linkName in form.link) {
      const link = form.link[linkName]
      if (!link) {
        continue
      }
      if (link.list) {
        continue
      }

      const bond: Array<string> = []

      if (link.void) {
        bond.push(`z.optional(`)
      }

      const makeLinkName = link.link ? link.link.name : linkName

      if (link.link) {
        bond.push(makeFormZodText(link.link.form))
      } else if (Array.isArray(link.form)) {
        bond.push(`z.union(`)
        link.form.forEach(form => {
          bond.push(makeFormZodText(form) + ',')
        })
        bond.push(`)`)
      } else {
        bond.push(makeFormZodText(link.form))
      }

      if (link.void) {
        bond.push(`)`)
      }

      list.push(`${makeLinkName}: ${bond.join('\n')},`)
    }

    list.push(`})`)
    list.push(``)
  }

  list.push(...makeZodFoot(base, `Back`))

  const text = await loveCode(list.join('\n'))

  return text
}

function makeZodFoot(base: Base, form: string) {
  const list: Array<string> = []

  list.push(`export const Test: Record<${form}.Name, z.ZodTypeAny> = {`)
  for (const name in base) {
    list.push(`${name}: ${pascal(name)}Test,`)
  }
  list.push(`}`)

  list.push(
    `export function need<Name extends ${form}.Name>(bond: unknown, form: Name): asserts bond is ${form}.Base[Name] {`,
  )

  list.push(`const test = Test[form]`)
  list.push(`test.parse(bond)`)

  list.push(`}`)

  list.push(
    `export function test<Name extends ${form}.Name>(bond: unknown, form: Name): bond is ${form}.Base[Name] {`,
  )

  list.push(`const test = Test[form]`)
  list.push(`const make = test.safeParse(bond)`)
  list.push(`if ('error' in make) {`)
  list.push(`console.log(make.error)`)
  list.push(`}`)
  list.push(`return make.success`)

  list.push(`}`)

  list.push(
    `export function take<Name extends ${form}.Name>(bond: unknown, form: Name): ${form}.Base[Name] {`,
  )

  list.push(`const test = Test[form] as z.ZodType<${form}.Base[Name]>`)
  list.push(`return test.parse(bond)`)

  list.push(`}`)
  list.push(``)

  return list
}

async function makeFaceForm(base: Base) {
  const list: Array<string> = []

  list.push(`export namespace Face {`)
  list.push(`export namespace Form {`)
  for (const name in base) {
    const form = base[name]
    if (!form) {
      continue
    }

    list.push(`export type ${pascal(name)} = {`)
    for (const linkName in form.link) {
      const link = form.link[linkName]
      if (!link) {
        continue
      }

      if (Array.isArray(link.form)) {
        if (link.list) {
          list.push(
            `${linkName}: Array<${link.form
              .map(makeFormText)
              .join(' | ')}>`,
          )
        } else {
          list.push(`${linkName}: Array<${link.form}>`)
        }
      } else {
        const formText = link.list
          ? `Array<${makeFormText(link.form)}>`
          : makeFormText(link.form)
        if (link.void) {
          if (link.list) {
            list.push(`${linkName}: ${formText}`)
          } else {
            list.push(`${linkName}?: ${formText} | null | undefined`)
          }
        } else {
          list.push(`${linkName}: ${formText}`)
        }
      }
    }
    list.push(`}`)
    list.push(``)
  }
  list.push(`}`)
  list.push(``)
  list.push(`export type Base = {`)
  for (const name in base) {
    list.push(`${name}: Form.${pascal(name)}`)
  }
  list.push(`}`)
  list.push(``)
  list.push(`export type Name = keyof Base`)
  list.push(``)
  list.push(`}`)
  list.push(``)

  const text = await loveCode(list.join('\n'))

  return text
}

function makeFormText(form: string) {
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
      return pascal(form)
  }
}

function makeFormZodText(form: string) {
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
      return `z.lazy(() => ${pascal(form)}Test)`
  }
}

async function makeBackForm(base: Base) {
  const list: Array<string> = []

  list.push(`export namespace Back {`)
  list.push(`export namespace Form {`)
  for (const name in base) {
    const form = base[name]
    if (!form) {
      continue
    }

    list.push(`export type ${pascal(name)} = {`)
    for (const linkName in form.link) {
      const link = form.link[linkName]
      if (!link) {
        continue
      }
      if (link.list) {
        continue
      }

      const makeLinkName = link.link ? link.link.name : linkName

      const formText = link.link
        ? makeFormText(link.link.form)
        : Array.isArray(link.form)
        ? link.form.map(makeFormText).join(' | ')
        : makeFormText(link.form)

      if (link.void) {
        list.push(`${makeLinkName}?: ${formText} | null | undefined`)
      } else {
        list.push(`${makeLinkName}: ${formText}`)
      }
    }
    list.push(`}`)
    list.push(``)
  }
  list.push(`}`)
  list.push(``)
  list.push(`export type Base = {`)
  for (const name in base) {
    list.push(`${name}: Form.${pascal(name)}`)
  }
  list.push(`}`)
  list.push(``)
  list.push(`export type Name = keyof Base`)
  list.push(``)
  list.push(`}`)
  list.push(``)

  const text = await loveCode(list.join('\n'))

  return text
}

function pascal(text: string) {
  return _.startCase(_.camelCase(text)).replace(/ /g, '')
}
