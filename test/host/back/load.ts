import { z } from 'zod'
import { FormLinkHostMoveName } from '../../../index.js'
import { Form, Name, Base } from './form.js'

const Post_AuthorId_Load = z.string()
const Post_Content_Load = z.string()
const Post_CreatedAt_Load = z.string().datetime()
const Post_Id_Load = z.string()
const Post_Title_Load = z.string()
const Post_AuthorId_Base_Load = Post_AuthorId_Load
const Post_AuthorId_BaseSelf_Load = Post_AuthorId_Load
const Post_AuthorId_HeadSelf_Load = Post_AuthorId_Load
const Post_AuthorId_Head_Load = Post_AuthorId_Load
const Post_Content_Base_Load = Post_Content_Load
const Post_Content_BaseSelf_Load = Post_Content_Load
const Post_Content_HeadSelf_Load = Post_Content_Load
const Post_Content_Head_Load = Post_Content_Load
const Post_CreatedAt_Base_Load = Post_CreatedAt_Load
const Post_CreatedAt_BaseSelf_Load = Post_CreatedAt_Load
const Post_CreatedAt_HeadSelf_Load = Post_CreatedAt_Load
const Post_CreatedAt_Head_Load = Post_CreatedAt_Load
const Post_Id_Base_Load = Post_Id_Load
const Post_Id_BaseSelf_Load = Post_Id_Load
const Post_Id_HeadSelf_Load = Post_Id_Load
const Post_Id_Head_Load = Post_Id_Load
const Post_Title_Base_Load = Post_Title_Load
const Post_Title_BaseSelf_Load = Post_Title_Load
const Post_Title_HeadSelf_Load = Post_Title_Load
const Post_Title_Head_Load = Post_Title_Load
export const Post_Base_Load: z.ZodType<Form.Post> = z.object({
  authorId: Post_AuthorId_Base_Load,
  content: Post_Content_Base_Load,
  createdAt: Post_CreatedAt_Base_Load,
  id: Post_Id_Base_Load,
  title: Post_Title_Base_Load,
})

export const Post_BaseSelf_Load: z.ZodType<Form.Post> = z.object({
  authorId: Post_AuthorId_BaseSelf_Load,
  content: Post_Content_BaseSelf_Load,
  createdAt: Post_CreatedAt_BaseSelf_Load,
  id: Post_Id_BaseSelf_Load,
  title: Post_Title_BaseSelf_Load,
})

export const Post_HeadSelf_Load: z.ZodType<Form.Post> = z.object({
  authorId: Post_AuthorId_HeadSelf_Load,
  content: Post_Content_HeadSelf_Load,
  createdAt: Post_CreatedAt_HeadSelf_Load,
  id: Post_Id_HeadSelf_Load,
  title: Post_Title_HeadSelf_Load,
})

export const Post_Head_Load: z.ZodType<Form.Post> = z.object({
  authorId: Post_AuthorId_Head_Load,
  content: Post_Content_Head_Load,
  createdAt: Post_CreatedAt_Head_Load,
  id: Post_Id_Head_Load,
  title: Post_Title_Head_Load,
})

const User_Email_Load = z.optional(z.string())
const User_Id_Load = z.string()
const User_Name_Load = z.string()
const User_Email_Base_Load = User_Email_Load
const User_Email_BaseSelf_Load = User_Email_Load
const User_Email_HeadSelf_Load = User_Email_Load
const User_Email_Head_Load = User_Email_Load
const User_Id_Base_Load = User_Id_Load
const User_Id_BaseSelf_Load = User_Id_Load
const User_Id_HeadSelf_Load = User_Id_Load
const User_Id_Head_Load = User_Id_Load
const User_Name_Base_Load = User_Name_Load
const User_Name_BaseSelf_Load = User_Name_Load
const User_Name_HeadSelf_Load = User_Name_Load
const User_Name_Head_Load = User_Name_Load
export const User_Base_Load: z.ZodType<Form.User> = z.object({
  email: User_Email_Base_Load,
  id: User_Id_Base_Load,
  name: User_Name_Base_Load,
})

export const User_BaseSelf_Load: z.ZodType<Form.User> = z.object({
  email: User_Email_BaseSelf_Load,
  id: User_Id_BaseSelf_Load,
  name: User_Name_BaseSelf_Load,
})

export const User_HeadSelf_Load: z.ZodType<Form.User> = z.object({
  email: User_Email_HeadSelf_Load,
  id: User_Id_HeadSelf_Load,
  name: User_Name_HeadSelf_Load,
})

export const User_Head_Load: z.ZodType<Form.User> = z.object({
  email: User_Email_Head_Load,
  id: User_Id_Head_Load,
  name: User_Name_Head_Load,
})

export const load: Record<
  Name,
  Record<FormLinkHostMoveName, z.ZodTypeAny>
> = {
  post: {
    base: Post_Base_Load,
    baseSelf: Post_BaseSelf_Load,
    head: Post_Head_Load,
    headSelf: Post_HeadSelf_Load,
  },
  user: {
    base: User_Base_Load,
    baseSelf: User_BaseSelf_Load,
    head: User_Head_Load,
    headSelf: User_HeadSelf_Load,
  },
}
export function need<N extends Name>(
  bond: unknown,
  form: N,
  move: FormLinkHostMoveName,
): asserts bond is Base[N] {
  const test = load[form][move]
  test.parse(bond)
}
export function test<N extends Name>(
  bond: unknown,
  form: N,
  move: FormLinkHostMoveName,
): bond is Base[N] {
  const test = load[form][move]
  const make = test.safeParse(bond)
  if ('error' in make) {
    console.log(make.error)
  }
  return make.success
}
export function take<N extends Name>(
  bond: unknown,
  form: N,
  move: FormLinkHostMoveName,
): Base[N] {
  const test = load[form][move] as z.ZodType<Base[N]>
  return test.parse(bond)
}
