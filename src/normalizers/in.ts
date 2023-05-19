import { Load, LoadFind, LoadRead, LoadSave } from '~/controllers/sort'
import { test_hash } from '~/controllers/test'

import BASE from './base'
import BASE_READ from './read'
import BASE_SAVE from './save'

export function norm_head_base_load(base_load: Load) {
  const load: Load = {
    task: base_load.task,
  }
  if (base_load.find) {
    load.find = norm_head_base_load_find(base_load.find)
  }
  if (base_load.read) {
    load.read = norm_head_base_load_read(base_load.read)
  }
  if (base_load.save) {
    load.save = norm_head_base_load_save(base_load.save)
  }
  return load
}

export function norm_head_base_load_find(base_find: LoadFind) {
  const find: LoadFind = {}
  const link_fail: Array<string> = []

  Object.keys(base_find).forEach(name => {
    const form = BASE[name]
    if (!form) {
      link_fail.push(name)
    } else {
    }
  })

  return find
}

export function norm_head_base_load_read(base_read: LoadRead) {
  const read: LoadRead = {}

  Object.keys(base_read).forEach(name => {
    const form = BASE[name]
    const mesh = base_read[name]
    test_hash(mesh)

    if (form) {
    }
  })

  return read
}

export function norm_head_base_load_save(base_save: LoadSave) {
  const save: LoadSave = {}

  return save
}
