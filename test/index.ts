import * as MESH from './form'
import * as test from './test'
import makeTree from '../make'
import fs from 'fs'
import { BaseHash, convertObjectKeyCase } from '../host'
import path from 'path'

const NAME = {
  html_div_element: 'HTMLDivElement',
}

const HOLD = {
  save: {},
  load: {},
}

export type Test = (text: string) => boolean

make()

async function make() {
  await makeForm('base', (text: string) => !text.match(`_node_`))
  await makeForm('node', (text: string) => !!text.match(`_node_`))
}

async function makeForm(type: string, test: Test) {
  const mesh = makeMesh(MESH, test)
  const tree = await makeTree({
    name: NAME,
    mesh: { ...MESH, ...test },
    link: { ...mesh, ...test },
    testLink: '~/test/test',
    baseLink: `~/test/hold/${type}`,
    ...HOLD,
  })

  for (const name in tree.cast) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.cast[name] as string)
  }

  for (const name in tree.take) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.take[name] as string)
  }

  for (const name in tree.base) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.base[name] as string)
  }
}

console.log(
  convertObjectKeyCase(
    {
      FooBar: {
        helloWorld: true,
      },
    },
    'snakeCase',
  ),
)

console.log(
  convertObjectKeyCase(
    {
      foo_bar: {
        hello_world: true,
      },
    },
    'camelCase',
  ),
)

function makeMesh(base: BaseHash, test: Test) {
  const mesh: BaseHash = {}
  for (const name in base) {
    if (test(name)) {
      mesh[name] = base[name]
    }
  }
  return mesh
}
