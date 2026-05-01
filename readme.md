# @cluesurf/form

Schema DSL + codegen + flow runtime.

A `Base` is a record of named schema entries. Codegen reads the record
and emits matching TypeScript types and zod parsers. The `flow`
namespace builds and renders flow trees (i18n templates and React
component trees).

```ts
import { flow, Form, Hash, List, Task, Flow } from '@cluesurf/form'
```

## Schema entries

Every entry has a `form:` discriminant. Codegen dispatches on it.

### `Form` — declared records, unions, intersections

Three shapes share the `form: 'form'` discriminant.

**`link`** — a record of named fields.

```ts
export const language: Form = {
  form: 'form',
  save: '~/hold',
  link: {
    id: { like: 'string', size: 32 },
    slug: { like: 'string' },
    title: { like: 'string' },
    is_natural: { like: 'boolean', need: false },
    flows: { list: true, like: 'language_flow' },
  },
}
```

**`case`** — a tagged union of other forms.

```ts
export const language_or_script: Form = {
  form: 'form',
  save: '~/hold',
  case: [{ like: 'language' }, { like: 'script' }],
}
```

**`fuse`** — an intersection.

```ts
export const language_with_id: Form = {
  form: 'form',
  save: '~/hold',
  fuse: [{ like: 'language' }, { like: 'with_id' }],
}
```

Field-level options inside `link`: `like`, `list`, `need`, `fall`
(default), `size` (`rise` / `rise_meet` / `fall` / `fall_meet`), `take`
(literal enum), nested `link` / `case` / `fuse`, `test` (refinement).

### `Hash` — keyed map of one record type

```ts
export const data: Hash = {
  form: 'hash',
  save: '~/hold',
  bond: { like: 'data_form' },
  hash: {
    avc: { lossless: false, lossy: true, type: 'video' },
    aac: { lossless: false, lossy: true, type: 'audio' },
  },
}
```

Codegen emits the keys as a string-literal type and a
`Record<Key, Value>` type.

### `List` — string enum

```ts
export const role: List = {
  form: 'list',
  save: '~/hold',
  list: ['noun', 'verb', 'adjective', 'adverb'],
}
```

Codegen emits a string-literal union and a `z.enum`.

### `Task` — function definition

`Task` references a separately-declared `Form` for its input shape.
The Form's codegen handles the TS type + zod parser; the Task entry
itself is just a registry record (input ref + output type).

```ts
export const greet_user_input: Form = {
  form: 'form',
  save: '~/hold/task',
  link: {
    name: { like: 'string' },
    polite: { like: 'boolean', need: false, fall: true },
  },
}

export const greet_user: Task = {
  form: 'task',
  save: '~/hold/task',
  take: 'greet_user_input',
  like: 'string',
}
```

Codegen for `greet_user_input` emits `GreetUserInput` (TS) and
`GreetUserInputParser` (zod). Implementations are wired through
`Base.hook` (see below).

### `Flow` — renderable tree with declared inputs

Same input pattern as `Task` — `take` is a Form name. `tree` is the
array of nodes the renderer walks. The same shape feeds i18n
templates (`renderText`) and component trees (`renderElement`).

```ts
export const message_count_input: Form = {
  form: 'form',
  save: '~/hold/flow',
  link: {
    count: { like: 'natural_number' },
    name: { like: 'string' },
  },
}

export const message_count: Flow = {
  form: 'flow',
  save: '~/hold/flow',
  take: 'message_count_input',
  tree: [
    flow.text('You have '),
    flow.reference('count'),
    flow.text(' '),
    flow.pluralCases('count', { one: 'message', other: 'messages' }),
    flow.text(', '),
    flow.reference('name'),
  ],
}
```

Codegen for `message_count_input` emits the input TS type and zod
parser. Codegen for `message_count` emits a `MESSAGE_COUNT_TREE:
Node[]` const into `base.ts`, importable for runtime evaluation.

## Codegen

```ts
import makeTree from '@cluesurf/form/make'
import * as schema from './form'
import * as task from './task'

const tree = await makeTree({
  name: {},
  mesh: schema,
  link: schema,
  hook: task,
  cast: {
    form: { keyword: 'string' },
    take: { keyword: 'z.string()' },
  },
  testLink: '~/test',
  codeLink: './code',
})
```

`makeTree` returns three streams: `tree.form` (TypeScript types),
`tree.take` (zod parsers), `tree.base` (constants for hashes / lists).
Write each to disk under the `save` paths.

### `cast` — override the built-in `like` mappings

The defaults cover `string`, `boolean`, `integer`, `natural_number`,
`decimal`, `number`, `uuid`, `timestamp`, `date`, `array_buffer`,
`blob`, `json`. Anything else without a schema entry would fall back to
`z.instanceof(Name)` — a broken default for project-specific brands. Add
the brand to `cast` and codegen threads it through:

```ts
cast: {
  form: { keyword: 'string' },
  take: { keyword: 'z.string()' },
}
```

### `hook` — task implementations

Single name → function table. The recommended layout: one `task.ts` per
resource folder, each with a named export matching the schema name; one
top-level `task.ts` that re-exports them all.

```ts
// project/greet_user/task.ts
export const greet_user = (input: { name: string; polite?: boolean }): string =>
  `${input.polite === false ? 'Hey' : 'Hello'}, ${input.name}!`

// project/task.ts
export { greet_user } from './greet_user/task'

// project/make.ts
import * as task from './task'
makeTree({ ..., hook: task })
```

Each function's input is typed against the codegen output for the
matching task's `take` shape — call sites are fully type-checked.

## Flow runtime

The `flow` namespace bundles builders + renderers. Build a tree with
composable helpers; render it with `flow.renderText` or
`flow.renderReact`.

```ts
import { flow } from '@cluesurf/form'

const tree = flow.weave(
  'You have ',
  flow.reference('count'),
  ' new ',
  flow.pluralCases('count', { one: 'message', other: 'messages' }),
)

const out = flow.renderText(tree, {
  scope: flow.scope({ count: 5, locale: 'en' }),
})
// → "You have 5 new messages"
```

### Extending the renderer

No module-level mutable registry — every extension is passed through the
render context.

```ts
flow.renderText(tree, {
  scope: flow.scope({ value: 'hello' }),
  hook: {
    reverse: ({ value }) => String(value).split('').reverse().join(''),
  },
})
```

`hook` is the same `HookHash` shape as `Base.hook` at codegen time —
operators, task implementations, and ad-hoc extensions share one table.
Args are pre-evaluated by the walker, so the hook function sees
resolved values, not flow nodes.

For React (or Preact, or any vdom), use `renderElement` and pass the
builder primitives:

```ts
import { renderElement } from '@cluesurf/form'
import { createElement, Fragment } from 'react'
import Callout from './my/components/callout'

renderElement(tree, {
  scope: flow.scope(),
  builder: createElement,
  fragment: Fragment,
  component: { callout: Callout },
})
```

`component` maps `view` node names to whatever the builder accepts
as a `type` (a React component, Preact component, etc.).
