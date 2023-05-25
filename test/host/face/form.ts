export namespace Face {
  export namespace Form {
    export type Post = {
      author: User
      content: string
      createdAt: string
      id: string
      title: string
    }

    export type User = {
      email?: string | null | undefined
      id: string
      name: string
      posts: Array<Post>
    }
  }

  export type Base = {
    post: Form.Post
    user: Form.User
  }

  export type Name = keyof Base
}
