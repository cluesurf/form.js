<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>

<h3 align='center'>@tunebond/form</h3>
<p align='center'>
  JSON Model Specification Tool
</p>

<br/>
<br/>
<br/>

## Installation

```
pnpm add @tunebond/form
yarn add @tunebond/form
npm i @tunebond/form
```

## Specification Examples

You first define your data model in JSON, then this is run through
codegen to generate the TypeScript definitions for frontend and backend.

```ts
// base/form.ts
const User = {
  dock: 'id',
  link: {
    id: { form: 'uuid' },
    name: { form: 'text' },
    email: { form: 'text', void: true },
    posts: { form: 'post', list: true, back: 'author' },
  },
}

const Post = {
  dock: 'id',
  link: {
    id: { form: 'uuid' },
    title: { form: 'text', baseSize: 3 },
    author: { form: 'user', link: true },
    content: { form: 'text' },
    createdAt: { form: 'date' },
  },
}

const Base = {
  user: User,
  post: Post,
}

export default Base
```

## Transforms

So each type gets 3 slot:

- `back`: The database structure.
- `site`: The backend structure before the database.
- `face`: The frontend structure.

Within each of these, there are transforms in and out, totalling 4 per
slot:

| slot   | transforms | direction       |
| :----- | :--------- | :-------------- |
| `back` | `baseSelf` | from database   |
| `back` | `headSelf` | from backend    |
| `back` | `head`     | to backend      |
| `back` | `base`     | to database     |
| `site` | `baseSelf` | from `back`     |
| `site` | `headSelf` | from `face`     |
| `site` | `head`     | to `face`       |
| `site` | `base`     | to `back`       |
| `face` | `baseSelf` | from `site`     |
| `face` | `headSelf` | from user input |
| `face` | `head`     | to user input   |
| `face` | `base`     | to `site`       |

This means that we have 12 possible `zod` types per property. The `zod`
types can be reused if the transform is the same between them.

There are 3 generated TypeScript definitions, one for each slot in the
process.

## License

MIT

## TuneBond

This is being developed by the folks at [TuneBond](https://tune.bond), a
California-based project for helping humanity master information and
computation. TuneBond started off in the winter of 2008 as a spark of an
idea, to forming a company 10 years later in the winter of 2018, to a
seed of a project just beginning its development phases. It is entirely
bootstrapped by working full time and running
[Etsy](https://etsy.com/shop/tunebond) and
[Amazon](https://www.amazon.com/s?rh=p_27%3AMount+Build) shops. Also
find us on [Facebook](https://www.facebook.com/tunebond),
[Twitter](https://twitter.com/tunebond), and
[LinkedIn](https://www.linkedin.com/company/tunebond). Check out our
other GitHub projects as well!
