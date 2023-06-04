import { Base } from '../index.js'
import makeFace from './face.js'
import makeBack from './back.js'
import makeSite from './site.js'

export default async function make(base: Base) {
  const face = await makeFace(base)
  const back = await makeBack(base)
  const site = await makeSite(base)
  return { back, face, site }
}
