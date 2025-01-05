import love_code from '@termsurf/love-code'
import make_types, { Hold } from './types.js'
import make_parsers from './parsers.js'
import make_constants from './constants.js'
import { Load } from '~/code/type.js'

export type Make = Load

export type MakeBack = {
  type: Record<string, string>
  parser: Record<string, string>
  constant: Record<string, string>
}

export default async function make({
  testLink,
  ...baseMesh
}: Make): Promise<MakeBack> {
  const hold: Hold = { load: {}, save: {} }

  const type_list_hash = make_types(baseMesh, hold)
  const parser_list_hash = make_parsers(baseMesh, hold)
  const constant_list_hash = make_constants(baseMesh, hold)

  const type: Record<string, string> = {}
  const parser: Record<string, string> = {}
  const constant: Record<string, string> = {}

  for (const file in type_list_hash) {
    const list = type_list_hash[file]
    if (list?.length) {
      const castList = [...makeLoadList(hold, file), ...list]
      type[file] = await love_code(castList.join('\n'))
    }
  }

  for (const file in constant_list_hash) {
    const list = constant_list_hash[file]
    if (list?.length) {
      const castList = [...makeLoadList(hold, file), ...list]

      constant[file] = await love_code(castList.join('\n'))
    }
  }

  for (const file in parser_list_hash) {
    const list = parser_list_hash[file]
    if (list?.length) {
      const base = [
        `import { z } from 'zod'`,
        `import { LOAD, MAKE, TEST } from '@cluesurf/form'`,
        `import * as code from '${testLink}'`,
        ``,
        ...makeLoadList(hold, file),
        ...list,
      ]

      parser[file] = await love_code(base.join('\n'))
    }
  }

  return { type, parser, constant }
}

function makeLoadList(hold: Hold, file: string) {
  const hash: Record<string, Array<string>> = {}
  const text: Array<string> = []
  const load = hold.load![file]!

  for (const name in load) {
    const holdFile = hold.save[name]
    const fileLink = holdFile?.file
    if (!fileLink || file === fileLink) {
      continue
    }
    const list = (hash[fileLink] ??= [])
    list.push(name)
  }

  for (const file in hash) {
    const list = hash[file]!

    text.push(`import { ${list.sort().join(', ')} } from '${file}'`)
  }

  text.push(``)

  return text
}
