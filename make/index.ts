import love_code from '@termsurf/love-code'
import make_cast, { Hold } from './cast'
import make_take from './take'
import { Load } from '~/code/cast'

export type Make = Load & Hold

export default async function make(make: Make) {
  const { testLink, baseLink, load, save, ...base } = make

  const hold = { load, save }

  const cast_list_hash = make_cast(baseLink, base, hold)

  const take_list_hash = make_take(baseLink, testLink, base, hold)
  const cast: Record<string, string> = {}
  const take: Record<string, string> = {}

  for (const file in cast_list_hash) {
    const list = cast_list_hash[file]
    if (list) {
      list.unshift(...makeLoadList(hold, file))
      cast[file] = await love_code(list.join('\n'))
    }
  }

  for (const file in take_list_hash) {
    const list = take_list_hash[file]
    if (list) {
      list.unshift(...makeLoadList(hold, file))
      take[file] = await love_code(list.join('\n'))
    }
  }

  return { cast, take }
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
