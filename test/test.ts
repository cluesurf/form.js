import { FormLink } from '..'

const FFMPEG_TIME_PATTERN =
  /|\d{2}:\d{2}:\d{2}(?:\.\d{3})|\d{2}:\d{2}(?:\.\d{3})|\d{2}(?:\.\d{3})/

export const test_time_string = {
  form: 'test' as const,
  test: (bond: string) =>
    !!bond.match(FFMPEG_TIME_PATTERN) ||
    `${name} has an invalid format.`,
}
