import { z } from 'zod';
export const PostTest = z.object({
    author: z.lazy(() => UserTest),
    content: z.string(),
    createdAt: z.string().datetime(),
    id: z.string(),
    title: z.string(),
});
export const UserTest = z.object({
    email: z.optional(z.string()),
    id: z.string(),
    name: z.string(),
    posts: z.array(z.lazy(() => PostTest)),
});
export const Test = {
    post: PostTest,
    user: UserTest,
};
export function need(bond, form) {
    const test = Test[form];
    test.parse(bond);
}
export function test(bond, form) {
    const test = Test[form];
    return test.safeParse(bond).success;
}
export function take(bond, form) {
    const test = Test[form];
    return test.parse(bond);
}
//# sourceMappingURL=test.js.map