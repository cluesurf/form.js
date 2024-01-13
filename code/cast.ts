import { RefinementCtx } from 'zod'

export type Load = {
  test: string
  mesh: Mesh
}

export type FormBond = string | number | boolean | null

export type FormBase = {
  form: 'form'
  save?: boolean
  test?: (bond: any, link?: any) => boolean
  note?: string
}

export type FormBaseCase = FormBase & {
  case: Array<string | number | FormLike>
}

export type FormLike = { like: string }

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

export type Mesh = Record<string, Form | Hash | List | Test | Make>

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
  name?: string
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
  hash: Record<string, any>
  link?: string
  bond: Form
}

export type List = {
  form: 'list'
  list: Array<any>
}

export type Test = {
  form: 'test'
  test: (bond: any, name: string) => boolean | string | TestBack
}

export type Make = {
  form: 'make'
  test: (bond: any, ctx: RefinementCtx) => boolean | string | TestBack
}

export type TestBack = {
  message?: string
  path?: Array<string>
  params?: any
}
