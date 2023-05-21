import make, { BaseForm } from './index.js'

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

const { face, back } = make(Base)
console.log(back)
console.log(face)
