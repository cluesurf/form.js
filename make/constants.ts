import { toPascalCase } from '~/code/tool.js'
import snakeCase from 'lodash/snakeCase.js'
import { Hash, List, Base } from '~/code/type.js'
import { Hold } from './types.js'

/**
 * Make lists and hashes (data) in the `~/code/type/data/index.ts` file.
 */

export default function make(base: Base, hold: Hold) {
  const hash: Record<string, Array<string>> = {}

  for (const name in base.link) {
    const site = base.link[name]
    if (site) {
      const file = `${site.save}/constants`

      hold.load[file] ??= {}

      hash[file] ??= []
    }
  }

  for (const name in base.link) {
    const site = base.link[name]
    if (!site) {
      continue
    }

    const file = `${site.save}/constants`

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
  const TYPE_NAME = snakeCase(name).toUpperCase()

  load[typeName] = true

  if (hash.hash) {
    hold.save[TYPE_NAME] ??= { file }
  }

  if (hash.link) {
  } else {
    const keyList = Object.keys(hash.hash)
    const TYPE_NAME_KEY = `${TYPE_NAME}_KEY`
    const typeNameKey = `${typeName}Key`

    hold.save[TYPE_NAME_KEY] ??= { file }
    load[typeNameKey] = true

    list.push(
      `export const ${TYPE_NAME_KEY}: ReadonlyArray<${typeNameKey}> = ` +
        JSON.stringify(keyList, null, 2) +
        ' as const',
    )
    list.push(``)
  }

  if (hash.hash) {
    list.push(
      `export const ${TYPE_NAME}: ${typeName} = ` +
        JSON.stringify(hash.hash, null, 2),
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
  const TYPE_NAME = snakeCase(name).toUpperCase()
  const load = (hold.load[file] ??= {})

  load[typeName] = true
  hold.save[TYPE_NAME] ??= { file }

  text.push(
    `export const ${TYPE_NAME}: ReadonlyArray<${typeName}> = ` +
      JSON.stringify(list.list, null, 2),
  )

  return text
}
