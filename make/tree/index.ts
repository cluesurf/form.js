import love_code from '@termsurf/love-code'
import make_cast from './cast'
import make_take from './take'
import { Load } from '~/code/cast'

export default async function make(load: Load) {
  const { test, mesh } = load

  const cast_list: Array<string> = []
  cast_list.push(...make_cast(mesh))

  const take_list: Array<string> = []
  take_list.push(...make_take(test, mesh))

  const base = `export * from './cast'
export * from './take'
`

  const cast = await love_code(cast_list.join('\n'))
  const take_text = await love_code(take_list.join('\n'))
  return { base, cast, take: take_text }
}
