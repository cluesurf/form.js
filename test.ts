import type { BaseForm } from './index.js'
import make from './make.js'

const User: BaseForm = {
  dock: 'id',
  link: {
    email: { form: 'text', void: true },
    id: { form: 'uuid' },
    name: { form: 'text' },
    posts: { back: 'author', form: 'post', list: true },
  },
}

const Post: BaseForm = {
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
  console.log(back.form)
  console.log(back.test)
  console.log(face.form)
  console.log(face.test)
}
