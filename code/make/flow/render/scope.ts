/**
 * Scope chain shared by every renderer.
 *
 * Each renderer pushes a frame for iterators (`walk`, `loop`)
 * and reads named bindings via `get`.
 */

export type Scope = {
  get(name: string): unknown
  push(frame: Mesh): Scope
}

export type Mesh = Record<string, unknown>

export function makeScope(
  initial: Mesh = {},
): Scope {
  const frames: Mesh[] = [initial]
  const self: Scope = {
    get(name: string) {
      for (let i = frames.length - 1; i >= 0; i -= 1) {
        const frame = frames[i]
        if (frame && Object.prototype.hasOwnProperty.call(frame, name)) {
          return frame[name]
        }
      }
      return undefined
    },
    push(frame) {
      frames.push(frame)
      return self
    },
  }
  return self
}
