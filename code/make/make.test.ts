/**
 * Codegen integration test. Feeds a small Base into the
 * top-level `makeTree` and inspects the emitted text streams
 * for the new schema discriminants (`task`, `flow`) and the
 * `cast` override path.
 */

import { describe, expect, it } from 'vitest'
import makeTree from './index'
import type { Flow, Form, Hash, List, Task } from '@/form'
import { flow as flowNs } from './flow/index'

describe('makeTree — task + flow + cast', () => {
  it('Task references a Form for input — input codegen comes from the Form', async () => {
    const greet_user_input: Form = {
      form: 'form',
      save: '~/hold/task',
      link: {
        name: { like: 'string' },
        age: { like: 'natural_number', need: false },
        polite: { like: 'boolean', need: false, fall: true },
      },
    }

    const greet_user: Task = {
      form: 'task',
      save: '~/hold/task',
      take: 'greet_user_input',
      like: 'string',
    }

    const tree = await makeTree({
      name: {},
      mesh: { greet_user_input, greet_user },
      link: { greet_user_input, greet_user },
      testLink: '~/test',
      codeLink: '.',
    })

    const formOut = tree.form['~/hold/task/index']!
    expect(formOut).toContain('export type GreetUserInput')
    expect(formOut).toContain('name: string')
    expect(formOut).toContain('age?: number')
    expect(formOut).toContain('polite?: boolean')

    const takeOut = tree.take['~/hold/task/take']!
    expect(takeOut).toContain('export const GreetUserInputParser')
    expect(takeOut).toContain('name: z.string()')
    expect(takeOut).toContain('z.boolean()')
  })

  it('Flow references a Form for input — input codegen comes from the Form', async () => {
    const message_input: Form = {
      form: 'form',
      save: '~/hold/flow',
      link: {
        count: { like: 'natural_number' },
      },
    }

    const message: Flow = {
      form: 'flow',
      save: '~/hold/flow',
      take: 'message_input',
      tree: [flowNs.text('You have '), flowNs.reference('count')],
    }

    const tree = await makeTree({
      name: {},
      mesh: { message_input, message },
      link: { message_input, message },
      testLink: '~/test',
      codeLink: '.',
    })

    const formOut = tree.form['~/hold/flow/index']!
    expect(formOut).toContain('export type MessageInput')
    expect(formOut).toContain('count: number')

    const takeOut = tree.take['~/hold/flow/take']!
    expect(takeOut).toContain('export const MessageInputParser')
    expect(takeOut).toContain('count: z.number()')
  })

  it('emits the Flow tree as a Node[] const in base.ts', async () => {
    const message_input: Form = {
      form: 'form',
      save: '~/hold/flow',
      link: { count: { like: 'natural_number' } },
    }

    const message: Flow = {
      form: 'flow',
      save: '~/hold/flow',
      take: 'message_input',
      tree: [flowNs.text('You have '), flowNs.reference('count')],
    }

    const tree = await makeTree({
      name: {},
      mesh: { message_input, message },
      link: { message_input, message },
      testLink: '~/test',
      codeLink: '.',
    })

    const baseOut = tree.base['~/hold/flow/base']!
    expect(baseOut).toContain(
      `import type { Node } from '@cluesurf/form'`,
    )
    expect(baseOut).toContain('export const MESSAGE_TREE: Node[]')
    expect(baseOut).toContain(`form: 'text'`)
    expect(baseOut).toContain(`text: 'You have '`)
    expect(baseOut).toContain(`form: 'reference'`)
    expect(baseOut).toContain(`name: 'count'`)
  })

  it('emits a string-literal const for a List in base.ts', async () => {
    const role: List = {
      form: 'list',
      save: '~/hold/role',
      list: ['noun', 'verb', 'adjective'],
    }

    const tree = await makeTree({
      name: {},
      mesh: { role },
      link: { role },
      testLink: '~/test',
      codeLink: '.',
    })

    const baseOut = tree.base['~/hold/role/base']!
    expect(baseOut).toContain('export const ROLE: ReadonlyArray<Role>')
    expect(baseOut).toContain(`'noun'`)
    expect(baseOut).toContain(`'verb'`)
    expect(baseOut).toContain(`'adjective'`)
  })

  it('emits keys + value object for a Hash with inline records', async () => {
    const codec: Form = {
      form: 'form',
      save: '~/hold/codec',
      link: {
        type: { like: 'string' },
        lossy: { like: 'boolean' },
      },
    }

    const data: Hash = {
      form: 'hash',
      save: '~/hold/codec',
      bond: { like: 'codec' },
      hash: {
        avc: { type: 'video', lossy: true },
        aac: { type: 'audio', lossy: true },
      },
    }

    const tree = await makeTree({
      name: {},
      mesh: { codec, data },
      link: { codec, data },
      testLink: '~/test',
      codeLink: '.',
    })

    const baseOut = tree.base['~/hold/codec/base']!
    expect(baseOut).toContain('export const DATA_KEY: ReadonlyArray<DataKey>')
    expect(baseOut).toContain(`'avc'`)
    expect(baseOut).toContain(`'aac'`)
    expect(baseOut).toContain('export const DATA: Data')
    expect(baseOut).toMatch(/type:\s*'video'/)
  })

  it('emits Hash with link as Record<LinkType, Value>', async () => {
    const codec: Form = {
      form: 'form',
      save: '~/hold/codec',
      link: {
        lossy: { like: 'boolean' },
      },
    }

    const data: Hash = {
      form: 'hash',
      save: '~/hold/codec',
      link: 'string',
      bond: { like: 'codec' },
      hash: {},
    }

    const tree = await makeTree({
      name: {},
      mesh: { codec, data },
      link: { codec, data },
      testLink: '~/test',
      codeLink: '.',
    })

    const formOut = tree.form['~/hold/codec/index']!
    expect(formOut).toContain('export type Data = Record<string, DataValue>')
  })

  it('emits Hash with bond.case as a union value type', async () => {
    const audio_codec: Form = {
      form: 'form',
      save: '~/hold/multi',
      link: { kind: { like: 'string' } },
    }

    const video_codec: Form = {
      form: 'form',
      save: '~/hold/multi',
      link: { kind: { like: 'string' } },
    }

    const codec_data: Hash = {
      form: 'hash',
      save: '~/hold/multi',
      bond: { case: [{ like: 'audio_codec' }, { like: 'video_codec' }] },
      hash: {
        aac: { kind: 'audio' },
        avc: { kind: 'video' },
      },
    }

    const tree = await makeTree({
      name: {},
      mesh: { audio_codec, video_codec, codec_data },
      link: { audio_codec, video_codec, codec_data },
      testLink: '~/test',
      codeLink: '.',
    })

    const formOut = tree.form['~/hold/multi/index']!
    // Value type is the union of the two cased forms
    expect(formOut).toContain('CodecDataValue')
    expect(formOut).toMatch(/AudioCodec\s*\|\s*VideoCodec/)
  })

  it('emits a non-string List const without dropping numeric values', async () => {
    const font_weight: List = {
      form: 'list',
      save: '~/hold/font',
      list: [100, 200, 400, 700, 900],
    }

    const tree = await makeTree({
      name: {},
      mesh: { font_weight },
      link: { font_weight },
      testLink: '~/test',
      codeLink: '.',
    })

    const baseOut = tree.base['~/hold/font/base']!
    expect(baseOut).toContain('export const FONT_WEIGHT')
    expect(baseOut).toContain('100')
    expect(baseOut).toContain('900')

    // Take side should emit a literal union, not z.enum
    const takeOut = tree.take['~/hold/font/take']!
    expect(takeOut).toContain('z.union')
    expect(takeOut).toContain('z.literal(100)')
  })

  it('cast overrides the built-in like → output mapping', async () => {
    const has_keyword: Form = {
      form: 'form',
      save: '~/hold/cast',
      link: {
        word: { like: 'keyword' },
      },
    }

    const tree = await makeTree({
      name: {},
      mesh: { has_keyword },
      link: { has_keyword },
      cast: {
        form: { keyword: 'string' },
        take: { keyword: 'z.string()' },
      },
      testLink: '~/test',
      codeLink: '.',
    })

    const formOut = tree.form['~/hold/cast/index']!
    expect(formOut).toContain('word: string')

    const takeOut = tree.take['~/hold/cast/take']!
    expect(takeOut).toContain('word: z.string()')
    expect(takeOut).not.toContain('z.instanceof(Keyword)')
  })
})
