import { z } from 'zod';
import { Face } from './form.js';
export declare const PostTest: z.ZodType<Face.Post>;
export declare const UserTest: z.ZodType<Face.User>;
export declare const Test: Record<Face.Name, z.ZodType<any>>;
export declare function need<Name extends Face.Name>(bond: unknown, form: Name): asserts bond is Face.Form[Name];
export declare function test<Name extends Face.Name>(bond: unknown, form: Name): bond is Face.Form[Name];
export declare function take<Name extends Face.Name>(bond: unknown, form: Name): Face.Form[Name];
