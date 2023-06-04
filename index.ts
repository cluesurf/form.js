/* eslint-disable @typescript-eslint/no-explicit-any */
export type Base = Record<string, Form | FormCode>

export type Form = {
  // primary key
  dock: string | Array<string>
  // columns/properties
  link: Record<string, FormLink>
  // table name in db.
  name?: string
}

export type FormCode = {
  // the base primitive type of this form.
  base: 'text' | 'mark' | 'wave' | 'time' | 'date'
  // formatters for going between the 3 states
  host?: FormLinkHost
  // validation on size of the value.
  size?: FormLinkSize
  // accepted values.
  take?: Array<unknown>
  // test whether it matches a pattern.
  test?: (bond: unknown) => boolean
}

export type FormLink = {
  // name of the return property.
  back?: string
  // default value.
  base?: unknown
  // if the ID is stored on this association.
  code?: true
  // whether or not this column is searchable.
  find?: boolean
  // the accepted types, arrays mean it's polymorphic.
  form: Array<string> | string
  // formatters for going between the 3 states
  host?: FormLinkHost
  // whether or not this is a list association/property.
  list?: boolean
  // name of the property in the database.
  name?: string
  // the database column for an association.
  site?: FormLinkSite
  // validation on size of the value.
  size?: FormLinkSize
  // accepted values.
  take?: Array<unknown>
  // test whether it matches a pattern.
  test?: (bond: unknown) => boolean
  // whether or not it's nullable.
  void?: true
}

export type FormLinkHostMove = {
  // outgoing below
  base?: (base: unknown) => any
  // incoming below
  baseSelf?: (base: unknown) => any
  // outgoing above
  head?: (base: unknown) => any
  // incoming above
  headSelf?: (base: unknown) => any
}

export type FormLinkHostMoveName = keyof FormLinkHostMove

export type FormLinkHost = {
  // database
  back?: FormLinkHostMove
  // frontend
  face?: FormLinkHostMove
  // backend before database
  site?: FormLinkHostMove
}

export type FormLinkSite = {
  form: string
  name: string
  // the polymorphic type if it's polymorphic.
  sort?: string
}

export type FormLinkSize = {
  base?: number
  head?: number
  mark?: number
}
