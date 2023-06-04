/* eslint-disable @typescript-eslint/no-explicit-any */
export type Base = Record<string, Form>

export type Form = FormMesh | FormCode

export type FormMesh = {
  // primary key
  dock?: string | Array<string>
  // columns/properties
  link: Record<string, FormLink>
  // table name in db.
  name?: string
}

export enum Sort {
  Date = 'date',
  Mark = 'mark',
  Text = 'text',
  Time = 'time',
  Wave = 'wave',
}

export type FormCode = {
  // the base primitive type of this form.
  base: Sort
  // formatters for going between the 3 states
  host?: FormLinkHost
  // validation on size of the value.
  size?: FormLinkSize
  // accepted values.
  take?: Array<unknown>
  // test whether it matches a pattern.
  test?: (bond: unknown) => boolean
}

// this is the tree structure the types
// get compiled down into so there is no
// polymorphism or other complexity.
export type FormTree = {
  form?: string
  host?: FormLinkHost
  link?: Record<string, FormTree>
  name?: Record<string, FormTree>
  size?: FormLinkSize
  take?: Array<unknown>
  test?: (lead: unknown) => boolean
  void?: boolean
}

export type FormLinkNest = FormLinkNestRoll | FormLinkNestLike

export type FormLinkNestRoll = {
  form: 'roll'
  list: Array<FormLinkNestLike>
}

export type FormLinkNestLike = {
  form: 'like'
  nest: Form
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
  form?: Array<string> | string
  // formatters for going between the 3 states
  host?: FormLinkHost
  // nested properties.
  link?: FormLinkNest
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
  base?: (base: any) => any
  // incoming below
  baseSelf?: (base: any) => any
  // outgoing above
  head?: (base: any) => any
  // incoming above
  headSelf?: (base: any) => any
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
