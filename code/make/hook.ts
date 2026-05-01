/**
 * Built-in operator implementations.
 *
 * Each export is a named function — same shape as task
 * implementations in a project's `task.ts`. Pulled together
 * via `import * as hook from './hook'` and merged into the
 * default `HookHash` consumed by the flow renderer.
 */

import type { BaseContext } from './flow/render/registry'
import { deepEq } from './flow/task'

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

/**
 * Locale-sensitive formatters read locale from the scope chain
 * via `scope.get('locale')`. Pass `flow.scope({ locale: 'en' })`
 * (or whatever) when rendering — no special context field.
 */
function readLocale(context?: BaseContext): string | undefined {
  const v = context?.scope.get('locale')
  return typeof v === 'string' ? v : undefined
}

export const plural = (
  { value }: Record<string, unknown>,
  context?: BaseContext,
) => {
  if (typeof Intl?.PluralRules === 'undefined') {
    return Number(value) === 1 ? 'one' : 'other'
  }
  const rules = new Intl.PluralRules(readLocale(context) ?? 'en')
  return rules.select(Number(value))
}

export const length = ({ value }: Record<string, unknown>) =>
  value == null ? 0 : String(value).length

export const lower = (
  { value }: Record<string, unknown>,
  context?: BaseContext,
) => String(value ?? '').toLocaleLowerCase(readLocale(context))

export const upper = (
  { value }: Record<string, unknown>,
  context?: BaseContext,
) => String(value ?? '').toLocaleUpperCase(readLocale(context))

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export const number = (
  { value, options }: Record<string, unknown>,
  context?: BaseContext,
) =>
  new Intl.NumberFormat(
    readLocale(context),
    options as Intl.NumberFormatOptions,
  ).format(Number(value))

export const currency = (
  { value, code }: Record<string, unknown>,
  context?: BaseContext,
) =>
  new Intl.NumberFormat(readLocale(context), {
    style: 'currency',
    currency: String(code),
  }).format(Number(value))

export const percent = (
  { value }: Record<string, unknown>,
  context?: BaseContext,
) =>
  new Intl.NumberFormat(readLocale(context), { style: 'percent' }).format(
    Number(value),
  )

export const date = (
  { value, options }: Record<string, unknown>,
  context?: BaseContext,
) => {
  const d = value instanceof Date ? value : new Date(String(value))
  return new Intl.DateTimeFormat(
    readLocale(context),
    options as Intl.DateTimeFormatOptions,
  ).format(d)
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
