export type Base = Record<string, BaseForm>

export type BaseForm = {
  dock?: string
  link: Record<string, BaseFormLink>
}

export type BaseFormLink = {
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
