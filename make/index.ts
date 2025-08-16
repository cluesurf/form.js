import make_types, { Hold } from './form'
import make_parsers from './take'
import make_constants from './base'
import { Load } from '~/code/form'
import { washFileList } from './flow'

export type Make = Load

export interface MakeBack {
  form: Record<string, string>
  take: Record<string, string>
  base: Record<string, string>
}

export default async function make({
  testLink,
  ...baseMesh
}: Make): Promise<MakeBack> {
  const hold: Hold = { load: {}, save: {} }

  const type_list_hash = make_types(baseMesh, hold)
  const parser_list_hash = make_parsers(baseMesh, hold)
  const constant_list_hash = make_constants(baseMesh, hold)

  const form: Record<string, string> = {}
  const take: Record<string, string> = {}
  const base: Record<string, string> = {}

  for (const file in type_list_hash) {
    const list = type_list_hash[file]
    if (list?.length) {
      const castList = [...makeLoadList(hold, file), ...list]
      form[file] = castList.join('\n')
    }
  }

  for (const file in constant_list_hash) {
    const list = constant_list_hash[file]
    if (list?.length) {
      const castList = [...makeLoadList(hold, file), ...list]

      base[file] = castList.join('\n')
    }
  }

  for (const file in parser_list_hash) {
    const list = parser_list_hash[file]
    if (list?.length) {
      const castList = [
        `import { z } from 'zod'`,
        `import { LOAD, MAKE, TEST } from '@cluesurf/form'`,
        `import * as code from '${testLink}'`,
        ``,
        ...makeLoadList(hold, file),
        ...list,
      ]

      take[file] = castList.join('\n')
    }
  }

  return wash({ form, take, base })
}

async function wash(take: MakeBack): Promise<MakeBack> {
  const make: MakeBack = {
    form: await washList(take.form),
    take: await washList(take.take),
    base: await washList(take.base),
  }

  return make
}

async function washList(mesh: Record<string, string>) {
  const list = await washFileList(
    Object.keys(mesh).map(file => {
      const text = mesh[file]!
      // Convert ~ paths to valid file paths for ts-morph
      const virtualPath = file.replace(/^~/, 'virtual') + '.ts'
      return { file: virtualPath, text }
    }),
  )

  // Map back to original keys
  const originalKeys = Object.keys(mesh)
  return list.reduce((newMesh, site, index) => {
    const originalKey = originalKeys[index]!
    newMesh[originalKey] = site.text!
    return newMesh
  }, {})
}

function makeLoadList(hold: Hold, file: string) {
  const hash: Record<string, string[]> = {}
  const text: string[] = []
  const load = hold.load[file]!

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

    const fileBase = file.endsWith('/index')
      ? file.replace(/\/index$/, '')
      : file

    text.push(`import { ${list.sort().join(', ')} } from '${fileBase}'`)
  }

  text.push(``)

  return text
}
