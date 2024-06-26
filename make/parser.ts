import { toPascalCase } from '~/code/tool.js'
import snakeCase from 'lodash/snakeCase'
import {
  Base,
  Form,
  FormLike,
  FormLinkMesh,
  Hash,
  List,
} from '~/code/type.js'
import { Hold } from './type'

const TYPE: Record<string, string> = {
  boolean: 'z.boolean()',
  decimal: 'z.number()',
  integer: 'z.number().int()',
  json: 'z.object({}).passthrough()',
  string: 'z.string()',
  timestamp: 'z.coerce.date()',
  date: 'z.coerce.date()',
  uuid: 'z.string().uuid()',
  natural_number: 'z.number().int().gte(0)',
}

/**
 * Make parsers in the `~/code/type/parser/index.ts` file.
 */

export default function make(baseLink: string, base: Base, hold: Hold) {
  const hash: Record<string, Array<string>> = {}

  for (const name in base.link) {
    const site = base.link[name]
    if (!site) {
      continue
    }

    const file = `${baseLink}/parser/${site.file ?? 'index'}`

    hash[file] ??= []

    const list = hash[file]!

    switch (site.form) {
      case 'form':
        list.push(``)
        make_form({
          form: site,
          base,
          name,
          file,
          hold,
        }).forEach(line => {
          list.push(line)
        })
        break
      // case 'hash':
      //   make_hash({
      //     hash: site,
      //     base,
      //     name,
      //     file,
      //     hold,
      //   }).forEach(line => {
      //     list.push(line)
      //   })
      //   break
      case 'list':
        list.push(``)
        make_list({
          list: site,
          base,
          name,
          file,
          hold,
        }).forEach(line => {
          list.push(line)
        })
        break
    }
  }

  return hash
}

export function make_hash({
  name,
  hash,
  base,
  file,
  hold,
}: {
  name: string
  hash: Hash
  base: Base
  file: string
  hold: Hold
}) {
  const list: Array<string> = []

  const typeName = toPascalCase(name)
  const TYPE_NAME = snakeCase(name).toUpperCase()

  if (hash.link) {
    //
  } else {
    const load = (hold.load[file] ??= {})

    const typeNameKey = `${typeName}Key`
    const typeNameKeyModel = `${typeName}KeyParser`
    const TYPE_NAME_KEY = `${TYPE_NAME}_KEY`

    load[typeNameKey] = true
    load[TYPE_NAME_KEY] = true

    hold.save[typeNameKeyModel] ??= { file }

    list.push(``)
    list.push(
      `export const ${typeNameKeyModel}: z.ZodType<${typeNameKey}> = z.enum(${TYPE_NAME_KEY})`,
    )
  }

  return list
}

export function make_list({
  name,
  list,
  base,
  file,
  hold,
}: {
  name: string
  list: List
  base: Base
  file: string
  hold: Hold
}) {
  const text: Array<string> = []

  const typeName = toPascalCase(name)
  const TYPE_NAME = snakeCase(name)

  const load = (hold.load[file] ??= {})

  const typeNameModel = `${typeName}`

  load[typeName] = true

  hold.save[`${typeNameModel}Parser`] ??= { file }

  text.push(`let ${typeNameModel}Model: z.ZodType<${typeName}>`)
  text.push(``)

  text.push(
    `export const ${typeNameModel}Parser = () => {`,
    `  if (!${typeNameModel}Model) {`,
    `    ${typeNameModel}Model = z.enum(LOAD('${TYPE_NAME}') as readonly [string, ...string[]]) as z.ZodType<${typeName}>`,
    `  }`,
    `  return ${typeNameModel}Model!`,
    `}`,
  )

  return text
}

export function make_form({
  name,
  form,
  base,
  file,
  hold,
}: {
  name: string
  form: Form
  base: Base
  file: string
  hold: Hold
}) {
  const list: Array<string> = []

  const typeName = toPascalCase(name)
  const leak = 'leak' in form && form.leak

  const load = (hold.load[file] ??= {})
  load[typeName] = true

  const typeParserName = `${typeName}Parser`
  const typeModelName = `${typeName}Model`

  if ('link' in form) {
    let base
    if (form.base) {
      const baseParserName = `${toPascalCase(form.base)}Parser`
      load[baseParserName] = true
      // base = `(${baseParserName} as z.ZodObject<z.ZodRawShape>).extend(`
      base = `(${baseParserName}() as any).extend(`
    } else {
      base = 'z.object('
    }

    hold.save[typeParserName] ??= { file }

    list.push(`let ${typeModelName}: z.ZodType<${typeName}>`)
    list.push(``)
    list.push(
      `export const ${typeParserName} = (): z.ZodType<${typeName}> => {`,
      `  if (!${typeModelName}) {`,
      `    ${typeModelName} = (${base}{`,
    )
  } else {
    hold.save[typeParserName] ??= { file }

    list.push(`let ${typeModelName}: z.ZodType<${typeName}>`)
    list.push(``)
    list.push(
      `export const ${typeParserName} = (): z.ZodType<${typeName}> => {`,
      `  if (!${typeModelName}) {`,
      `    ${typeModelName} =`,
    )
  }

  make_link_list({
    name,
    form,
    base,
    leak,
    file,
    hold,
  }).forEach(line => {
    list.push(`      ${line}`)
  })

  if ('link' in form) {
    list.push(`    }) as z.ZodType<${typeName}>)`)
    if (form.make) {
      list.push(
        `    .transform(MAKE('${name}', code.${form.make}.make))`,
      )
    }
    if (leak) {
      list.push(`    .passthrough()`)
    }
  }

  list.push(`  }`, `  return ${typeModelName}!`, `}`)

  // const link: Array<string> = []

  // if (load) {
  //   load.forEach(l => {
  //     link.push(toPascalCase(l))
  //   })
  // }

  // list.push(``)
  // list.push(
  //   `export function load${typeName}(source: any): ${typeName} {`,
  // )
  // list.push(`  let x = source`)
  // link.forEach(l => {
  //   list.push(`  x = ${l}Model.parse(x)`)
  // })
  // list.push(`  return x as ${typeName}`)
  // list.push(`}`)

  return list
}

export function make_link_list({
  form,
  base,
  leak,
  name,
  file,
  hold,
}: {
  name: string
  form: Form | FormLinkMesh
  base: Base
  leak?: boolean
  file: string
  hold: Hold
}) {
  const list: Array<string> = []
  const load = (hold.load[file] ??= {})

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
          const linkLikeModelName = `${toPascalCase(
            link.like as string,
          )}Parser`

          if (base.mesh[link.like]) {
            const meshForm = base.mesh[link.like]
            if (meshForm?.form === 'list') {
              type = `${linkLikeModelName}()`
            } else {
              type = `${linkLikeModelName}()${l}`
            }
            load[linkLikeModelName] = true
            list.push(
              `  ${name}: ${oS}${aS}z.lazy(() => ${type})${r}${aE}${oE}${f},`,
            )
          } else {
            type = `z.instanceof(${findAndLinkName({
              like: link.like as string,
              base,
              file,
              hold,
            })})`
            list.push(`  ${name}: ${oS}${aS}${type}${r}${aE}${oE}${f},`)
          }
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
                type = `${toPascalCase(c.like as string)}Parser`
                if (base.mesh[c.like]) {
                  load[type] = true
                  like_case.push(`z.lazy(() => ${type}())${r}`)
                } else {
                  type = `z.instanceof(${findAndLinkName({
                    like: c.like as string,
                    base,
                    file,
                    hold,
                  })})`
                  like_case.push(`${type}${r}`)
                }
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
              type = `${toPascalCase(c.like as string)}Parser`
              if (base.mesh[c.like]) {
                load[type] = true
                like_fuse.push(`z.lazy(() => ${type}())${r}`)
              } else {
                type = `z.instanceof(${findAndLinkName({
                  like: c.like as string,
                  base,
                  file,
                  hold,
                })})`
                like_fuse.push(`${type}${r}`)
              }
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
          name,
          form: link as FormLinkMesh,
          base,
          leak,
          file,
          hold,
        }).forEach(line => {
          list.push(`  ${line}`)
        })
        list.push(`})${l}${aE}${oE},`)
      } else if (link.take) {
        if (link.take.length === 1) {
          list.push(`  ${name}: ${oS}${aS}z.literal(`)
          list.push(`    ${JSON.stringify(link.take[0])}`)
          list.push(`)${l}${aE}${oE},`)
        } else {
          list.push(`  ${name}: ${oS}${aS}z.enum(`)
          list.push(`    ${JSON.stringify(link.take)}`)
          list.push(`)${l}${aE}${oE},`)
        }
      }
    }
  } else if ('case' in form) {
    const formList: Array<string> = []
    const baseList: Array<any> = []
    const formCase = form.case as Array<FormLike>

    formCase.forEach(item => {
      let type = TYPE[item.like]
      const r = item.test
        ? `.refine(TEST('${name}', code.${item.test}.test))`
        : ''
      if (type) {
        formList.push(`${type}${r}`)
      } else {
        type = `${toPascalCase(item.like as string)}Parser`
        if (base.mesh[item.like]) {
          load[type] = true
          formList.push(`z.lazy(() => ${type}())${r}`)
        } else {
          type = `z.instanceof(${findAndLinkName({
            like: item.like as string,
            base,
            file,
            hold,
          })})`
          formList.push(`${type}${r}`)
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
      const itemModelName = `${item.like}Parser`
      load[itemModelName] = true
      formList.push(`z.lazy(() => ${itemModelName}())`)
    })

    let formSite = `z.intersection([${formList.join(', ')}])`
    list.push(formSite)
  }

  return list
}

function findAndLinkName({
  like,
  base,
  file,
  hold,
}: {
  like: string
  base: Base
  file: string
  hold: Hold
}): string {
  const type = TYPE[like]
  if (typeof type === 'string') {
    return type
  }

  const name = base.name[like]

  if (typeof name === 'string') {
    return name
  }

  const headName = toPascalCase(like)

  const load = (hold.load[file] ??= {})
  load[headName] = true

  return headName
}
