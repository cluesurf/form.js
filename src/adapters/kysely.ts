import {
  AnyColumn,
  InsertObject,
  OperandValueExpressionOrList,
  OrderByDirectionExpression,
  OrderByExpression,
  Selection,
} from 'kysely'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'

import type {
  Base,
  BaseFormName,
  LoadFind,
  LoadFindLink,
  LoadRead,
} from '../types'

export type BaseFormLinkName<Name extends BaseFormName> = AnyColumn<
  Base,
  ExtractTableAlias<Base, Name>
>

export const TILT: Record<string, OrderByDirectionExpression> = {
  fall: 'desc',
  rise: 'asc',
}

// eslint-disable-next-line sort-exports/sort-exports
export type BaseFormLinkBond<Name extends BaseFormName> =
  OperandValueExpressionOrList<
    Base,
    ExtractTableAlias<Base, Name>,
    BaseFormLinkName<Name>
  >

export type Like<Name extends BaseFormName> = {
  bond: BaseFormLinkBond<Name>
  name: BaseFormLinkName<Name>
  test: '=' | '>=' | '>' | '<' | '<=' | '!='
}

export type LoadReadLikeList<Name extends BaseFormName> = {
  base: Base
  find: LoadFind
  name: Name
  seek: (link_name: unknown) => link_name is BaseFormLinkName<Name>
}

export type LoadReadNameList<Name extends BaseFormName> = {
  name: Name
  read: LoadRead
  seek: (name: unknown) => name is BaseFormLinkName<Name>
}

export type MakeRead = {
  find?: LoadFind
  name: BaseFormName
  read?: LoadRead
}

export type Sort<Name extends BaseFormName> = {
  name: SortName<Name>
  tilt: OrderByDirectionExpression
}

export type SortName<Name extends BaseFormName> = OrderByExpression<
  Base,
  ExtractTableAlias<Base, Name>,
  Selection<Base, ExtractTableAlias<Base, Name>, BaseFormLinkName<Name>>
>

/**
 * Create where conditions.
 */
export function load_read_like_list<Name extends BaseFormName>({
  name,
  find,
  seek,
  base,
}: LoadReadLikeList<Name>) {
  const like_list: Array<Like<Name>> = []
  const form = base[name]
  const find_like_list: Array<LoadFindLink> = Array.isArray(find)
    ? find
    : [find]

  find_like_list.forEach(like => {
    switch (like.form) {
      case 'like':
        like.base.link
        break
      default:
        break
    }
  })

  return like_list
}

export function make_diff<Name extends BaseFormName>() {}

export function make_kill<Name extends BaseFormName>() {}

export function make_make<Name extends BaseFormName>() {}

export function make_read<Name extends BaseFormName>({
  name,
  find,
  read,
}: LoadRead) {}

// export function load_read_name_list<Name extends BaseFormName>({
//   name,
//   read,
//   seek,
// }: LoadReadNameList<Name>) {
//   const list: Array<BaseFormLinkName<Name>> = []
//   const form = FORM_BASE_NAME[name]

//   for (const name in read) {
//     if (form[name] && seek(name)) {
//       list.push(name)
//     }
//   }

//   return list
// }

// export async function make_link_list<Name extends BaseFormName>({
//   name,
//   save,
//   tool,
// }: MakeLinkList<Name>) {
//   const form = FORM[name]

//   for (const link_name in save) {
//     const link = save[link_name]
//     const form_link = form[link_name]

//     test_load(link)
//     test_text(form_link.form)
//     test_tool(form_link.form)

//     const hook = tool[form_link.form]

//     if (test_list(link)) {
//       for (const list_link of link) {
//         test_load(list_link)
//         test_hash(list_link.save)

//         await hook.make({ save: list_link.save, tool })
//       }
//     } else {
//       test_hash(link.save)

//       await hook.make({ save: link.save, tool })
//     }
//   }
// }

// export function make_make_seed<Name extends BaseFormName>({
//   save,
//   name,
// }: MakeMakeSeed<Name>) {
//   const form = FORM[name]
//   const seed_base: Record<string, unknown> = {}
//   const seed_link: Record<string, unknown> = {}
//   const code = uuidv4()

//   for (const save_name in save) {
//     test(save_name in form, 'name_fail')

//     const name_form = form[save_name]
//     const save_load = save[save_name]

//     test_load_link_save_form(save_load)

//     switch (name_form.form) {
//       case 'code':
//       case 'text':
//       case 'wave':
//       case 'date':
//       case 'mark': {
//         seed_base[save_name] = save_load.save
//         break
//       }
//       default:
//         if (name_form.code) {
//           test_tree(save_load.save, { code: { save: TEXT } })
//           seed_link[`${save_name}_code`] = save_load.save.code.save
//         } else {
//           test_hash(save_load.save)
//           test_text(name_form.name)

//           seed_link[save_name] = {
//             save: {
//               ...save_load.save,
//               [name_form.name]: { save: { code: { save: code } } },
//             },
//           }
//         }
//         break
//     }
//   }

//   seed_link.code = code

//   return { code, seed_base, seed_link } as {
//     code: string
//     seed_base: InsertObject<Base, Name>
//     seed_link: LoadSave
//   }
// }

// export function make_sort_list<Name extends BaseFormName>(
//   name: Name,
//   base_sort_list: Array<LoadSort>,
// ) {
//   const sort_list: Array<Sort<Name>> = []
//   const form = FORM_BASE_NAME[name]

//   base_sort_list.forEach(base_sort => {
//     const base_name = base_sort.name
//     if (seek_sort_name<SortName<Name>>(base_name, form)) {
//       sort_list.push({
//         name: base_name,
//         tilt: TILT[base_sort.tilt],
//       })
//     }
//   })

//   return sort_list
// }

// export function read_base_link_form(blob: unknown) {
//   const form = typeof blob
//   switch (form) {
//     case 'string':
//       return 'text'
//     case 'number':
//       return 'mark'
//     case 'undefined':
//       return 'void'
//     default:
//       if (blob == null) {
//         return 'void'
//       } else {
//         return 'mesh'
//       }
//   }
// }

// export async function read_list<Name extends BaseFormName>({
//   find,
//   read,
//   name,
//   curb = 100,
//   move,
//   sort = [],
//   seek,
// }: ReadList<Name>) {
//   const { count } = Base.fn

//   const like_list = load_read_like_list({
//     find,
//     name,
//     seek,
//   })

//   let size_find = Base
//     .selectFrom(Name)
//     .select([count('code').as('size')])

//   like_list.forEach(like => {
//     size_find = size_find.where(like.name, like.test, like.link)
//   })

//   const { size } = (await size_find.executeTakeFirst()) ?? { size: 0 }

//   const read_list = load_read_name_list({
//     name,
//     read,
//     seek,
//   })

//   let list_find = Base.selectFrom(Name).select(read_list)

//   like_list.forEach(like => {
//     list_find = list_find.where(like.name, like.test, like.link)
//   })

//   if (curb) {
//     list_find = list_find.limit(curb)
//   }

//   if (move) {
//     list_find = list_find.offset(move)
//   }

//   const sort_list = make_sort_list(name, sort)

//   sort_list.forEach(sort => {
//     list_find = list_find.orderBy(sort.name, sort.tilt)
//   })

//   const list = await list_find.execute()

//   return { list, size }
// }

// export async function read_mesh<Name extends BaseFormName>({
//   find,
//   read,
//   name,
//   seek,
// }: ReadMesh<Name>) {
//   const read_list = load_read_name_list({
//     name,
//     read,
//     seek,
//   })
//   const like_list = load_read_like_list({
//     find,
//     name,
//     seek,
//   })

//   let query = Base.selectFrom(Name).select(read_list)

//   like_list.forEach(like => {
//     query = query.where(like.name, like.test, like.link)
//   })

//   return await query.executeTakeFirst()
// }

// // export async function read_link_list<L extends string>({
// //   tool,
// //   read,
// //   config,
// //   find,
// // }: ReadAssocationLinkForm<L>) {
// //   const result: Record<string, unknown> = {}

// //   for (const key in config.keys) {
// //     // test_form(key, config.check)

// //     if (seek_tree(read, { [key]: READ_CONFIG_OBJECT })) {
// //       const toolName = config.keys[key]
// //       const details = read[key]
// //       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
// //       const data = await tool[toolName].read({
// //         find: {
// //           ...details.find,
// //           ...find,
// //         },
// //         read: details.read,
// //         tool,
// //       })
// //       result[key] = data
// //     }
// //   }

// //   return result
// // }

// function make_form_base_name_mesh(base: typeof FORM) {
//   const mesh: Record<string, Record<string, Array<string>>> = {}

//   for (const form_name in base) {
//     const form = base[form_name]
//     const mesh_form: Record<string, Array<string>> = {}
//     for (const link_name in form) {
//       const link = form[link_name]
//       switch (link.form) {
//         case 'code':
//         case 'wave':
//         case 'mark':
//         case 'text':
//         case 'date': {
//           const form_name: Array<string> = [link.form]
//           if (link.void) {
//             form_name.push('void')
//           }
//           mesh_form[link_name] = form_name
//           break
//         }
//         default:
//           break
//       }
//     }
//     mesh[`tl_${form_name}`] = mesh_form
//   }

//   return mesh
// }

// export function seek_link_form<LinkName>(
//   link: unknown,
//   form_list: Array<string>,
// ): link is LinkName {
//   const form = read_base_link_form(link)
//   return form_list.includes(form)
// }

// export function seek_sort_name<Name>(
//   name: unknown,
//   name_list: object,
// ): name is Name {
//   return name_list.hasOwnProperty(name as string)
// }

// export function seek_tool(name: string): name is ToolName {
//   return TOOL_NAME.includes(name)
// }

// export function test_load_link_save_form(
//   base: unknown,
// ): asserts base is  {
//   if (base && typeof base && !Array.isArray(base)) {
//     return
//   }

//   throw new Error('invalid')
// }

// export function test_tool(name: string): asserts name is ToolName {
//   if (!seek_tool(name)) {
//     throw new Error('test_fail')
//   }
// }
