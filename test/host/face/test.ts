import { z } from 'zod'
import { Face } from './form.js'
export const PostTest: z.ZodType<Face.Form.Post> = z.object({
  author: z.lazy(() => UserTest),
  content: z.string(),
  createdAt: z.string().datetime(),
  id: z.string(),
  title: z.string(),
})

export const UserTest: z.ZodType<Face.Form.User> = z.object({
  email: z.optional(z.string()),
  id: z.string(),
  name: z.string(),
  posts: z.array(z.lazy(() => PostTest)),
})

export const Test: Record<Face.Name, z.ZodTypeAny> = {
  post: PostTest,
  user: UserTest,
}
export function need<Name extends Face.Name>(
  bond: unknown,
  form: Name,
): asserts bond is Face.Base[Name] {
  const test = Test[form]
  test.parse(bond)
}
export function test<Name extends Face.Name>(
  bond: unknown,
  form: Name,
): bond is Face.Base[Name] {
  const test = Test[form]
  const make = test.safeParse(bond)
  if ('error' in make) {
    console.log(make.error)
  }
  return make.success
}
export function take<Name extends Face.Name>(
  bond: unknown,
  form: Name,
): Face.Base[Name] {
  const test = Test[form] as z.ZodType<Face.Base[Name]>
  return test.parse(bond)
}
