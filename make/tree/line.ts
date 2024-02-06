import { toPascalCase } from '~/code/tool.js'
import { Form, FormLinkMesh, Mesh } from '~/code/cast.js'
import _ from 'lodash'

export default function make(mesh: Mesh) {
  const list: Array<string> = []

  for (const name in mesh) {
    list.push(``)
    const site = mesh[name]
    if (site) {
      switch (site.form) {
        case 'form':
          make_form({ form: site, mesh, name }).forEach(line => {
            list.push(line)
          })
          break
      }
    }
  }

  return list
}

export function make_form({
  name,
  form,
  mesh,
}: {
  name: string
  form: Form
  mesh: Mesh
}) {
  const list: Array<string> = []

  if ('link' in form) {
    const link = make_link_list({ form, mesh, line: [] })
    list.push(``)
    list.push(`export const ${_.snakeCase(name).toUpperCase()}_CLI = {`)
    link.forEach(line => {
      list.push(`  ${line}`)
    })
    list.push(`}`)
  }

  return list
}

export function make_link_list({
  form,
  mesh,
  line,
}: {
  form: Form | FormLinkMesh
  mesh: Mesh
  line: Array<string>
}) {
  const list: Array<string> = []

  if ('link' in form) {
    for (const name in form.link) {
      const link = form.link[name]
      if (!link) {
        continue
      }
      const mark = link.name?.mark
      const linkNameLine = line.concat([name])

      if (mark) {
        list.push(
          `${mark}: { link: ${JSON.stringify(
            linkNameLine,
          )}, name: '${_.kebabCase(linkNameLine.join('-'))}' },`,
        )
      }

      if (link.link) {
        make_link_list({
          form: link,
          mesh,
          line: linkNameLine,
        }).forEach(line => {
          list.push(line)
        })
      } else {
        list.push(
          `'${_.kebabCase(
            linkNameLine.join('-'),
          )}': { link: ${JSON.stringify(linkNameLine)} },`,
        )
      }
    }
  }

  return list
}
