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

export type MeshHash = Record<string, Form | Hash | List | Test | Make>

export type NameHash = Record<string, string>

export type Base = {
  mesh: MeshHash
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
