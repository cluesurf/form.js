/**
 * Implementation for the `greet_user` task. The schema for
 * its input lives in `test/form.ts`; codegen emits a matching
 * TS input record (and zod parser) from that schema.
 */

export const greet_user = (input: {
  name: string
  age?: number
  polite?: boolean
}): string => {
  const greeting = input.polite === false ? 'Hey' : 'Hello'
  return `${greeting}, ${input.name}!`
}
