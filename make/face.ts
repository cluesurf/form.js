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

/**
 * This generates the zod types for each form.
 */

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
    }

    list.push(`})`)
    list.push(``)
  }

  list.push(...makeZodFoot(base))

  const text = await loveCode(list.join('\n'))

  return text
}

async function makeForm(base: Base) {
  const list: Array<string> = []

  list.push(`export namespace Face {`)
  list.push(`export namespace Form {`)
  for (const name in base) {
    const form = base[name]
    if (!form) {
      continue
    }

    list.push(`export type ${formCodeCase(name)} = {`)

    if (testForm(form)) {
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
  list.push(`}`)
  list.push(``)

  const text = await loveCode(list.join('\n'))

  return text
}
