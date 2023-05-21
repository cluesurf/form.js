export namespace Back {
  export namespace Form {
    export type Post = {
      authorId: string
      content: string
      createdAt: string
      id: string
      title: string
    }
    export type User = {
      email?: string | null | undefined
      id: string
      name: string
    }
  }
  export type Base = {
    post: Form.Post
    user: Form.User
  }
  export type Name = keyof Base
}
