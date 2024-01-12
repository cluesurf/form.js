import * as mesh from './form'
import make from '~/make'
import fs from 'fs'

make({ link: '~/test/form', mesh }).then(({ tree }) => {
  fs.writeFileSync('tmp/cast.ts', tree.cast as string)
  fs.writeFileSync('tmp/take.ts', tree.take as string)
  fs.writeFileSync('tmp/index.ts', tree.base as string)
})
