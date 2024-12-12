import * as MESH from './form'
import * as test from './test'
import makeTree from '../make'
import fs from 'fs'
import { BaseHash, convertObjectKeyCase } from '../host'
import path from 'path'

const NAME = {
  html_div_element: 'HTMLDivElement',
}

make()

async function make() {
  const tree = await makeTree({
    name: NAME,
    mesh: { ...MESH, ...test },
    link: { ...MESH, ...test },
    testLink: '~/test/test',
  })

  for (const name in tree.type) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.type[name] as string)
  }

  for (const name in tree.parser) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.parser[name] as string)
  }

  for (const name in tree.constant) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.constant[name] as string)
  }
}

// console.log(
//   convertObjectKeyCase(
//     {
//       FooBar: {
//         helloWorld: true,
//       },
//     },
//     'snakeCase',
//   ),
// )

// console.log(
//   convertObjectKeyCase(
//     {
//       foo_bar: {
//         hello_world: true,
//       },
//     },
//     'camelCase',
//   ),
// )
