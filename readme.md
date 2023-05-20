# form.js

```
yarn add @tunebond/form.js
```

## Specification Examples

### JSON Form Schema

You first define your data model in JSON, then this is run through
codegen to generate the TypeScript definitions for frontend and backend.

```ts
// base/form.ts
const User = {
  id: { form: 'uuid', dock: true },
  name: { form: 'text' },
  email: { form: 'text', void: true },
  posts: { form: 'post', list: true, back: 'author' },
}

const Post = {
  id: { form: 'uuid', dock: true },
  title: { form: 'text', baseSize: 3 },
  author: { form: 'user', link: true },
  content: { form: 'text' },
  createdAt: { form: 'date' },
}

const Base = {
  user: User,
  post: Post,
}

export default Base
```

### Codegen

```ts
// /host/back/base.ts
const base = {
  user: {
    dock: 'id',
    link: {
      id: { form: 'uuid' },
    },
  },
}

export default base
```

```ts
// /host/back.ts
import base from './back/base'

export namespace Back {
  export namespace Form {
    export type User = {
      form: 'user'
      id: string
      name: string
      email?: string | null
    }

    export type Post = {
      form: 'post'
      id: string
      title: string
      authorId: string
      createdAt: string
    }
  }

  export type Base = {
    user: Form.User
    post: Form.Post
  }

  export type Name = keyof Base
}
```

```ts
// /host/face.ts
import base from './face/base'

export namespace Face {
  export namespace Form {
    export type User = {
      form: 'user'
      id: string
      name: string
      email?: string
      posts: Array<Post>
    }

    export type Post = {
      form: 'post'
      id: string
      title: string
      author: User
      createdAt: Date
    }
  }

  export type Base = {
    user: Form.User
    post: Form.Post
  }

  export type Name = keyof Base
}

export function need<Name extends Face.Name>(
  bond: unknown,
  name: Name,
): asserts bond is Face.Base[FormName] {
  if (!testForm(bond, name)) {
    throw new Error('invalid')
  }
}

export function test<Name extends Face.Name>(
  mesh: unknown,
  name: Name,
): mesh is Face.Base[FormName] {
  // missing required property
  // invalid property value
  // extranous property
  const noteList = []
  const form = base[name]
  needRecord(mesh)

  for (const name in mesh) {
    const bond = mesh[name]
    const linkForm = form.link[name]
  }
}

// parse from json
export function take() {}
```

### JSON Call Schema

Here you specify your allowed read depth and allowed save structure.

```ts
// base/call/read.ts
const read = {
  user: {
    read: {
      size: true,
      list: {
        read: {
          id: true,
          name: true,
          email: true,
          posts: {
            read: {
              size: true,
              list: {
                read: {
                  title: true,
                  // notice, no author, can't get the user.posts.author
                },
              },
            },
          },
        },
      },
    },
  },
  post: {
    read: {
      title: true,
      author: {
        read: {
          id: true,
          name: true,
          email: true,
          posts: {
            read: {
              size: true,
            },
          },
        },
      },
    },
  },
}

export default call
```

```ts
// base/call/make.ts
const make = {
  user: {
    save: {
      name: true,
      email: true,
    },
  },
}

export default make
```

## Queries

Then you can make your actual queries (loads).

```ts
export const findUserById = () => ({
  read: {
    user: {
      find: {
        form: 'like',
        base: 'name',
        test: 'bond',
        head: 'dawn',
      },
      read: {
        id: true,
        name: true,
        email: true,
        posts: {
          read: {
            size: true,
          },
        },
      },
    },
  },
})
```
