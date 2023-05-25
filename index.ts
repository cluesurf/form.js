export type Base = Record<string, Form>

export type Form = {
  dock: string
  link: Record<string, FormLink>
  name?: string
}

export type FormLink = {
  back?: string
  base?: unknown
  baseSize?: number
  code?: true
  find?: boolean
  form: Array<string> | string
  headSize?: number
  link?: {
    form: string
    name: string
  }
  list?: boolean
  name?: string
  take?: Array<unknown>
  void?: true
}
