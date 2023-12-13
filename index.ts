import dayjs, { Dayjs } from 'dayjs'
import {
  testCode,
  formCodeHost,
  formHostCode,
  testHost,
} from '@termsurf/tone-code'
import { HaltMesh } from '@termsurf/halt'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Base = {
  // dependencies on other bases
  bind?: Array<Base>
  // name of the project
  deck: string
  // map of the forms
  form: Record<string, Form>
  // name of the organization
  host: string
  // aliases for form names
  link?: Record<string, string>
}

export type Form = FormMesh | FormCode

export type FormMesh = {
  // primary key
  dock?: string | Array<string>
  // columns/properties
  link: Record<string, FormLink>
  // table name in db.
  name?: string
}

export enum FormSort {
  BaseMark = 'base_mark',
  // bigint
  Date = 'date',
  Mark = 'mark',
  // smallint
  RiseMark = 'rise_mark',
  Text = 'text',
  Wave = 'wave',
}

export type FormCode = {
  // the base primitive type of this form.
  base: FormSort
  // formatters for going between the 3 states
  host?: FormLinkHost
  // validation on size of the value.
  size?: FormLinkSize
  // accepted values.
  take?: Array<unknown>
  // test whether it matches a pattern.
  test?: (bond: unknown) => boolean
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

export type FormLinkHold = {
  like: string
  name: string
}

export type FormLink = {
  // name of the return property.
  back?: string
  // default value.
  base?: unknown
  // whether or not this column is searchable.
  find?: boolean
  // how this is saved in the database
  hold?: Record<string, FormLinkHold>
  // formatters for going between the 3 states
  host?: FormLinkHost
  // the accepted types, arrays mean it's polymorphic.
  like?: Array<string> | string
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
  test?: FormLinkTest | Array<FormLinkTest>
  // whether or not it's nullable.
  void?: boolean
}

export type FormLinkTest = {
  halt?: (lead: any) => HaltMesh
  hook: (lead: any) => boolean
}

export type FormLinkHostHookMake = (base: any) => any
export type FormLinkHostHookTest = (base: any) => boolean

export type FormLinkHostHookLink = {
  make?: FormLinkHostHookMake
  test?: FormLinkHostHookTest
}

export type FormLinkHostHook = {
  // outgoing below
  base?: FormLinkHostHookLink
  // incoming below
  baseSelf?: FormLinkHostHookLink
  // outgoing above
  head?: FormLinkHostHookLink
  // incoming above
  headSelf?: FormLinkHostHookLink
}

export type FormLinkHostHookName = keyof FormLinkHostHook

export type FormLinkHost = {
  // database
  back?: FormLinkHostHook
  // frontend
  face?: FormLinkHostHook
  // backend before database
  site?: FormLinkHostHook
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

const DATE_TEST =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/

const testDate = (text: string) => DATE_TEST.test(text)

const CODE_HOST = {
  face: {
    baseSelf: {
      make: formHostCode,
      test: testHost,
    },
  },
  site: {
    headSelf: {
      make: formCodeHost,
      test: testCode,
    },
  },
} satisfies FormLinkHost

const DATE_HOST = {
  back: {
    base: {
      make: (date: Dayjs) => date.toDate(),
    },
  },
  face: {
    base: {
      make: (date: string) => dayjs(date),
      test: testDate,
    },
  },
  site: {
    baseSelf: {
      make: (date: string) => dayjs(date),
      test: testDate,
    },
    headSelf: {
      make: (date: string) => dayjs(date),
      test: testDate,
    },
  },
} satisfies FormLinkHost

const base = {
  deck: 'form',
  form: {
    base_mark: {
      base: FormSort.BaseMark,
    },
    code: {
      base: FormSort.Text,
      host: CODE_HOST,
    },
    date: {
      base: FormSort.Date,
      host: DATE_HOST,
    },
    mark: {
      base: FormSort.Mark,
    },
    rise_mark: {
      base: FormSort.RiseMark,
    },
    wave: {
      base: FormSort.Wave,
    },
  },
  host: 'termsurf',
}

export default base
