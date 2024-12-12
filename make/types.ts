import { toPascalCase } from '~/code/tool.js'
import {
  Form,
  FormLike,
  FormLinkMesh,
  Hash,
  List,
  Base,
  FormBaseCase,
  FormLikeCase,
} from '~/code/type.js'

const TYPE: Record<string, string> = {
  boolean: 'boolean',
  number: 'number',
  decimal: 'number',
  integer: 'number',
  natural_number: 'number',
  array_buffer: 'ArrayBuffer',
  blob: 'Blob',
  json: 'object',
  string: 'string',
  timestamp: 'Date',
  date: 'Date',
  uuid: 'string',
}

export type HoldFile = {
  file: FileName
  form?: 'form' | 'hash' | 'list' | 'test'
}

export type Hold = {
  // map export to file
  save: Record<TypeName, HoldFile>
  // map file to import
  load: Load
}

export type FileName = string

export type TypeName = string

export type Load = Record<FileName, Record<TypeName, boolean>>

/**
 * Make types in the `~/code/type/index.ts` file.
 */

export default function make(base: Base, hold: Hold, need = false) {
  const hash: Record<string, Array<string>> = {}

  for (const name in base.link) {
    const site = base.link[name]
    if (site) {
      const file = `${site.save}/index`

      hold.load[file] ??= {}

      hash[file] ??= []
    }
  }

  for (const name in base.link) {
    const site = base.link[name]
    if (!site) {
      continue
    }

    const file = `${site.save}/index`

    const list = hash[file]

    if (!list) {
      continue
    }

    switch (site.form) {
      case 'form':
        make_form({ form: site, base, name, hold, file, need }).forEach(
          line => {
            list.push(line)
          },
        )
        break
      case 'hash':
        make_hash({ hash: site, base, name, hold, file, need }).forEach(
          line => {
            list.push(line)
          },
        )
        break
      case 'list':
        make_list({ list: site, base, name, hold, file, need }).forEach(
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
  need = false,
}: {
  name: string
  form: Form
  base: Base
  hold: Hold
  file: string
  need?: boolean
}) {
  const list: Array<string> = []
  const load = (hold.load[file] ??= {})

  const formName = makePascalName(name, need)

  if ('link' in form) {
    let base

    if (form.base) {
      const name = makePascalName(form.base, need)
      base = `${name} & `
      load[name] = true
    } else {
      base = ``
    }
    hold.save[formName] ??= { file, form: 'form' }
    list.push(`export type ${formName} = ${base}{`)
  } else if ('case' in form || 'fuse' in form) {
    hold.save[formName] ??= { file, form: 'form' }
    list.push(`export type ${formName} =`)
  }

  make_link_list({
    form,
    base,
    hold,
    file,
    need,
  }).forEach(line => {
    list.push(`  ${line}`)
  })

  if ('link' in form) {
    list.push(`}`)
  }

  return list
}

export function make_hash({
  name,
  hash,
  base,
  file,
  hold,
  need = false,
}: {
  name: string
  hash: Hash
  base: Base
  file: string
  hold: Hold
  need?: boolean
}) {
  if (!need) {
    return []
  }

  const list: Array<string> = []

  const typeValueName = makePascalName(`${name}_value`, need)

  list.push(`export type ${typeValueName} = `)

  if ('case' in hash.bond) {
    make_form_case({
      form: hash.bond,
      base,
      file,
      hold,
      need,
    }).forEach(line => {
      list.push(line)
    })
  } else {
    make_form_like({
      form: hash.bond,
      base,
      hold,
      file,
      need,
    }).forEach(line => {
      list.push(line)
    })
  }

  list.push(``)

  const load = (hold.load[file] ??= {})

  const typeName = makePascalName(name, need)

  hold.save[typeName] ??= { file, form: 'form' }
  hold.save[typeValueName] ??= { file, form: 'form' }

  if (hash.link) {
    const linkTypeName = findAndLinkName({
      like: hash.link,
      base,
      file,
      hold,
      need,
    })
    load[linkTypeName] = true
    list.push(
      `export type ${typeName} = Record<${linkTypeName}, ${typeValueName}>`,
    )
  } else {
    const keyList = Object.keys(hash.hash)
    const typeKeyName = makePascalName(`${name}_key`, need)

    hold.save[typeKeyName] ??= { file, form: 'list' }

    list.push(``)
    list.push(`export type ${typeKeyName} =
${keyList.map(key => `  | '${key}'`).join('\n')}`)

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
  need = false,
}: {
  name: string
  list: List
  base: Base
  file: string
  hold: Hold
  need?: boolean
}) {
  if (!need) {
    return []
  }

  const text: Array<string> = []

  const typeName = makePascalName(name, need)

  hold.save[typeName] ??= { file, form: 'list' }

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
  need = false,
}: {
  form: Form | FormLinkMesh
  base: Base
  hold: Hold
  file: string
  need?: boolean
}) {
  const list: Array<string> = []

  if ('link' in form) {
    for (const name in form.link) {
      const link = form.link[name]
      if (!link) {
        continue
      }
      const optional = link.need === false ? '?' : need ? '' : '?'
      const aS = link.list === true ? 'Array<' : ''
      const aE = link.list === true ? '>' : ''
      if (typeof link.like === 'string') {
        const type = findAndLinkName({
          like: link.like as string,
          base,
          file,
          hold,
          need,
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
                need,
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
              need,
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
          need,
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
    make_form_case({
      form: form as FormBaseCase,
      base,
      file,
      hold,
      need,
    }).forEach(line => {
      list.push(line)
    })
  } else if ('fuse' in form) {
    const formList: Array<string> = []
    const fuse = form.fuse as Array<FormLike>

    fuse.forEach(item => {
      const type = findAndLinkName({
        like: item.like as string,
        base,
        file,
        hold,
        need,
      })
      formList.push(type)
    })

    let formSite = `${formList.join(' & ')}`
    list.push(formSite)
  }

  return list
}

function make_form_case({
  form,
  base,
  hold,
  file,
  need = false,
}: {
  form: FormLikeCase
  base: Base
  hold: Hold
  file: string
  need?: boolean
}) {
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
        need,
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
  return [formSite]
}

function make_form_like({
  form,
  base,
  hold,
  file,
  need = false,
}: {
  form: FormLike
  base: Base
  hold: Hold
  file: string
  need?: boolean
}) {
  const formList: Array<string> = []
  const baseList: Array<any> = []
  const type = findAndLinkName({
    like: form.like,
    base,
    file,
    hold,
    need,
  })
  formList.push(type)
  return formList
}

function findAndLinkName({
  like,
  base,
  file,
  hold,
  need = false,
}: {
  like: string
  base: Base
  file: string
  hold: Hold
  need?: boolean
}): string {
  const type = TYPE[like]
  if (typeof type === 'string') {
    return type
  }

  const name = base.name[like]

  if (typeof name === 'string') {
    return name
  }

  const holdName = toPascalCase(like)
  const holdFile = hold.save[holdName]

  const load = (hold.load[file] ??= {})

  if (holdFile) {
    if (holdFile.form === 'list' || holdFile.form === 'hash') {
      load[holdName] = true
      return holdName
    }
  }

  const headName = makePascalName(like, need)

  load[headName] = true

  return headName
}

function makePascalName(base: string, need = false) {
  return `${toPascalCase(base)}${need ? '' : 'Optional'}`
}
