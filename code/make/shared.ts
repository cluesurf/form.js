import { FormLink, FormLinkMesh } from '@/form'

/**
 * An "enum-style" nested link is one whose `link.link` holds only
 * shapeless children (no `like` / `link` / `case` / `take` / `fuse`
 * / `bind`). The author uses that pattern to declare a set of
 * allowed literal values. Codegen should render it as a string
 * literal union (in types) or `z.enum([...])` (in parsers),
 * rather than recursing into an empty object.
 */

export type EnumStyleResult = {
  isEnum: boolean
  keys: string[]
}

export function detectEnumStyleNesting(
  nested: FormLinkMesh | undefined,
): EnumStyleResult {
  if (!nested) return { isEnum: false, keys: [] }

  const entries = Object.entries(nested) as Array<
    [string, FormLink | undefined]
  >
  if (entries.length === 0) return { isEnum: false, keys: [] }

  const allShapeless = entries.every(([, child]) => {
    if (!child) return false
    return (
      child.like == null &&
      child.link == null &&
      child.case == null &&
      child.take == null &&
      child.fuse == null &&
      child.bind == null
    )
  })

  return {
    isEnum: allShapeless,
    keys: entries.map(([key]) => key),
  }
}
