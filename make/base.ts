import { toPascalCase } from '~/code/tool.js'
import {
  Form,
  FormLike,
  FormLinkMesh,
  Hash,
  List,
  Base,
} from '~/code/cast.js'
import _ from 'lodash'

const TYPE: Record<string, string> = {
  boolean: 'boolean',
  decimal: 'number',
  integer: 'number',
  natural_number: 'number',
  json: 'object',
  string: 'string',
  timestamp: 'Date',
  date: 'Date',
  uuid: 'string',
}

export type Hold = {
  // map export to file
  save: Record<string, string>
  // map file to import
  load: Load
}

export type Load = Record<string, Record<string, boolean>>

export default function make(baseLink: string, base: Base, hold: Hold) {
  const hash: Record<string, Array<string>> = {}

  for (const name in base.link) {
    const site = base.link[name]
    if (site) {
      const file = `${baseLink}/${site.file ?? 'base'}/base`

      hold.load[file] ??= {}

      hash[file] ??= []
    }
  }

  for (const name in base.link) {
    const site = base.link[name]
    if (!site) {
      continue
    }

    const file = `${baseLink}/${site.file ?? 'base'}/base`

    const list = hash[file]

    if (!list) {
      continue
    }

    switch (site.form) {
      case 'hash':
        make_hash({ hash: site, base, name, hold, file }).forEach(
          line => {
            list.push(line)
          },
        )
        break
      case 'list':
        make_list({ list: site, base, name, hold, file }).forEach(
          line => {
            list.push(line)
          },
        )
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

  list.push(``)

  const load = (hold.load[file] ??= {})

  const typeName = toPascalCase(name)
  const TYPE_NAME = _.snakeCase(name).toUpperCase()

  load[typeName] = true
  hold.save[TYPE_NAME] ??= file

  if (hash.link) {
  } else {
    const keyList = Object.keys(hash.hash)
    const TYPE_NAME_KEY = `${TYPE_NAME}_KEY`
    const typeNameKey = `${typeName}Key`

    hold.save[TYPE_NAME_KEY] ??= file
    load[typeNameKey] = true

    list.push(
      `export const ${TYPE_NAME_KEY}: ReadonlyArray<${typeNameKey}> = ` +
        JSON.stringify(keyList, null, 2) +
        ' as const',
    )
    list.push(``)
  }

  list.push(
    `export const ${TYPE_NAME}: ${typeName} = ` +
      JSON.stringify(hash.hash, null, 2),
  )

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
  const TYPE_NAME = _.snakeCase(name).toUpperCase()
  const load = (hold.load[file] ??= {})

  load[typeName] = true
  hold.save[TYPE_NAME] ??= file

  text.push(
    `export const ${TYPE_NAME}: ReadonlyArray<${typeName}> = ` +
      JSON.stringify(list.list, null, 2),
  )

  return text
}

export function make_link_list({
  form,
  base,
  hold,
  file,
}: {
  form: Form | FormLinkMesh
  base: Base
  hold: Hold
  file: string
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
        const type = findAndLinkName({
          like: link.like as string,
          base,
          file,
          hold,
        })
        list.push(`  ${name}${optional}: ${aS}${type}${aE}`)
      } else if (link.case) {
        if (Array.isArray(link.case)) {
          const like_case: Array<string> = []
          link.case.forEach(c => {
            if (c.like) {
              const type = findAndLinkName({
                like: c.like as string,
                base,
                file,
                hold,
              })
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
            const type = findAndLinkName({
              like: c.like as string,
              base,
              file,
              hold,
            })
            like_fuse.push(type)
          }
        })
        list.push(
          `  ${name}${optional}: ${aS}${like_fuse.join(' & ')}${aE}`,
        )
      } else if (link.link) {
        list.push(`  ${name}${optional}: ${aS}{`)
        make_link_list({
          form: link as FormLinkMesh,
          base,
          hold,
          file,
        }).forEach(line => {
          list.push(`  ${line}`)
        })
        list.push(`}${aE}`)
      } else if (link.take) {
        list.push(
          `  ${name}${optional}: ${aS}${link.take
            .map(x => `'${x}'`)
            .join(' | ')}${aE}`,
        )
      }
    }
  } else if ('case' in form) {
    const formList: Array<string> = []
    const baseList: Array<any> = []
    const formCase = form.case as Array<FormLike>

    formCase.forEach(item => {
      if (typeof item === 'object' && 'like' in item) {
        const type = findAndLinkName({
          like: item.like as string,
          base,
          file,
          hold,
        })
        formList.push(type)
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
    const fuse = form.fuse as Array<FormLike>

    fuse.forEach(item => {
      const type = findAndLinkName({
        like: item.like as string,
        base,
        file,
        hold,
      })
      formList.push(type)
    })

    let formSite = `${formList.join(' & ')}`
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
