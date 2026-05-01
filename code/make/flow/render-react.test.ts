/**
 * React renderer tests. Uses react-dom/server for snapshot
 * comparison. View dispatch is exercised via the per-render
 * `viewHook` map (no module-level mutable registry).
 */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { flow } from './index'
import { renderReact } from './render/react'

describe('renderReact', () => {
  it('renders text literals', () => {
    const out = renderReact(flow.text('hello'), { scope: flow.scope() })
    expect(out).toBe('hello')
  })

  it('renders a line as React fragment', () => {
    const tree = flow.weave('I am ', flow.reference('status'), '.')
    const out = renderReact(tree, {
      scope: flow.scope({ status: 'fine' }),
    })
    expect(renderToStaticMarkup(out as never)).toBe('I am fine.')
  })

  it('renders branch — truthy goes to then', () => {
    const tree = flow.branch(
      flow.gt(flow.reference('x'), 0),
      'yes',
      'no',
    )
    expect(
      renderToStaticMarkup(
        renderReact(tree, { scope: flow.scope({ x: 5 }) }) as never,
      ),
    ).toBe('yes')
  })

  it('renders walk over a list', () => {
    const tree = flow.walk(
      flow.reference('items'),
      flow.weave(flow.reference('item'), '|'),
    )
    const out = renderReact(tree, {
      scope: flow.scope({ items: ['a', 'b', 'c'] }),
    })
    expect(renderToStaticMarkup(out as never)).toBe('a|b|c|')
  })

  it('dispatches a view to a hook-registered React component', () => {
    const Callout = (props: { variant: string; body: string }) =>
      createElement(
        'div',
        { className: `callout callout-${props.variant}` },
        props.body,
      )

    const tree = flow.view('callout', {
      variant: 'note',
      body: 'No images yet.',
    })

    const out = renderReact(tree, {
      scope: flow.scope(),
      viewHook: { callout: Callout as never },
    })
    expect(renderToStaticMarkup(out as never)).toBe(
      '<div class="callout callout-note">No images yet.</div>',
    )
  })

  it('renders nested view children via nest', () => {
    const Section = (props: {
      title: string
      children?: unknown
    }) =>
      createElement(
        'section',
        null,
        createElement('h2', null, props.title),
        props.children as never,
      )

    const Para = (props: { children?: unknown }) =>
      createElement('p', null, props.children as never)

    const tree = flow.view(
      'section',
      { title: 'Phonology' },
      [flow.view('paragraph', undefined, ['Inventory.'])],
    )

    const out = renderReact(tree, {
      scope: flow.scope(),
      viewHook: {
        section: Section as never,
        paragraph: Para as never,
      },
    })
    const html = renderToStaticMarkup(out as never)
    expect(html).toContain('<section>')
    expect(html).toContain('Phonology')
    expect(html).toContain('<p>Inventory.</p>')
  })
})
