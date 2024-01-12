import { toPascalCase } from '~/code/tool'
import { Form, FormMesh } from '~/code/cast'

const TYPE: Record<string, string> = {
  ArrayBuffer: 'z.instanceof(ArrayBuffer)',
  boolean: 'z.boolean()',
  decimal: 'z.number()',
  integer: 'z.number().int()',
  json: 'z.passthrough()',
  string: 'z.string()',
  timestamp: 'z.coerce.date()',
  uuid: 'z.string().uuid()',
}

export default function make(link: string, mesh: FormMesh) {
  const list: Array<string> = []

  list.push(`import { z } from 'zod'`)
  list.push(`import * as Cast from './cast'`)
  list.push(`import * as mesh from '${link}'`)

  for (const name in mesh) {
    list.push(``)
    const form = mesh[name]
    if (form) {
      make_site({ form, mesh, name }).forEach(line => {
        list.push(line)
      })
    }
  }

  return list
}

export function make_site({
  name,
  form,
  mesh,
}: {
  name: string
  form: Form
  mesh: FormMesh
}) {
  const list: Array<string> = []

  const typeName = toPascalCase(name)

  if ('link' in form) {
    list.push(
      `export const ${typeName}Model: z.ZodType<Cast.${typeName}> = z.object({`,
    )
  } else {
    list.push(
      `export const ${typeName}Model: z.ZodType<Cast.${typeName}> = `,
    )
  }

  make_link_list({ form, mesh, name }).forEach(line => {
    list.push(`  ${line}`)
  })

  if ('link' in form) {
    list.push(`})`)
  }

  return list
}

export function make_link_list({
  form,
  mesh,
  name: formName,
}: {
  form: Form
  mesh: FormMesh
  name: string
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
        ? `.refine(mesh.${formName}.link.${name}.test.call as (bond: any) => boolean, mesh.${formName}.link.${name}.test.note)`
        : ''
      if (typeof link.like === 'string') {
        let type = TYPE[link.like]
        if (type) {
          list.push(`  ${name}: ${oS}${aS}${type}${r}${aE}${oE},`)
        } else {
          type = `${toPascalCase(link.like)}Model`
          list.push(
            `  ${name}: ${oS}${aS}z.lazy(() => ${type})${r}${aE}${oE},`,
          )
        }
      } else if (link.case) {
        const like_case: Array<string> = []
        link.case.forEach((c, i) => {
          if (c.like) {
            let type = TYPE[c.like]
            const r = c.test
              ? `.refine(mesh.${formName}.link.${name}.case[${i}]?.test.call as (bond: any) => boolean, mesh.${formName}.link.${name}.case[${i}]?.test.note)`
              : ''
            if (type) {
              like_case.push(`${type}${r}`)
            } else {
              type = `${toPascalCase(c.like)}Model`
              like_case.push(`z.lazy(() => ${type})${r}`)
            }
          }
        })
        list.push(
          `  ${name}: ${oS}${aS}z.union([${like_case.join(
            ', ',
          )}])${aE}${oE},`,
        )
      } else if (link.fuse) {
        const like_fuse: Array<string> = []
        link.fuse.forEach((c, i) => {
          if (c.like) {
            let type = TYPE[c.like]
            const r = c.test
              ? `.refine(mesh.${formName}.link.${name}.fuse[${i}]?.test.call as (bond: any) => boolean, mesh.${formName}.link.${name}.fuse[${i}]?.test.note)`
              : ''
            if (type) {
              like_fuse.push(`${type}${r}`)
            } else {
              type = `${toPascalCase(c.like)}Model`
              like_fuse.push(`z.lazy(() => ${type})${r}`)
            }
          }
        })
        list.push(
          `  ${name}: ${oS}${aS}z.intersection([${like_fuse.join(
            ', ',
          )}])${aE}${oE},`,
        )
      }
    }
  } else if ('case' in form) {
    const formList: Array<string> = []
    const baseList: Array<any> = []

    form.case.forEach(item => {
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

    form.fuse.forEach(item => {
      formList.push(`z.lazy(() => ${item.like}Model)`)
    })

    let formSite = `z.intersection([${formList.join(', ')}])`
    list.push(formSite)
  }

  return list
}
