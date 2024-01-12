import love_code from '@termsurf/love-code'
import make_cast from './cast'
import make_take from './take'
import { FormLoad, FormMesh } from '~/code/cast'

export default async function make(load: FormLoad) {
  const cast_list: Array<string> = []
  const { link, mesh } = load
  cast_list.push(...make_cast(mesh))

  const take_list: Array<string> = []
  take_list.push(...make_take(link, mesh))

  const base = `export * from './cast'
export * from './take'
`

  const cast = await love_code(cast_list.join('\n'))
  const take_text = await love_code(take_list.join('\n'))
  return { base, cast, take: take_text }
}
