import _ from 'lodash'
import prettier from 'prettier'

import { Base } from './index.js'

const PRETTIER = {
  arrowParens: 'avoid' as const,
  bracketSpacing: true,
  endOfLine: 'lf' as const,
  importOrder: [
    '^\\w(.*)$',
    '^@(.*)$',
    '~(.*)$',
    '\\..(.*)$',
    '\\.(.*)$',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  printWidth: 72,
  proseWrap: 'always' as const,
  quoteProps: 'as-needed' as const,
  semi: false,
  singleAttributePerLine: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all' as const,
  useTabs: false,
}

export default function make(base: Base) {
  const face = makeFace(base)
  const back = makeBack(base)
  return { back, face }
}

function makeFace(base: Base) {
  const list: Array<string> = []

  list.push(`export namespace Face {`)
  list.push(`export namespace Form {`)
  for (const name in base) {
    const form = base[name]
    if (!form) {
      continue
    }

    list.push(`export type ${pascal(name)} = {`)
    for (const link_name in form.link) {
      const link = form.link[link_name]
      if (!link) {
        continue
      }

      if (Array.isArray(link.form)) {
        if (link.list) {
          list.push(
            `${link_name}: Array<${link.form
              .map(makeFormText)
              .join(' | ')}>`,
          )
        } else {
          list.push(`${link_name}: Array<${link.form}>`)
        }
      } else {
        const formText = link.list
          ? `Array<${makeFormText(link.form)}>`
          : makeFormText(link.form)
        if (link.void) {
          if (link.list) {
            list.push(`${link_name}: ${formText}`)
          } else {
            list.push(`${link_name}?: ${formText} | null | undefined`)
          }
        } else {
          list.push(`${link_name}: ${formText}`)
        }
      }
    }
    list.push(`}`)
  }
  list.push(`}`)
  list.push(`export type Base = {`)
  for (const name in base) {
    list.push(`${name}: Form.${pascal(name)}`)
  }
  list.push(`}`)
  list.push(`export type Name = keyof Base`)
  list.push(`}`)

  const text = prettier.format(list.join('\n'), {
    ...PRETTIER,
    parser: 'typescript',
  })

  return text
}

function makeFormText(form: string) {
  switch (form) {
    case 'text':
    case 'string':
    case 'uuid':
    case 'cuid':
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

function makeBack(base: Base) {
  const list: Array<string> = []

  list.push(`export namespace Back {`)
  list.push(`export namespace Form {`)
  for (const name in base) {
    const form = base[name]
    if (!form) {
      continue
    }

    list.push(`export type ${pascal(name)} = {`)
    for (const link_name in form.link) {
      const link = form.link[link_name]
      if (!link) {
        continue
      }
      if (link.list) {
        continue
      }

      const make_link_name = link.link ? link.link.name : link_name

      const formText = link.link
        ? makeFormText(link.link.form)
        : Array.isArray(link.form)
        ? link.form.map(makeFormText).join(' | ')
        : makeFormText(link.form)

      if (link.void) {
        list.push(`${make_link_name}?: ${formText} | null | undefined`)
      } else {
        list.push(`${make_link_name}: ${formText}`)
      }
    }
    list.push(`}`)
  }
  list.push(`}`)
  list.push(`export type Base = {`)
  for (const name in base) {
    list.push(`${name}: Form.${pascal(name)}`)
  }
  list.push(`}`)
  list.push(`export type Name = keyof Base`)
  list.push(`}`)

  const text = prettier.format(list.join('\n'), {
    ...PRETTIER,
    parser: 'typescript',
  })

  return text
}

function pascal(text: string) {
  return _.startCase(_.camelCase(text)).replace(/ /g, '')
}
