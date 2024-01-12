import { toPascalCase } from '~/code/tool'
import { Form, Hash, List, Mesh } from '~/code/cast'
import _ from 'lodash'

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

export default function make(mesh: Mesh) {
  const list: Array<string> = []

  list.push(`import _ from 'lodash'`)

  for (const name in mesh) {
    list.push(``)
    const site = mesh[name]
    if (site) {
      switch (site.form) {
        case 'form':
          make_form({ form: site, mesh, name }).forEach(line => {
            list.push(line)
          })
          break
        case 'hash':
          make_hash({ hash: site, mesh, name }).forEach(line => {
            list.push(line)
          })
          break
        case 'list':
          make_list({ list: site, mesh, name }).forEach(line => {
            list.push(line)
          })
          break
      }
    }
  }

  return list
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

  if ('link' in form) {
    const base = form.base ? `${toPascalCase(form.base)} & ` : ''
    list.push(`export type ${toPascalCase(name)} = ${base}{`)
  } else {
    list.push(`export type ${toPascalCase(name)} =`)
  }

  make_link_list({ form, mesh }).forEach(line => {
    list.push(`  ${line}`)
  })

  if ('link' in form) {
    list.push(`}`)
  }

  if (form.save && 'link' in form) {
    list.push(``)
    list.push(`export const ${_.snakeCase(name).toUpperCase()} =`)
    if (form.base) {
      list.push(
        `_.merge({}, ${_.snakeCase(form.base).toUpperCase()}, {`,
      )
    } else {
      list.push(`{`)
    }
    if (form.note) {
      list.push(`  note: $${form.note},`)
    }
    list.push(`  link: {`)
    for (const name in form.link) {
      const link = form.link[name]
      if (link) {
        list.push(`    ${name}: ${JSON.stringify(link, null, 2)},`)
      }
    }
    list.push(`},`)
    if (form.base) {
      list.push(`})`)
    } else {
      list.push(`}`)
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
  const list = make_form({
    form: hash.bond,
    mesh,
    name: `${name}_VALUE`,
  })
  const typeName = toPascalCase(name)
  const TYPE_NAME = _.snakeCase(name).toUpperCase()

  if (hash.link) {
    list.push(``)
    list.push(
      `export type ${typeName} = Record<${toPascalCase(
        hash.link,
      )}, ${typeName}Value>`,
    )
  } else {
    const keyList = Object.keys(hash.hash)

    list.push(
      `export const ${TYPE_NAME}_KEY = ` +
        JSON.stringify(keyList, null, 2) +
        ' as const',
    )

    list.push(``)
    list.push(
      `export type ${typeName}Key = (typeof ${TYPE_NAME}_KEY)[number]`,
    )

    list.push(``)
    list.push(
      `export type ${typeName} = Record<${typeName}Key, ${typeName}Value>`,
    )
  }

  list.push(``)
  list.push(
    `export const ${TYPE_NAME}: ${typeName} = ` +
      JSON.stringify(hash.hash, null, 2),
  )

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
    `export const ${TYPE_NAME} = ` +
      JSON.stringify(list.list, null, 2) +
      ' as const',
  )

  text.push(``)
  text.push(`export type ${typeName} = (typeof ${TYPE_NAME})[number]`)

  return text
}

export function make_link_list({
  form,
  mesh,
}: {
  form: Form
  mesh: Mesh
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
        if (Array.isArray(link.case)) {
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
        } else {
          const like_case: Array<string> = []
          for (const name in link.case) {
            like_case.push(`'${name}'`)
          }
          list.push(
            `  ${name}${optional}: ${aS}${like_case.join(' | ')}${aE}`,
          )
        }
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
