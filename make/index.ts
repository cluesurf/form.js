import love_code from '@termsurf/love-code'
import make_cast, { Hold } from './cast'
import make_take from './take'
import make_base from './base'
import { Load } from '~/code/cast'

export type Make = Load & Hold

export default async function make(make: Make) {
  const { testLink, baseLink, load, save, ...baseMesh } = make

  const hold = { load, save }

  const cast_list_hash = make_cast(baseLink, baseMesh, hold)
  const take_list_hash = make_take(baseLink, baseMesh, hold)
  const base_list_hash = make_base(baseLink, baseMesh, hold)

  const cast: Record<string, string> = {}
  const take: Record<string, string> = {}
  const base: Record<string, string> = {}

  for (const file in cast_list_hash) {
    const list = cast_list_hash[file]
    if (list?.length) {
      const base = [
        `import { BackList } from '@termsurf/form'`,
        ``,
        ...makeLoadList(hold, file),
        ...list,
      ]
      cast[file] = await love_code(base.join('\n'))
    }
  }

  for (const file in base_list_hash) {
    const list = base_list_hash[file]
    if (list?.length) {
      const baseList = [...makeLoadList(hold, file), ...list]

      base[file] = await love_code(baseList.join('\n'))
    }
  }

  for (const file in take_list_hash) {
    const list = take_list_hash[file]
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
    const fileLink = hold.save[name]
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
