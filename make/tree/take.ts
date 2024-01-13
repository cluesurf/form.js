import { toPascalCase } from '~/code/tool'
import {
  Form,
  FormLike,
  FormLinkMesh,
  Hash,
  List,
  Mesh,
} from '~/code/cast'
import _ from 'lodash'

const TYPE: Record<string, string> = {
  ArrayBuffer: 'z.instanceof(ArrayBuffer)',
  boolean: 'z.boolean()',
  decimal: 'z.number()',
  integer: 'z.number().int()',
  json: 'z.passthrough()',
  string: 'z.string()',
  timestamp: 'z.coerce.date()',
  date: 'z.coerce.date()',
  uuid: 'z.string().uuid()',
  natural_number: 'z.number().int().gte(0)',
}

export default function make(code: string, mesh: Mesh) {
  const list: Array<string> = []

  list.push(`import { z } from 'zod'`)
  list.push(`import * as Cast from './cast'`)

  list.push(`import { MAKE, TEST } from '@termsurf/form'`)
  list.push(`import code from '${code}'`)

  for (const name in mesh) {
    const site = mesh[name]
    if (site) {
      switch (site.form) {
        case 'form':
          list.push(``)
          make_form({ form: site, mesh, name }).forEach(line => {
            list.push(line)
          })
          break
        case 'test':
          // make_test({ mesh, name, test: site }).forEach(line => {
          //   list.push(line)
          // })
          break
        case 'hash':
          list.push(``)
          make_hash({ hash: site, mesh, name }).forEach(line => {
            list.push(line)
          })
          break
        case 'list':
          list.push(``)
          make_list({ list: site, mesh, name }).forEach(line => {
            list.push(line)
          })
          break
      }
    }
  }

  return list
}

export function make_hash({
  name,
  hash,
  mesh,
}: {
  name: string
  hash: Hash
  mesh: Mesh
}) {
  const list: Array<string> = []

  const typeName = toPascalCase(name)
  const TYPE_NAME = _.snakeCase(name).toUpperCase()

  if (hash.link) {
    //
  } else {
    list.push(
      `export const ${typeName}KeyModel: z.ZodType<Cast.${typeName}Key> = z.enum(Cast.${TYPE_NAME}_KEY)`,
    )
  }

  return list
}

export function make_list({
  name,
  list,
  mesh,
}: {
  name: string
  list: List
  mesh: Mesh
}) {
  const text: Array<string> = []

  const typeName = toPascalCase(name)
  const TYPE_NAME = _.snakeCase(name).toUpperCase()

  text.push(
    `export const ${typeName}Model: z.ZodType<Cast.${typeName}> = z.enum(Cast.${TYPE_NAME})`,
  )

  return text
}

export function make_form({
  name,
  form,
  mesh,
}: {
  name: string
  form: Form
  mesh: Mesh
}) {
  const list: Array<string> = []

  const typeName = toPascalCase(name)
  const leak = 'leak' in form && form.leak
  const load = 'load' in form && form.load

  if ('link' in form) {
    const base = form.base
      ? `(${toPascalCase(
          form.base,
        )}Model as z.ZodObject<z.ZodRawShape>).extend(`
      : 'z.object('
    list.push(
      `export const ${typeName}Model: z.ZodType<Cast.${typeName}> = ${base}{`,
    )
  } else {
    list.push(
      `export const ${typeName}Model: z.ZodType<Cast.${typeName}> = `,
    )
  }

  make_link_list({
    form,
    mesh,
    leak,
  }).forEach(line => {
    list.push(`  ${line}`)
  })

  if ('link' in form) {
    list.push(`})`)
    if (form.make) {
      list.push(`.transform(MAKE('${name}', code.${form.make}.make))`)
    }
    if (leak) {
      list.push(`.passthrough()`)
    }
  }

  // const link: Array<string> = []

  // if (load) {
  //   load.forEach(l => {
  //     link.push(toPascalCase(l))
  //   })
  // }

  // list.push(``)
  // list.push(
  //   `export function load${typeName}(source: any): Cast.${typeName} {`,
  // )
  // list.push(`  let x = source`)
  // link.forEach(l => {
  //   list.push(`  x = ${l}Model.parse(x)`)
  // })
  // list.push(`  return x as Cast.${typeName}`)
  // list.push(`}`)

  return list
}

export function make_link_list({
  form,
  mesh,
  leak,
}: {
  form: Form | FormLinkMesh
  mesh: Mesh
  leak?: boolean
}) {
  const list: Array<string> = []

  if ('link' in form) {
    for (const name in form.link) {
      const link = form.link[name]
      if (!link) {
        continue
      }
      const oS = link.need === false ? 'z.optional(' : ''
      const oE = link.need === false ? ')' : ''
      const aS = link.list === true ? 'z.array(' : ''
      const aE = link.list === true ? ')' : ''
      const r = link.test
        ? `.refine(TEST('${name}', code.${link.test}.test))`
        : ''
      const f =
        link.fall != null
          ? `.default(${JSON.stringify(link.fall)})`
          : ''
      const l = leak ? `.passthrough()` : ''
      if (typeof link.like === 'string') {
        let type = TYPE[link.like]
        if (type) {
          list.push(`  ${name}: ${oS}${aS}${type}${r}${aE}${oE}${f},`)
        } else {
          type = `${toPascalCase(link.like as string)}Model${l}`
          list.push(
            `  ${name}: ${oS}${aS}z.lazy(() => ${type})${r}${f}${aE}${oE},`,
          )
        }
      } else if (link.case) {
        if (Array.isArray(link.case)) {
          const like_case: Array<string> = []
          link.case.forEach((c, i) => {
            if (c.like) {
              let type = TYPE[c.like]
              const r = c.test
                ? `.refine(TEST('${name}', code.${c.test}.test))`
                : ''
              if (type) {
                like_case.push(`${type}${r}`)
              } else {
                type = `${toPascalCase(c.like as string)}Model`
                like_case.push(`z.lazy(() => ${type})${r}`)
              }
            }
          })
          list.push(
            `  ${name}: ${oS}${aS}z.union([${like_case.join(
              ', ',
            )}])${aE}${oE},`,
          )
        } else {
          const like_case: Array<string> = []
          for (const name in link.case) {
            like_case.push(`'${name}'`)
          }
          list.push(
            `  ${name}: ${oS}${aS}z.enum([${like_case.join(
              ', ',
            )}])${aE}${oE},`,
          )
        }
      } else if (link.fuse) {
        const like_fuse: Array<string> = []
        link.fuse.forEach((c, i) => {
          if (c.like) {
            let type = TYPE[c.like]
            const r = c.test
              ? `.refine(TEST('${name}', code.${c.test}.test))`
              : ''
            if (type) {
              like_fuse.push(`${type}${r}`)
            } else {
              type = `${toPascalCase(c.like as string)}Model`
              like_fuse.push(`z.lazy(() => ${type})${r}`)
            }
          }
        })
        list.push(
          `  ${name}: ${oS}${aS}z.intersection([${like_fuse.join(
            ', ',
          )}])${aE}${oE},`,
        )
      } else if (link.link) {
        list.push(`  ${name}: ${oS}${aS}z.object({`)
        make_link_list({
          form: link as FormLinkMesh,
          mesh,
          leak,
        }).forEach(line => {
          list.push(`  ${line}`)
        })
        list.push(`})${l}${aE}${oE},`)
      }
    }
  } else if ('case' in form) {
    const formList: Array<string> = []
    const baseList: Array<any> = []
    const formCase = form.case as Array<FormLike>

    formCase.forEach(item => {
      if (typeof item === 'object' && 'like' in item) {
        formList.push(`z.lazy(() => ${item.like}Model)`)
      } else {
        if (typeof item === 'string') {
          baseList.push(`'${item}'`)
        } else {
          baseList.push(item)
        }
      }
    })

    let baseSite =
      baseList.length > 0
        ? `z.enum([${baseList.join(', ')}])`
        : undefined

    if (baseSite) {
      formList.push(baseSite)
    }

    let formSite =
      formList.length === 1 && baseSite
        ? baseSite
        : `z.union([${formList.join(', ')}])`
    list.push(formSite)
  } else if ('fuse' in form) {
    const formList: Array<string> = []
    const fuse = form.fuse as Array<FormLike>

    fuse.forEach(item => {
      formList.push(`z.lazy(() => ${item.like}Model)`)
    })

    let formSite = `z.intersection([${formList.join(', ')}])`
    list.push(formSite)
  }

  return list
}
