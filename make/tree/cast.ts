import { toPascalCase } from '~/code/tool'
import { Form, FormMesh } from '~/code/cast'

const TYPE: Record<string, string> = {
  ArrayBuffer: 'ArrayBuffer',
  boolean: 'boolean',
  decimal: 'number',
  integer: 'number',
  json: 'object',
  string: 'string',
  timestamp: 'Date',
  uuid: 'string',
}

export default function make(mesh: FormMesh) {
  const list: Array<string> = []

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

  if ('link' in form) {
    list.push(`export type ${toPascalCase(name)} = {`)
  } else {
    list.push(`export type ${toPascalCase(name)} =`)
  }

  make_link_list({ form, mesh }).forEach(line => {
    list.push(`  ${line}`)
  })

  if ('link' in form) {
    list.push(`}`)
  }

  return list
}

export function make_link_list({
  form,
  mesh,
}: {
  form: Form
  mesh: FormMesh
}) {
  const list: Array<string> = []

  if ('link' in form) {
    for (const name in form.link) {
      const link = form.link[name]
      if (!link) {
        continue
      }
      const optional = link.need === false ? '?' : ''
      const aS = link.list === true ? 'Array<' : ''
      const aE = link.list === true ? '>' : ''
      if (typeof link.like === 'string') {
        const type = TYPE[link.like] ?? toPascalCase(link.like)
        list.push(`  ${name}${optional}: ${aS}${type}${aE}`)
      } else if (link.case) {
        const like_case: Array<string> = []
        link.case.forEach(c => {
          if (c.like) {
            const type = TYPE[c.like] ?? toPascalCase(c.like)
            like_case.push(type)
          }
        })
        list.push(
          `  ${name}${optional}: ${aS}${like_case.join(' | ')}${aE}`,
        )
      } else if (link.fuse) {
        const like_fuse: Array<string> = []
        link.fuse.forEach(c => {
          if (c.like) {
            const type = TYPE[c.like] ?? toPascalCase(c.like)
            like_fuse.push(type)
          }
        })
        list.push(
          `  ${name}${optional}: ${aS}${like_fuse.join(' & ')}${aE}`,
        )
      }
    }
  } else if ('case' in form) {
    const formList: Array<string> = []
    const baseList: Array<any> = []

    form.case.forEach(item => {
      if (typeof item === 'object' && 'like' in item) {
        formList.push(item.like)
      } else {
        if (typeof item === 'string') {
          baseList.push(`'${item}'`)
        } else {
          baseList.push(item)
        }
      }
    })

    let baseSite =
      baseList.length > 0 ? `${baseList.join(' | ')}` : undefined

    if (baseSite) {
      formList.push(baseSite)
    }

    let formSite = `${formList.join(' | ')}`
    list.push(formSite)
  } else if ('fuse' in form) {
    const formList: Array<string> = []

    form.fuse.forEach(item => {
      formList.push(item.like)
    })

    let formSite = `${formList.join(' & ')}`
    list.push(formSite)
  }

  return list
}
