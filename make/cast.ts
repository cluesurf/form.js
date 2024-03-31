import { toPascalCase } from '~/code/tool.js'
import {
  Form,
  FormLike,
  FormLinkMesh,
  Hash,
  List,
  Base,
  Read,
  ReadBase,
} from '~/code/cast.js'
import _ from 'lodash'

const TYPE: Record<string, string> = {
  boolean: 'boolean',
  number: 'number',
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
      const file = `${baseLink}/${site.file ?? 'base'}/cast`

      hold.load[file] ??= {}

      hash[file] ??= []
    }
  }

  for (const name in base.link) {
    const site = base.link[name]
    if (!site) {
      continue
    }

    const file = `${baseLink}/${site.file ?? 'base'}/cast`

    const list = hash[file]

    if (!list) {
      continue
    }

    switch (site.form) {
      case 'form':
        make_form({ form: site, base, name, hold, file }).forEach(
          line => {
            list.push(line)
          },
        )
        break
      case 'read':
        make_read({ read: site, base, name, hold, file }).forEach(
          line => {
            list.push(line)
          },
        )
        break
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

export function make_form({
  name,
  form,
  base,
  hold,
  file,
}: {
  name: string
  form: Form
  base: Base
  hold: Hold
  file: string
}) {
  const list: Array<string> = []
  const load = (hold.load[file] ??= {})

  const formName = toPascalCase(name)

  if ('link' in form) {
    let base

    if (form.base) {
      const name = toPascalCase(form.base)
      base = `${name} & `
      load[name] = true
    } else {
      base = ``
    }
    hold.save[formName] ??= file
    list.push(`export type ${formName} = ${base}{`)
  } else if ('case' in form || 'fuse' in form) {
    hold.save[formName] ??= file
    list.push(`export type ${formName} =`)
  }

  make_link_list({
    form,
    base,
    hold,
    file,
  }).forEach(line => {
    list.push(`  ${line}`)
  })

  if ('link' in form) {
    list.push(`}`)
  }

  if (form.save && 'link' in form) {
    const linkName = _.snakeCase(name).toUpperCase()

    hold.save[linkName] ??= file

    list.push(``)
    list.push(`export const ${linkName} =`)
    if (form.base) {
      const baseLinkName = _.snakeCase(form.base).toUpperCase()
      load[baseLinkName] = true
      list.push(`_.merge({}, ${baseLinkName}, {`)
    } else {
      list.push(`{`)
    }
    if (form.note) {
      list.push(`  note: ${form.note},`)
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

export function make_read({
  name,
  read,
  base,
  hold,
  file,
}: {
  name: string
  read: Read
  base: Base
  hold: Hold
  file: string
}) {
  const list: Array<string> = []
  const form = base.mesh[read.like]

  if (form && form.form === 'form') {
    const [tree] = make_read_link({
      name,
      line: name,
      read,
      form,
      base,
      hold,
      file,
    })
    tree.forEach(line => {
      list.push(`  ${line}`)
    })
  }

  return list
}

export function make_read_link({
  name,
  line,
  read,
  base,
  form,
  hold,
  file,
}: {
  name: string
  line: string
  read: ReadBase
  base: Base
  form: Form
  hold: Hold
  file: string
}): [Array<string>, string, string] {
  const treeBase: Array<string> = []
  const treeLock: Array<string> = []
  const tree: Array<string> = []
  const listBase: Array<string> = []
  const listLock: Array<string> = []
  const formNameItem = toPascalCase(read.list ? `${line}_item` : line)
  hold.save[formNameItem] ??= file
  const formName = toPascalCase(line)

  treeBase.push(``)
  treeLock.push(``)

  if (read.list) {
    hold.save[formName] ??= file

    treeBase.push(`export type ${formName} = {`)
    treeLock.push(`export type Locked${formName} = {`)

    if (read.size) {
      treeBase.push(`  size?: number`)
      treeLock.push(`  size: number`)
    }

    treeBase.push(`  list?: Array<${formNameItem}>`)
    treeLock.push(`  list: Array<Locked${formNameItem}>`)

    treeBase.push(`}`)
    treeLock.push(`}`)
  }

  listBase.push(`export type ${formNameItem} = {`)
  listLock.push(`export type Locked${formNameItem} = {`)

  if (read) {
    if (read.tree) {
      listBase.push(`    ${name}?: Array<${formNameItem}>`)
      listLock.push(`    ${name}: Array<Locked${formNameItem}>`)
    }

    if (read.base) {
      listBase.push(`    ${name}?: ${formNameItem}`)
      listLock.push(`    ${name}?: Locked${formNameItem}`)
    }

    if (form && 'link' in form && form.link) {
      for (const linkName in read.link) {
        const link = read.link[linkName]
        const twinFormLink = form.link[linkName]
        const opt = twinFormLink?.need === false ? '?' : ''
        const isSimple = Boolean(
          twinFormLink?.like && twinFormLink.like in TYPE,
        )

        if (!isSimple) {
          const twinForm = base.mesh[twinFormLink?.like ?? '']
          if (typeof link === 'object' && twinForm?.form === 'form') {
            const [nestTree, nestBase, nestLock] = make_read_link({
              name: linkName,
              line: [line, linkName].join('_'),
              read: link,
              base,
              form: twinForm,
              hold,
              file,
            })
            listBase.push(`    ${linkName}?: ${nestBase}`)
            listLock.push(`    ${linkName}${opt}: ${nestLock}`)
            treeBase.push(...nestTree)
          } else if (twinForm?.form === 'list') {
            const type = toPascalCase(twinFormLink.like as string)
            listBase.push(`    ${linkName}?: ${type}`)
            listLock.push(`    ${linkName}${opt}: ${type}`)
          }
        } else {
          const type = TYPE[twinFormLink?.like ?? '']
          listBase.push(`    ${linkName}?: ${type}`)
          listLock.push(`    ${linkName}${opt}: ${type}`)
        }
      }
    }
  }

  listBase.push(`}`)
  listLock.push(`}`)

  const list = [...listBase, '', ...listLock]

  treeBase.push(...list)

  tree.push(...treeBase, ...treeLock)

  if (read.list) {
    return [tree, formName, `Locked${formName}`]
  } else {
    return [tree, formNameItem, `Locked${formNameItem}`]
  }
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
  const list = make_form({
    form: { form: 'form', link: hash.bond },
    base,
    name: `${name}_VALUE`,
    file,
    hold,
  })
  list.push(``)

  const load = (hold.load[file] ??= {})

  const typeName = toPascalCase(name)
  const TYPE_NAME = _.snakeCase(name).toUpperCase()

  hold.save[typeName] ??= file
  hold.save[TYPE_NAME] ??= file

  if (hash.link) {
    const linkTypeName = toPascalCase(hash.link)
    load[linkTypeName] = true
    const linkTypeValueName = `${typeName}Value`
    list.push(
      `export type ${typeName} = Record<${linkTypeName}, ${linkTypeValueName}>`,
    )
  } else {
    const keyList = Object.keys(hash.hash)
    const typeNameKey = `${typeName}Key`

    hold.save[typeNameKey] ??= file

    list.push(``)
    list.push(`export type ${typeNameKey} =
${keyList.map(key => `  | '${key}'`).join('\n')}`)

    const typeValueName = `${typeName}Value`
    const typeKeyName = `${typeName}Key`
    load[typeValueName] = true

    list.push(``)
    list.push(
      `export type ${typeName} = Record<${typeKeyName}, ${typeValueName}>`,
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

  hold.save[typeName] ??= file

  text.push(``)
  text.push(`export type ${typeName} =
${list.list.map(key => `  | '${key}'`).join('\n')}`)

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
