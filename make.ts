import _ from 'lodash'
import path from 'path'
import prettier from 'prettier'
import format from 'prettier-eslint'
import { fileURLToPath } from 'url'

import { Base } from './index.js'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

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

const ESLINT = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest' as const,
    project: [`${__dirname}/tsconfig.json`],
    sourceType: 'module' as const,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'simple-import-sort',
    'typescript-sort-keys',
    'sort-keys',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/array-type': [
      2,
      {
        default: 'generic',
      },
    ],
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/consistent-type-definitions': [2, 'type'],
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/lines-between-class-members': 'error',
    '@typescript-eslint/method-signature-style': 'error',
    '@typescript-eslint/naming-convention': 0,
    '@typescript-eslint/no-array-constructor': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/no-throw-literal': 'error',
    '@typescript-eslint/no-unnecessary-condition': 0,
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-useless-empty-export': 'error',
    '@typescript-eslint/object-curly-spacing': [2, 'always'],
    '@typescript-eslint/padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        next: ['type'],
        prev: '*',
      },
    ],
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/quotes': [
      'error',
      'single',
      {
        allowTemplateLiterals: true,
        avoidEscape: true,
      },
    ],
    '@typescript-eslint/space-before-blocks': ['error', 'always'],
    '@typescript-eslint/type-annotation-spacing': [
      'error',
      { after: true },
    ],
    curly: 2,
    'default-case': 'error',
    'default-case-last': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'lines-between-class-members': 'off',
    'no-array-constructor': 'off',
    'no-throw-literal': 'off',
    'object-curly-spacing': 'off',
    'padding-line-between-statements': 'off',
    'prettier/prettier': 2,
    'sort-keys': 0,
    'sort-keys/sort-keys-fix': 2,
    'space-before-blocks': 'off',
    'typescript-sort-keys/interface': 'error',
    'typescript-sort-keys/string-enum': 'error',
  },
}

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
  }

  list.push(...makeZodFoot(base, `Face`))

  const text = await makeText(list.join('\n'))

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
  }

  list.push(...makeZodFoot(base, `Back`))

  const text = await makeText(list.join('\n'))

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
  }
  list.push(`}`)
  list.push(`export type Base = {`)
  for (const name in base) {
    list.push(`${name}: Form.${pascal(name)}`)
  }
  list.push(`}`)
  list.push(`export type Name = keyof Base`)
  list.push(`}`)

  const text = await makeText(list.join('\n'))

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
  }
  list.push(`}`)
  list.push(`export type Base = {`)
  for (const name in base) {
    list.push(`${name}: Form.${pascal(name)}`)
  }
  list.push(`}`)
  list.push(`export type Name = keyof Base`)
  list.push(`}`)

  const text = await makeText(list.join('\n'))

  return text
}

function pascal(text: string) {
  return _.startCase(_.camelCase(text)).replace(/ /g, '')
}

async function makeText(text: string) {
  // const config = {
  //   eslintConfig: ESLINT,
  //   prettierOptions: PRETTIER,
  //   text: text,
  // }
  // // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  // return (await format(config)) as string
  return prettier.format(text, {
    ...PRETTIER,
    parser: 'typescript',
  })
}
