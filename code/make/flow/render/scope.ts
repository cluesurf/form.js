/**
 * Scope chain shared by every renderer.
 *
 * Each renderer pushes a frame for iterators (`walk`, `loop`)
 * and reads named bindings via `get`. Inner stack shadow outer
 * ones — a `get` walks from the most recently pushed frame back
 * to the initial one.
 */

export type Mesh = Record<string, unknown>

export class Scope {
  private stack: Mesh[]

  constructor(initial: Mesh = {}) {
    this.stack = [initial]
  }

  get(name: string): unknown {
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      const frame = this.stack[i]
      if (frame && Object.prototype.hasOwnProperty.call(frame, name)) {
        return frame[name]
      }
    }
    return undefined
  }

  push(frame: Mesh): Scope {
    this.stack.push(frame)
    return this
  }
}

export function makeScope(initial: Mesh = {}): Scope {
  return new Scope(initial)
}
