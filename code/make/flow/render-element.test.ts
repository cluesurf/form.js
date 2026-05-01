/**
 * `renderElement` tests, driven through React (createElement +
 * Fragment) since react / react-dom are dev deps. The same code
 * paths work with any vdom builder of the same shape.
 */

import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { flow, renderElement, type ElementBuilder } from './index'

const REACT = {
  builder: createElement as unknown as ElementBuilder<unknown>,
  fragment: Fragment,
}

describe('renderElement', () => {
  it('renders text literals', () => {
    const out = renderElement(flow.text('hello'), {
      scope: flow.scope(),
      ...REACT,
    })
    expect(out).toBe('hello')
  })

  it('renders a weave as a fragment', () => {
    const tree = flow.weave('I am ', flow.reference('status'), '.')
    const out = renderElement(tree, {
      scope: flow.scope({ status: 'fine' }),
      ...REACT,
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
        renderElement(tree, {
          scope: flow.scope({ x: 5 }),
          ...REACT,
        }) as never,
      ),
    ).toBe('yes')
  })

  it('renders walk over a list', () => {
    const tree = flow.walk(
      flow.reference('items'),
      flow.weave(flow.reference('item'), '|'),
    )
    const out = renderElement(tree, {
      scope: flow.scope({ items: ['a', 'b', 'c'] }),
      ...REACT,
    })
    expect(renderToStaticMarkup(out as never)).toBe('a|b|c|')
  })

  it('dispatches a view to a registered component', () => {
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

    const out = renderElement(tree, {
      scope: flow.scope(),
      ...REACT,
      component: { callout: Callout as never },
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
      [flow.view('paragraph', ['Inventory.'])],
    )

    const out = renderElement(tree, {
      scope: flow.scope(),
      ...REACT,
      component: {
        section: Section as never,
        paragraph: Para as never,
      },
    })
    const html = renderToStaticMarkup(out as never)
    expect(html).toContain('<section>')
    expect(html).toContain('Phonology')
    expect(html).toContain('<p>Inventory.</p>')
  })

  it('falls back to the bare view name when no component is registered', () => {
    const tree = flow.view('span', { className: 'note' }, ['hi'])
    const out = renderElement(tree, {
      scope: flow.scope(),
      ...REACT,
    })
    expect(renderToStaticMarkup(out as never)).toBe(
      '<span class="note">hi</span>',
    )
  })

  it('works with a fragment-less builder by returning child arrays', () => {
    // Custom builder that always wraps in a `[type, props, children]`
    // tuple — verifies fragment fallback when context.fragment is omitted.
    type Tup = [unknown, Record<string, unknown> | null, unknown[]]
    const tup = (
      type: unknown,
      props: Record<string, unknown> | null,
      ...children: unknown[]
    ): Tup => [type, props, children]

    const tree = flow.weave('a', 'b', 'c')
    const out = renderElement<Tup>(tree, {
      scope: flow.scope(),
      builder: tup,
      // no fragment → renderer returns the child array directly
    })
    expect(out).toEqual(['a', 'b', 'c'])
  })
})
