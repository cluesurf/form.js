import fs from 'fs'

import type { Form } from '../index.js'
import make from '../make.js'

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
    author: { form: 'user', link: { form: 'uuid', name: 'authorId' } },
    content: { form: 'text' },
    createdAt: { form: 'date' },
    id: { form: 'uuid' },
    title: { baseSize: 3, form: 'text' },
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
  fs.writeFileSync('./test/host/back/test.ts', back.test)
  fs.writeFileSync('./test/host/face/form.ts', face.form)
  fs.writeFileSync('./test/host/face/test.ts', face.test)
}
