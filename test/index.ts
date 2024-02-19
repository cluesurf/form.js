import * as form from './form'
import * as test from './test'
import make from '../make'
import fs from 'fs'
import { convertObjectKeyCase } from '../host'

make({ mesh: { ...form, ...test }, test: '~/test/test' }).then(
  ({ tree }) => {
    fs.writeFileSync('tmp/cast.ts', tree.cast as string)
    fs.writeFileSync('tmp/take.ts', tree.take as string)
    fs.writeFileSync('tmp/index.ts', tree.base as string)
  },
)

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
