import { HaltMesh, saveHalt } from '@tunebond/halt'
import { FormTree } from './index.js'
import {
  haveMesh,
  testVoid,
  seekText,
  seekMark,
  seekWave,
} from '@tunebond/have'
import halt from '@tunebond/have/halt.js'

export type Mesh = Record<string, unknown>

/**
 * Transform face to back.
 */

export default function make(base: Mesh, tree: FormTree) {
  const haltList: Array<HaltMesh> = []

  const head = makeTree({
    base,
    baseLine: `base`,
    haltList,
    tree,
    treeLine: `tree.link`,
  })

  return { halt: haltList, head: haltList.length ? null : head }
}

export type MakeTree = {
  base: Mesh
  baseLine: string
  haltList: Array<HaltMesh>
  tree: FormTree
  treeLine: string
}

export function makeTree({
  base,
  tree,
  baseLine,
  treeLine,
  haltList,
}: MakeTree) {
  const head: Record<string, unknown> = {}

  try {
    haveMesh(base, baseLine)
    haveMesh(tree.link, treeLine)

    for (const name in base) {
      try {
        const leadBase = base[name]
        const leadTree = tree.link[name]
        const baseLeadLine = `${baseLine}.${name}`
        const treeLeadLine = `${treeLine}.${name}`

        haveMesh(leadTree, treeLeadLine)

        const headLead = makeLead({
          baseLine: baseLeadLine,
          haltList,
          leadBase,
          leadTree,
          treeLine: treeLeadLine,
        })

        head[name] = headLead
      } catch (kink) {
        saveHalt(haltList, kink)
      }
    }
  } catch (kink) {
    saveHalt(haltList, kink)
  }

  return head
}

type MakeLead = {
  baseLine: string
  haltList: Array<HaltMesh>
  leadBase: unknown
  leadTree: FormTree
  treeLine: string
}

export function makeLead({
  treeLine,
  baseLine,
  leadBase,
  leadTree,
  haltList,
}: MakeLead) {
  const leadVoid = testVoid(leadBase)

  if (!leadTree.void && leadVoid) {
    throw halt('link_need', { call: baseLine })
  }

  if (leadTree.hook) {
    haveMesh(leadTree.bind, 'leadTree.bind')
    const baseLineList = baseLine.split('.')
    baseLineList.pop()
    const treeLineList = treeLine.split('.')
    treeLineList.pop()
    const hookLead = leadTree.hook(
      leadBase,
      leadTree.bind,
      baseLineList.join('.'),
      treeLineList.join('.'),
    )
    console.log(hookLead)
    return hookLead
  } else if (leadTree.form) {
    switch (leadTree.form) {
      case 'text':
        seekText(leadBase, Boolean(leadTree.void), baseLine)
        return leadBase
      case 'mark':
        seekMark(leadBase, Boolean(leadTree.void), baseLine)
        return leadBase
      case 'wave':
        seekWave(leadBase, Boolean(leadTree.void), baseLine)
        return leadBase
      default:
        console.log(leadBase)
        throw new Error('Undefined')
    }
  } else {
    haveMesh(leadBase, baseLine)

    // it's an object
    return makeTree({
      base: leadBase,
      baseLine: baseLine,
      haltList,
      tree: leadTree,
      treeLine: `${treeLine}.link`,
    })
  }
}
