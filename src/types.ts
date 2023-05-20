/* eslint-disable sort-exports/sort-exports */
import { z } from 'zod'

export const LOAD_FIND_TEST = [
  'bond',
  'base_link_mark',
  'head_link_mark',
  'base_mark',
  'head_mark',
  'base_text',
  'miss_bond',
  'have_bond',
  'have_text',
] as const

export type Load = {
  find?: LoadFind
  read?: LoadRead
  save?: LoadSave
  task?: string
}

export type LoadFind = LoadFindLink | Array<LoadFindLink>

export type LoadFindBind = {
  form: 'bind'
  list: Array<LoadFindLink>
}

export type LoadFindLike = {
  base: LoadFindLikeLinkBond
  form: 'like'
  head: LoadFindLikeBond | LoadFindLikeLinkBond
  test: LoadFindTest
}

export type LoadFindLikeBond = string | boolean | null | number

export type LoadFindLikeLinkBond = {
  link: string
}

export type LoadFindLink = LoadFindLike | LoadFindRoll | LoadFindBind

export type LoadFindRoll = {
  form: 'roll'
  list: Array<LoadFindLink>
}

export type LoadFindTest = (typeof LOAD_FIND_TEST)[number]

export type LoadRead = {
  [key: string]: true | LoadReadLink
}

export type LoadReadLink = {
  find?: LoadFind
  read: LoadRead
}

export type LoadSave = {
  [key: string]: Array<LoadSaveBase> | LoadSaveBase
}

export type LoadSaveBase = {
  find?: LoadFind
  read?: LoadRead
  save?: LoadSave
  task?: string
}

export type LoadSort = {
  name: string
  tilt: '+' | '-'
}

export const Load: z.ZodType<Load> = z.object({
  find: z.optional(z.lazy(() => LoadFind)),
  read: z.optional(z.lazy(() => LoadRead)),
  save: z.optional(z.lazy(() => LoadSave)),
  task: z.optional(z.string()),
})

export const LoadFind: z.ZodType<LoadFind> = z.union([
  z.lazy(() => LoadFindLink),
  z.array(z.lazy(() => LoadFindLink)),
])

export const LoadRead: z.ZodType<LoadRead> = z.record(
  z.union([z.lazy(() => LoadReadLink), z.literal(true)]),
)

export const LoadSave: z.ZodType<LoadSave> = z.record(
  z.lazy(() => LoadSaveBase),
  z.array(z.lazy(() => LoadSaveBase)),
)

export const LoadFindBind: z.ZodType<LoadFindBind> = z.object({
  form: z.literal('bind'),
  list: z.array(z.lazy(() => LoadFindLink)),
})

export const LoadFindRoll: z.ZodType<LoadFindRoll> = z.object({
  form: z.literal('roll'),
  list: z.lazy(() => z.array(LoadFindLink)),
})

export const LoadFindTest = z.enum([
  'bond',
  'base_link_mark',
  'head_link_mark',
  'base_mark',
  'head_mark',
  'base_text',
  'miss_bond',
  'have_bond',
  'have_text',
])

export const LoadFindLike: z.ZodType<LoadFindLike> = z.object({
  base: z.lazy(() => LoadFindLikeLinkBond),
  form: z.literal('like'),
  head: z.union([
    z.lazy(() => LoadFindLikeLinkBond),
    z.lazy(() => LoadFindLikeBond),
  ]),
  test: LoadFindTest,
})

export const LoadFindLink: z.ZodType<LoadFindLink> = z.union([
  z.lazy(() => LoadFindLike),
  z.lazy(() => LoadFindRoll),
  z.lazy(() => LoadFindBind),
])

export const LoadFindLikeBond: z.ZodType<LoadFindLikeBond> = z.union([
  z.string(),
  z.boolean(),
  z.null(),
  z.number(),
])

export const LoadFindLikeLinkBond: z.ZodType<LoadFindLikeLinkBond> =
  z.object({
    link: z.string(),
  })

export const LoadReadLink: z.ZodType<LoadReadLink> = z.object({
  find: z.optional(LoadFind),
  read: LoadRead,
})

export const LoadSaveBase: z.ZodType<LoadSaveBase> = z.object({
  find: z.optional(LoadFind),
  read: z.optional(LoadRead),
  save: z.optional(LoadSave),
  task: z.optional(z.string()),
})

export const LoadSort: z.ZodType<LoadSort> = z.object({
  name: z.string(),
  tilt: z.enum(['+', '-']),
})
