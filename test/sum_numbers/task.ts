/**
 * Implementation for the `sum_numbers` task.
 */

export const sum_numbers = (input: { values: number[] }): number => {
  return input.values.reduce((s, n) => s + n, 0)
}
