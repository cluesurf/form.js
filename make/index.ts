import { Load } from '~/code/cast.js'
import make_tree from './tree/index.js'

export default async function make(load: Load) {
  // const call = await make_call(mesh)
  // const load = await make_load(mesh)
  // const form = await make_form(mesh)
  const tree = await make_tree(load)

  // return { call, load, form, tree }
  return { tree }
}
