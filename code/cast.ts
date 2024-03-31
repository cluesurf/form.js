import { RefinementCtx } from 'zod'

export type Load = Base & {
  testLink: string
  baseLink: string
}

export type FormBond = string | number | boolean | null

export type FormBase = {
  form: 'form'
  file?: string
  save?: boolean
  test?: (bond: any, link?: any) => boolean
  note?: string
}

export type FormBaseCase = FormBase & {
  case: Array<FormLike>
}

export type FormLike = {
  like: string
  test?: (bond: any, link?: any) => boolean
  note?: string
}

export type FormBaseFuse = FormBase & {
  fuse: Array<FormLike>
}

export type FormBaseLink = FormBase & {
  base?: string
  link: FormLinkMesh
  name?: string
  make?: string
  leak?: boolean
  load?: Array<string>
}

export type Form = FormBaseCase | FormBaseFuse | FormBaseLink

export type BaseHash = Record<
  string,
  Form | Hash | List | Test | Make | Read
>

export type NameHash = Record<string, string>

export type Base = {
  mesh: BaseHash
  link: BaseHash
  name: NameHash
}

export type FormLinkMesh = Record<string, FormLink>

export type FormLink = {
  head?: string
  note?: string
  back?: string
  base?: string
  fall?: any
  bind?: FormBond | Record<string, FormBond> | Array<FormBond>
  fill?: boolean
  hold?: boolean
  like?: string
  case?: Record<string, FormLink> | Array<FormLink>
  fuse?: Array<FormLink>
  bond?: FormLink
  link?: FormLinkMesh
  list?: boolean
  name?: {
    base?: string // database name
    mark?: string // cli short name
  }
  need?: boolean
  size?:
    | number
    | {
        fall?: number
        fall_meet?: number
        rise?: number
        rise_meet?: number
      }
  take?: Array<any>
  test?: string
  trim?: boolean
}

export type Hash = {
  form: 'hash'
  file?: string
  hash: Record<string, any>
  link?: string
  bond: FormLinkMesh
}

export type List = {
  form: 'list'
  file?: string
  list: Array<any>
}

export type Test = {
  form: 'test'
  file?: string
  test: (bond: any, name: string) => boolean | string | TestBack
}

export type Make = {
  form: 'make'
  file?: string
  make: (bond: any, ctx: RefinementCtx, name: string) => any
}

export type TestBack = {
  message?: string
  path?: Array<string>
  params?: any
}

export type Read = {
  form: 'read'
  file?: string
  like: string
} & ReadBase

export type ReadBase = {
  list?: boolean
  tree?: boolean // traverse down the tree branches
  base?: boolean // traverse up the tree branch
  size?: boolean
  sort?: Array<Sort>
  need?: boolean
  link?: Record<string, ReadLink>
}

export type ReadLink = ReadBase | boolean

export type Sort = {
  link: string
  side: 'rise' | 'fall'
}

export type Back = Record<string, any>

export type BackList<T extends Back> = {
  size?: number
  list: Array<T>
}

export type DeepRequired<T> = {
  [K in keyof T]: DeepRequired<T[K]>
} & Required<T>
