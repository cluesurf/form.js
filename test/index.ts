import * as MESH from './form'
import * as test from './test'
import makeTree from '../make'
import fs from 'fs'
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
    codeLink: '.',
  })

  for (const name in tree.form) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.form[name] as string)
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
