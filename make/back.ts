import loveCode from '@tunebond/love-code'
import { Base } from '../index.js'
import {
  formCodeCase,
  makeFormText,
  makeFormZodText,
  makeZodFoot,
  testForm,
} from './base.js'

export default async function make(base: Base) {
  const form = await makeForm(base)
  const load = await makeLoad(base)
  return { form, load }
}

async function makeForm(base: Base) {
  const list: Array<string> = []

  list.push(`export namespace Form {`)
  for (const name in base) {
    const form = base[name]
    if (!form) {
      continue
    }

    if (testForm(form)) {
      list.push(`export type ${formCodeCase(name)} = {`)

      for (const linkName in form.link) {
        const link = form.link[linkName]
        if (!link) {
          continue
        }
        if (link.list) {
          continue
        }

        const makeLinkName = link.site ? link.site.name : linkName

        const formText = link.site
          ? makeFormText(link.site.form)
          : Array.isArray(link.form)
          ? link.form.map(makeFormText).join(' | ')
          : makeFormText(link.form)

        if (link.void) {
          list.push(`${makeLinkName}?: ${formText} | null | undefined`)
        } else {
          list.push(`${makeLinkName}: ${formText}`)
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
    list.push(`${name}: Form.${formCodeCase(name)}`)
  }
  list.push(`}`)
  list.push(``)
  list.push(`export type Name = keyof Base`)
  list.push(``)

  const text = await loveCode(list.join('\n'))

  return text
}

async function makeLoad(base: Base) {
  const list: Array<string> = []

  list.push(`import { z } from 'zod'`)
  list.push(`import { Form, Name, Base } from './form.js'`)

  for (const name in base) {
    list.push(
      `export const ${formCodeCase(
        name,
      )}Load: z.ZodType<Form.${formCodeCase(name)}> = z.object({`,
    )
    const form = base[name]
    if (!form) {
      continue
    }

    if (testForm(form)) {
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

        const makeLinkName = link.site ? link.site.name : linkName

        if (link.site) {
          bond.push(makeFormZodText(link.site.form))
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
    }

    list.push(`})`)
    list.push(``)
  }

  list.push(...makeZodFoot(base))

  const text = await loveCode(list.join('\n'))

  return text
}
