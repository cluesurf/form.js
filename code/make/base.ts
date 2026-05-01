import { toPascalCase } from '@/tool'
import snakeCase from 'lodash/snakeCase'
import { Flow, Hash, List, Base } from '@/form'
import { Hold } from './form'

/**
 * Make lists and hashes (data) in the `[...path]/base.ts` file.
 */

export default function make(base: Base, hold: Hold) {
  const hash: Record<string, string[]> = {}

  for (const name in base.link) {
    const site = base.link[name]
    if (site) {
      const file = `${site.save}/base`

      hold.load[file] ??= {}

      hash[file] ??= []
    }
  }

  for (const name in base.link) {
    const site = base.link[name]
    if (!site) {
      continue
    }

    const file = `${site.save}/base`

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
      case 'flow':
        make_flow({ flow: site, base, name, hold, file }).forEach(
          line => {
            list.push(line)
          },
        )
        break
    }
  }

  return hash
}

/**
 * Emit the `Flow` node tree as a const so consumers can do:
 *
 *   import { MESSAGE_COUNT_FLOW } from './hold/flow/base'
 *   flow.renderText({ form: 'weave', flow: MESSAGE_COUNT_FLOW }, context)
 *
 * The `flow:` payload is plain data; `JSON.stringify` round-trips
 * cleanly because builders only emit literal node objects.
 */

export function make_flow({
  name,
  flow,
  base,
  file,
  hold,
}: {
  name: string
  flow: Flow
  base: Base
  file: string
  hold: Hold
}) {
  const list: string[] = []
  const TYPE_NAME = `${snakeCase(name).toUpperCase()}_TREE`

  hold.save[TYPE_NAME] ??= { file }
  hold.load[file] ??= {}

  // The `Node` type comes from the package root. Inlined because
  // there's no schema entry to thread through `hold.save`.
  list.push(``)
  list.push(`import type { Node } from '@cluesurf/form'`)
  list.push(``)
  list.push(
    `export const ${TYPE_NAME}: Node[] = ` +
      JSON.stringify(flow.tree, null, 2),
  )

  return list
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
  const list: string[] = []

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
  const text: string[] = []

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
