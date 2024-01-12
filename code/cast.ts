export type FormLoad = {
  link: string
  mesh: FormMesh
}

export type FormBond = string | number | boolean | null

export type FormBase = {
  test?: (bond: any, link?: any) => boolean
  note?: string
}

export type FormBaseCase = FormBase & {
  case: Array<string | number | { like: string }>
}

export type FormBaseFuse = FormBase & {
  fuse: Array<{ like: string }>
}

export type FormBaseLink = FormBase & {
  link: FormLinkMesh
}

export type Form = FormBaseCase | FormBaseFuse | FormBaseLink

export type FormMesh = Record<string, Form>

export type FormLinkMesh = Record<string, FormLink>

export type FormLink = {
  note?: string
  back?: string
  base?: any
  bind?: FormBond | Record<string, FormBond> | Array<FormBond>
  fill?: boolean
  hold?: boolean
  like?: string
  case?: Array<FormLink>
  fuse?: Array<FormLink>
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
  test?: {
    call: (bond: any, link?: any) => boolean
    note: string | ((bond: any) => string)
  }
  trim?: boolean
}
