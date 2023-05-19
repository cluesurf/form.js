/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash'

import { Load, LoadSave } from './types'

export const LIST: Array<any> = []
export const MARK = 1
export const OBJECT: object = {}
export const OBJECT_LIST: Array<object> = []
export const TEXT = ''
export const WAVE = true

export function isArray<T>(x: unknown): x is Array<T> {
  return _.isArray(x)
}

export function isObject(x: unknown): x is object {
  return _.isObject(x)
}

export function seek_load(x: unknown): x is Load {
  return (
    !_.isArray(x) &&
    _.isObject(x) &&
    ('task' in x || 'save' in x || 'find' in x || 'take' in x)
  )
}

export function seek_save(x: unknown): x is LoadSave {
  return !_.isArray(x) && _.isObject(x)
}

export function seek_text(x: unknown): x is string {
  return _.isString(x)
}

export function seek_tree<TargetForm>(
  x: any,
  example: TargetForm,
  message: string = 'invalid value',
): x is TargetForm {
  const typex = getForm(x)
  if (typex !== getForm(example)) {
    return false
  }

  if (typex === 'object') {
    for (const name in example) {
      if (!seek_tree(x[name], example[name], message)) {
        return false
      }
    }
  }

  return true
}

export function seek_wave<T>(x: unknown): x is boolean {
  return _.isBoolean(x)
}

export function test_code(x: unknown): asserts x is string {
  if (!seek_code(x)) {
    throw new Error('not_uuid')
  }
}

export function test_form<V>(
  seed: unknown,
  check: (x: any) => x is V,
  invalid = 'invalid',
): asserts seed is V {
  if (!check(seed)) {
    throw new Error(invalid)
  }
}

export function test_hash(x: unknown): asserts x is object {
  if (!seek_hash(x)) {
    throw new Error('not_object')
  }
}

export function test_list<T>(x: unknown): x is Array<T> {
  return seek_list(x)
}

export function test_load(x: unknown): asserts x is Load {
  if (!seek_load(x)) {
    throw new Error('not_load')
  }
}

export function test_save(x: unknown): asserts x is LoadSave {
  if (!seek_save(x)) {
    throw new Error('not_save')
  }
}

export function test_text(x: unknown): asserts x is string {
  if (!seek_text(x)) {
    throw new Error('not_string')
  }
}

function getForm(x: any) {
  const rawForm = typeof x
  if (rawForm === 'object' && !x) {
    return 'null'
  }
  if (Array.isArray(x)) {
    return 'array'
  }
  return rawForm
}

export function test_tree<TargetForm>(
  x: any,
  example: TargetForm,
  message: string = 'invalid value',
): asserts x is TargetForm {
  const typex = getForm(x)
  if (typex !== getForm(example)) {
    throw new Error(message)
  }

  if (typex === 'object') {
    for (const name in example) {
      test_tree(x[name], example[name], message)
    }
  }
}
