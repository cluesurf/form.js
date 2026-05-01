/**
 * Top-level `task.ts` — re-exports every per-task
 * implementation from its sub-folder. Pass this whole module
 * to `Base.hook` at codegen time:
 *
 *   import * as TASK from './task'
 *   makeTree({ ..., hook: TASK })
 */

export { greet_user } from './greet_user/task'
export { sum_numbers } from './sum_numbers/task'
