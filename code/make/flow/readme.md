# `@cluesurf/belt/tool/flow`

Implementation of the flow library — a unified AST for values,
computations, control flow, templates, and views. Spec at
`note/library/flow/`.

## What's here

```
flow/
├── types.ts                 — TS types for every node form
├── build.ts                 — `flow.*` builder helpers
├── index.ts                 — public surface
├── render.ts                — back-compat shim → render/index.ts
├── render/
│   ├── scope.ts             — Scope chain
│   ├── registry.ts          — call + form registries; default operators
│   ├── path.ts              — shared path resolution
│   ├── text.ts              — text-output renderer (i18n)
│   ├── react.ts             — React-output renderer
│   └── index.ts             — render surface
├── build.test.ts            — DSL builder tests
├── render.test.ts           — text-render tests
├── render-react.test.ts     — React-render tests
└── extend.test.ts           — extension-hook tests
```

## Two renderers, same tree

```ts
import { flow, renderText, renderReact } from '@cluesurf/belt/tool/flow'

const tree = flow.weave('Hello, ', flow.reference('name'), '!')

renderText(tree, { scope: flow.scope({ name: 'Lance' }) })
// "Hello, Lance!"

renderReact(tree, { scope: flow.scope({ name: 'Lance' }) })
// React.Fragment with text children
```

The renderers share scope chain, path resolution, and the call
registry. They differ in output: `renderText` returns a string;
`renderReact` returns a React node, dispatching `view` to
registered React components.

## Extension hooks

Three registration points, all keyed by name:

| hook | what | renderer |
| ---- | ---- | -------- |
| `registerCall(name, schema?, handler)` | adds a `call` operator | both |
| `registerForm(name, schema?, handler)` | adds a top-level form alongside the built-ins | both |
| `registerView(name, component)` | wires a React component to a view name | React only |

Schemas are `@cluesurf/form` `Form` records describing the
operator's args (or the form's structural shape). They power
codegen, runtime validation, editor inspectors, and migrations.
The schema is optional at registration time but required for
anything that ships through the broader pipeline.

### Adding a custom call operator

```ts
import type { Form } from '@cluesurf/form'
import { flow, registerCall } from '@cluesurf/belt/tool/flow'

const reverseSchema: Form = {
  form: 'form',
  save: '@call/reverse/v1',
  link: {
    value: { like: 'string' },
  },
}

registerCall('reverse', reverseSchema, ({ value }) =>
  String(value).split('').reverse().join(''),
)

// use it
const tree = flow.call('reverse', { value: flow.reference('name') })
flow.renderText(tree, { scope: flow.scope({ name: 'Lance' }) })
// "ecnaL"
```

The handler receives the **resolved** args (each arg's flow
node already evaluated) plus the render context. To register
without a schema (ad-hoc, no codegen story), pass the handler
as the second arg.

### Adding a custom top-level form

A custom form lives alongside `branch`, `walk`, etc. The handler
receives the node, the render context, and a `walk` callback that
evaluates child nodes in the parent renderer's output type.

```ts
import type { Form } from '@cluesurf/form'
import { registerForm } from '@cluesurf/belt/tool/flow'

const repeatSchema: Form = {
  form: 'form',
  save: '@form/repeat/v1',
  link: {
    body: { like: 'flow' },
    times: { like: 'natural_number' },
  },
}

registerForm('repeat', repeatSchema, (node, context, walk) => {
  const r = node as { body: Node; times: Node }
  const body = String(walk(r.body, context))
  const n = Number(walk(r.times, context))
  return body.repeat(n)
})

// use it
const tree = {
  form: 'repeat' as const,
  body: { form: 'text' as const, text: 'ab' },
  times: { form: 'natural_number' as const, value: 3 },
}
flow.renderText(tree as never, { scope: flow.scope() })
// "ababab"
```

The handler is generic over the renderer's output type. The same
handler runs in both `renderText` and `renderReact`; the `walk`
callback returns the right type for the active renderer.

### Wiring a React component for a view

```ts
import { createElement } from 'react'
import { flow, registerView, renderReact } from '@cluesurf/belt/tool/flow'

const Callout = (props: { variant: string; body: string }) =>
  createElement(
    'div',
    { className: `callout callout-${props.variant}` },
    props.body,
  )

registerView('callout', Callout)

const tree = flow.view('callout', {
  variant: 'note',
  body: 'No images yet.',
})

renderReact(tree, { scope: flow.scope() })
// <div class="callout callout-note">No images yet.</div>
```

The component receives the resolved props (each prop's flow
value evaluated) and `children` for the `nest:` array.

## Per-render overlays

You can override registries per render via `context`:

```ts
const overlay = new Map<string, CallHandler>()
overlay.set('count', () => 999)

flow.renderText(tree, {
  scope: flow.scope(),
  callRegistry: overlay, // overrides built-in `count` for this render only
})
```

Same pattern for `formRegistry` (overlay for top-level forms)
and `viewRegistry` (overlay for React component dispatch).

## When to add what

- **Custom call** — pure value computation. A predicate
  (`is-prime`), a derive (`slug`), a formatter (`gloss-style`).
  Most extensions land here.
- **Custom form** — a new structural primitive that's not a
  call. A `region` that scopes localization to a sub-tree, a
  `defer` that schedules its body for a later render pass, a
  `markdown` that parses its text body. Rare; usually a
  `call` is enough.
- **Custom view** — a React component a view name should
  dispatch to. Always pair a view name in the tree with a
  registered React component before rendering.

## Pattern: project-specific operators

A project that ships its own catalog typically has one entry
point that registers all custom operators at startup:

```ts
// site/flow-extensions.ts
import { registerCall, registerForm, registerView } from '@cluesurf/belt/tool/flow'
import { reverseSchema, reverseHandler } from './ops/reverse'
import { repeatSchema, repeatHandler } from './forms/repeat'
import { Callout } from './views/callout'

export function registerExtensions() {
  registerCall('reverse', reverseSchema, reverseHandler)
  registerForm('repeat', repeatSchema, repeatHandler)
  registerView('callout', Callout)
}
```

Call `registerExtensions()` once during app boot. Per-render
overlays on `context` then layer on top for tests or per-tenant
customization.

## See also

- `note/library/flow/` — the spec.
- `note/library/flow/dsl.md` — every builder helper.
- `note/library/flow/version.md` — versioning rules for
  operators and components.
