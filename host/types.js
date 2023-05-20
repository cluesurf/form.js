/* eslint-disable sort-exports/sort-exports */
import { z } from 'zod';
export const LOAD_FIND_TEST = [
    'bond',
    'base_link_mark',
    'head_link_mark',
    'base_mark',
    'head_mark',
    'base_text',
    'miss_bond',
    'have_bond',
    'have_text',
];
export const Load = z.object({
    find: z.optional(z.lazy(() => LoadFind)),
    read: z.optional(z.lazy(() => LoadRead)),
    save: z.optional(z.lazy(() => LoadSave)),
    task: z.optional(z.string()),
});
export const LoadFind = z.union([
    z.lazy(() => LoadFindLink),
    z.array(z.lazy(() => LoadFindLink)),
]);
export const LoadRead = z.record(z.union([z.lazy(() => LoadReadLink), z.literal(true)]));
export const LoadSave = z.record(z.lazy(() => LoadSaveBase), z.array(z.lazy(() => LoadSaveBase)));
export const LoadFindBind = z.object({
    form: z.literal('bind'),
    list: z.array(z.lazy(() => LoadFindLink)),
});
export const LoadFindRoll = z.object({
    form: z.literal('roll'),
    list: z.lazy(() => z.array(LoadFindLink)),
});
export const LoadFindTest = z.enum([
    'bond',
    'base_link_mark',
    'head_link_mark',
    'base_mark',
    'head_mark',
    'base_text',
    'miss_bond',
    'have_bond',
    'have_text',
]);
export const LoadFindLike = z.object({
    base: z.lazy(() => LoadFindLikeLinkBond),
    form: z.literal('like'),
    head: z.union([
        z.lazy(() => LoadFindLikeLinkBond),
        z.lazy(() => LoadFindLikeBond),
    ]),
    test: LoadFindTest,
});
export const LoadFindLink = z.union([
    z.lazy(() => LoadFindLike),
    z.lazy(() => LoadFindRoll),
    z.lazy(() => LoadFindBind),
]);
export const LoadFindLikeBond = z.union([
    z.string(),
    z.boolean(),
    z.null(),
    z.number(),
]);
export const LoadFindLikeLinkBond = z.object({
    link: z.string(),
});
export const LoadReadLink = z.object({
    find: z.optional(LoadFind),
    read: LoadRead,
});
export const LoadSaveBase = z.object({
    find: z.optional(LoadFind),
    read: z.optional(LoadRead),
    save: z.optional(LoadSave),
    task: z.optional(z.string()),
});
export const LoadSort = z.object({
    name: z.string(),
    tilt: z.enum(['+', '-']),
});
//# sourceMappingURL=types.js.map