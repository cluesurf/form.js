import {
  need as bneed,
  take as btake,
  test as btest,
} from './host/back/test.js'
import {
  need as fneed,
  take as ftake,
  test as ftest,
} from './host/face/test.js'

const b_user = JSON.parse(
  JSON.stringify({ email: 'foo@bar.com', id: '123', name: 'foo' }),
) as object

if (btest(b_user, 'user')) {
  console.log(b_user.email)
}

const f_user = JSON.parse(
  JSON.stringify({
    email: 'foo@bar.com',
    id: '123',
    name: 'foo',
    posts: [
      {
        content: 'some content',
        createdAt: new Date().toISOString(),
        id: 'x',
        title: 'A post',
      },
    ],
  }),
) as object

if (ftest(f_user, 'user')) {
  console.log(f_user.email)
}
