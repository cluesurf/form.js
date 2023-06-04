import { z } from 'zod'
import { Back } from './form.js'
export const PostTest: z.ZodType<Back.Form.Post> = z.object({
  authorId: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
  id: z.string(),
  title: z.string(),
})

export const UserTest: z.ZodType<Back.Form.User> = z.object({
  email: z.optional(z.string()),
  id: z.string(),
  name: z.string(),
})

export const Test: Record<Back.Name, z.ZodTypeAny> = {
  post: PostTest,
  user: UserTest,
}
export function need<Name extends Back.Name>(
  bond: unknown,
  form: Name,
): asserts bond is Back.Base[Name] {
  const test = Test[form]
  test.parse(bond)
}
export function test<Name extends Back.Name>(
  bond: unknown,
  form: Name,
): bond is Back.Base[Name] {
  const test = Test[form]
  const make = test.safeParse(bond)
  if ('error' in make) {
    console.log(make.error)
  }
  return make.success
}
export function take<Name extends Back.Name>(
  bond: unknown,
  form: Name,
): Back.Base[Name] {
  const test = Test[form] as z.ZodType<Back.Base[Name]>
  return test.parse(bond)
}
