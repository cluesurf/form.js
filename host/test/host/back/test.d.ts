import { z } from 'zod';
import { Back } from './form.js';
export declare const PostTest: z.ZodType<Back.Post>;
export declare const UserTest: z.ZodType<Back.User>;
export declare const Test: Record<Back.Name, z.ZodType<any>>;
export declare function need<Name extends Back.Name>(bond: unknown, form: Name): asserts bond is Back.Form[Name];
export declare function test<Name extends Back.Name>(bond: unknown, form: Name): bond is Back.Form[Name];
export declare function take<Name extends Back.Name>(bond: unknown, form: Name): Back.Form[Name];
