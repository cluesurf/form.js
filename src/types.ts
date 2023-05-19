export type Load = {
  find?: LoadFind
  read?: LoadRead
  save?: LoadSave
  task?: string
}

export type LoadFind = Array<LoadFindLike>

export type LoadFindBind = {
  form: 'bind'
  list: Array<LoadFindLink>
}

export type LoadFindLike = {
  base: LoadFindLikeFormBond
  form: 'like'
  head: LoadFindLikeBond | LoadFindLikeFormBond
  test: LoadFindTest
}

export type LoadFindLikeBond = string | boolean | null | number

export type LoadFindLikeFormBond = {
  form: string
  name: string
}

export type LoadFindLink = LoadFindLike | LoadFindRoll | LoadFindBind

export type LoadFindRoll = {
  form: 'roll'
  list: Array<LoadFindLink>
}

export type LoadFindTest =
  | 'bond'
  | 'base_link_mark'
  | 'head_link_mark'
  | 'base_mark'
  | 'head_mark'
  | 'base_text'
  | 'miss_bond'
  | 'have_bond'
  | 'have_text'

export type LoadRead = {
  [key: string]: true | LoadReadLink
}

export type LoadReadLink = {
  find?: LoadFind
  read: LoadRead
}

export type LoadSave = {
  [key: string]: Array<LoadSaveBase> | LoadSaveBase
}

export type LoadSaveBase = {
  find?: LoadFind
  read?: LoadRead
  save?: LoadSave
  task?: string
}

export type LoadSort = {
  name: string
  tilt: '+' | '-'
}
