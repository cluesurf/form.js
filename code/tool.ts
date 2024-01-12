import _ from 'lodash'

export function toPascalCase(text: string) {
  return _.startCase(_.camelCase(text)).replace(/ /g, '')
}
