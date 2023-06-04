import fs from 'fs'

import type { Form } from '../index.js'
import make from '../make/index.js'

const User: Form = {
  dock: 'id',
  link: {
    email: { form: 'text', void: true },
    id: { form: 'uuid' },
    name: { form: 'text' },
    posts: { back: 'author', form: 'post', list: true },
  },
}

const Post: Form = {
  dock: 'id',
  link: {
    author: { form: 'user', site: { form: 'uuid', name: 'authorId' } },
    content: { form: 'text' },
    createdAt: { form: 'date' },
    id: { form: 'uuid' },
    title: { form: 'text', size: { base: 3 } },
  },
}

const Base = {
  post: Post,
  user: User,
}

start()

async function start() {
  const { face, back } = await make(Base)
  fs.writeFileSync('./test/host/back/form.ts', back.form)
  fs.writeFileSync('./test/host/back/load.ts', back.load)
  fs.writeFileSync('./test/host/face/form.ts', face.form)
  fs.writeFileSync('./test/host/face/load.ts', face.load)
}
