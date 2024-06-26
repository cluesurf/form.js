import love_code from '@termsurf/love-code'
import make_type, { Hold } from './type'
import make_parser from './parser'
import make_data from './data'
import { Load } from '~/code/type'

export type Make = Load & Hold

export default async function make(make: Make) {
  const { testLink, baseLink, load, save, ...baseMesh } = make

  const hold = { load, save }

  const type_list_hash = {
    ...make_type(baseLink, baseMesh, hold, true),
    ...make_type(`${baseLink}/optional`, baseMesh, hold, false),
  }
  const parser_list_hash = make_parser(baseLink, baseMesh, hold)
  const data_list_hash = make_data(baseLink, baseMesh, hold)

  const cast: Record<string, string> = {}
  const take: Record<string, string> = {}
  const base: Record<string, string> = {}

  for (const file in type_list_hash) {
    const list = type_list_hash[file]
    if (list?.length) {
      const castList = [
        `import merge from 'lodash/merge'`,
        ...makeLoadList(hold, file),
        ...list,
      ]
      cast[file] = await love_code(castList.join('\n'))
    }
  }

  for (const file in data_list_hash) {
    const list = data_list_hash[file]
    if (list?.length) {
      const castList = [...makeLoadList(hold, file), ...list]

      base[file] = await love_code(castList.join('\n'))
    }
  }

  for (const file in parser_list_hash) {
    const list = parser_list_hash[file]
    if (list?.length) {
      const base = [
        `import { z } from 'zod'`,
        `import { LOAD, MAKE, TEST } from '@termsurf/form'`,
        `import * as code from '${testLink}'`,
        ``,
        ...makeLoadList(hold, file),
        ...list,
      ]

      take[file] = await love_code(base.join('\n'))
    }
  }

  return { cast, take, base }
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
