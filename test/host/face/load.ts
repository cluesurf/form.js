import { z } from 'zod'
import { Form, Name, Base } from './form.js'
export const PostLoad: z.ZodType<Form.Post> = z.object({
  author: z.lazy(() => UserLoad),
  content: z.string(),
  createdAt: z.string().datetime(),
  id: z.string(),
  title: z.string(),
})

export const UserLoad: z.ZodType<Form.User> = z.object({
  email: z.optional(z.string()),
  id: z.string(),
  name: z.string(),
  posts: z.array(z.lazy(() => PostLoad)),
})
