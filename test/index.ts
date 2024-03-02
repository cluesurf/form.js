import * as form from './form'
import * as test from './test'
import make from '../make'
import fs from 'fs'
import { convertObjectKeyCase } from '../host'
import path from 'path'

const NAME = {
  html_div_element: 'HTMLDivElement',
}

const HOLD = {
  save: {},
  load: {},
}

make({
  name: NAME,
  mesh: { ...form, ...test },
  testLink: '~/test/test',
  baseLink: `~/test/hold`,
  ...HOLD,
}).then(tree => {
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
})

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
