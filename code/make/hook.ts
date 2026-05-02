/**
 * Built-in operator implementations.
 *
 * Each export is a named function — same shape as task
 * implementations in a project's `task.ts`. Pulled together
 * via `import * as hook from './hook'` and merged into the
 * default `HookHash` consumed by the flow renderer.
 *
 * Locale-aware operators (plural, number, date, etc.) are
 * backed by `@formatjs/intl`, which wraps the native
 * `Intl.*` constructors with cross-engine quirk smoothing
 * and per-locale instance caching. Constructing
 * `Intl.NumberFormat` etc. is expensive (~100 µs) and a
 * page can render hundreds of values; the cache keeps
 * subsequent calls cheap.
 */

import {
  createIntl,
  createIntlCache,
  type FormatDateOptions,
  type FormatListOptions,
  type FormatNumberOptions,
  type FormatPluralOptions,
  type FormatRelativeTimeOptions,
  type IntlShape,
} from '@formatjs/intl'
import type { BaseContext } from './flow/render/registry'
import { deepEq } from './flow/task'

// ---------------------------------------------------------------------------
// Intl shape cache (formatjs)
// ---------------------------------------------------------------------------

const intlCache = createIntlCache()
const intlByLocale = new Map<string, IntlShape>()

function getIntl(locale: string): IntlShape {
  let intl = intlByLocale.get(locale)
  if (!intl) {
    intl = createIntl({ locale, messages: {} }, intlCache)
    intlByLocale.set(locale, intl)
  }
  return intl
}

// ---------------------------------------------------------------------------
// Locale read
// ---------------------------------------------------------------------------

const DEFAULT_LOCALE = 'en'

/**
 * Read the active locale from the render context's scope.
 *
 * The convention: `flow.scope({ locale: 'fr', ... })` —
 * `locale` is a reserved scope key. The site-text runtime
 * sets it via `flow.scope(input, getActiveScope(locale))`
 * before each render. Falls back to `'en'` outside any
 * locale context.
 */
function readLocale(context?: BaseContext): string {
  const v = context?.scope.get('locale')
  return typeof v === 'string' ? v : DEFAULT_LOCALE
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

export const eq = ({ a, b }: Record<string, unknown>) => deepEq(a, b)

export const ne = ({ a, b }: Record<string, unknown>) => !deepEq(a, b)

export const gt = ({ a, b, subject }: Record<string, unknown>) =>
  Number((a ?? subject) as number) > Number(b as number)

export const gte = ({ a, b, subject }: Record<string, unknown>) =>
  Number((a ?? subject) as number) >= Number(b as number)

export const lt = ({ a, b, subject }: Record<string, unknown>) =>
  Number((a ?? subject) as number) < Number(b as number)

export const lte = ({ a, b, subject }: Record<string, unknown>) =>
  Number((a ?? subject) as number) <= Number(b as number)

export const inOf = ({
  value,
  list,
  subject,
}: Record<string, unknown>) => {
  const v = value ?? subject
  return Array.isArray(list) && list.some(item => deepEq(item, v))
}

export const negate = ({ value }: Record<string, unknown>) => !value

export const and = ({ values }: Record<string, unknown>) =>
  Array.isArray(values) && values.every(Boolean)

export const or = ({ values }: Record<string, unknown>) =>
  Array.isArray(values) && values.some(Boolean)

export const isNull = ({ value }: Record<string, unknown>) =>
  value == null

export const isEmpty = ({ value }: Record<string, unknown>) => {
  if (value == null) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

export const count = ({ list }: Record<string, unknown>) =>
  Array.isArray(list) ? list.length : 0

export const sum = ({ list }: Record<string, unknown>) =>
  Array.isArray(list) ? list.reduce((s, n) => s + Number(n), 0) : 0

export const mean = ({ list }: Record<string, unknown>) => {
  if (!Array.isArray(list) || list.length === 0) return 0
  return list.reduce((s, n) => s + Number(n), 0) / list.length
}

export const min = ({ list }: Record<string, unknown>) =>
  Array.isArray(list) ? Math.min(...list.map(n => Number(n))) : 0

export const max = ({ list }: Record<string, unknown>) =>
  Array.isArray(list) ? Math.max(...list.map(n => Number(n))) : 0

// ---------------------------------------------------------------------------
// Derives
// ---------------------------------------------------------------------------

type PluralArgs = {
  value: unknown
  options?: FormatPluralOptions
} & Record<string, unknown>

export const plural = (
  { value, options }: PluralArgs,
  context?: BaseContext,
) => getIntl(readLocale(context)).formatPlural(Number(value), options)

export const length = ({ value }: Record<string, unknown>) =>
  value == null ? 0 : String(value).length

// ---------------------------------------------------------------------------
// String case (locale-sensitive — native String methods)
// ---------------------------------------------------------------------------

export const lowercase = (
  { value }: Record<string, unknown>,
  context?: BaseContext,
) => String(value ?? '').toLocaleLowerCase(readLocale(context))

export const uppercase = (
  { value }: Record<string, unknown>,
  context?: BaseContext,
) => String(value ?? '').toLocaleUpperCase(readLocale(context))

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
//
// Each formatter accepts `{ value, options }` OR hoisted
// option keys (`{ value, year, month, ... }`). The
// rest-spread captures the latter shape when no explicit
// `options` is passed.

type NumberArgs = {
  value: unknown
  options?: FormatNumberOptions
} & Record<string, unknown>

export const number = (
  { value, options, ...rest }: NumberArgs,
  context?: BaseContext,
) => {
  const opts = (options ?? rest) as FormatNumberOptions
  return getIntl(readLocale(context)).formatNumber(Number(value), opts)
}

export const currency = (
  { value, code }: { value: unknown; code: unknown },
  context?: BaseContext,
) =>
  getIntl(readLocale(context)).formatNumber(Number(value), {
    style: 'currency',
    currency: String(code),
  })

export const percent = (
  { value }: { value: unknown },
  context?: BaseContext,
) =>
  getIntl(readLocale(context)).formatNumber(Number(value), {
    style: 'percent',
  })

type DateArgs = {
  value: unknown
  options?: FormatDateOptions
} & Record<string, unknown>

export const date = (
  { value, options, ...rest }: DateArgs,
  context?: BaseContext,
) => {
  const d = value instanceof Date ? value : new Date(String(value))
  const opts = (options ?? rest) as FormatDateOptions
  return getIntl(readLocale(context)).formatDate(d, opts)
}

export const time = (
  { value, options, ...rest }: DateArgs,
  context?: BaseContext,
) => {
  const d = value instanceof Date ? value : new Date(String(value))
  const opts = (options ?? rest) as FormatDateOptions
  return getIntl(readLocale(context)).formatTime(d, opts)
}

type RelativeArgs = {
  value: unknown
  unit: unknown
  options?: FormatRelativeTimeOptions
} & Record<string, unknown>

export const relative = (
  { value, unit, options, ...rest }: RelativeArgs,
  context?: BaseContext,
) => {
  const opts = (options ?? rest) as FormatRelativeTimeOptions
  return getIntl(readLocale(context)).formatRelativeTime(
    Number(value),
    unit as Intl.RelativeTimeFormatUnit,
    opts,
  )
}

type ListArgs = {
  values: unknown
  options?: FormatListOptions
} & Record<string, unknown>

export const list = (
  { values, options, ...rest }: ListArgs,
  context?: BaseContext,
) => {
  const opts = (options ?? rest) as FormatListOptions
  return getIntl(readLocale(context)).formatList(
    (Array.isArray(values) ? values : []) as string[],
    opts,
  )
}

// ---------------------------------------------------------------------------
// Host
// ---------------------------------------------------------------------------

export const now = () => new Date()

export const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
