import love_code from '@termsurf/love-code'
import make_cast from './cast.js'
import make_line from './line.js'
import make_take from './take.js'
import { Load } from '~/code/cast.js'

export default async function make(load: Load) {
  const { test, mesh } = load

  const cast_list: Array<string> = []
  cast_list.push(...make_cast(mesh))

  const line_list: Array<string> = []
  line_list.push(...make_line(mesh))

  const take_list: Array<string> = []
  take_list.push(...make_take(test, mesh))

  const base = `export * from './cast'
export * from './take'
export * from './line'
`

  const cast = await love_code(cast_list.join('\n'))
  const line = await love_code(line_list.join('\n'))
  const take_text = await love_code(take_list.join('\n'))
  return { base, cast, line, take: take_text }
}
