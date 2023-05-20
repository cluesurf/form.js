import { z } from 'zod';
export declare const LOAD_FIND_TEST: readonly ["bond", "base_link_mark", "head_link_mark", "base_mark", "head_mark", "base_text", "miss_bond", "have_bond", "have_text"];
export type Load = {
    find?: LoadFind;
    read?: LoadRead;
    save?: LoadSave;
    task?: string;
};
export type LoadFind = LoadFindLink | Array<LoadFindLink>;
export type LoadFindBind = {
    form: 'bind';
    list: Array<LoadFindLink>;
};
export type LoadFindLike = {
    base: LoadFindLikeLinkBond;
    form: 'like';
    head: LoadFindLikeBond | LoadFindLikeLinkBond;
    test: LoadFindTest;
};
export type LoadFindLikeBond = string | boolean | null | number;
export type LoadFindLikeLinkBond = {
    link: string;
};
export type LoadFindLink = LoadFindLike | LoadFindRoll | LoadFindBind;
export type LoadFindRoll = {
    form: 'roll';
    list: Array<LoadFindLink>;
};
export type LoadFindTest = (typeof LOAD_FIND_TEST)[number];
export type LoadRead = {
    [key: string]: true | LoadReadLink;
};
export type LoadReadLink = {
    find?: LoadFind;
    read: LoadRead;
};
export type LoadSave = {
    [key: string]: Array<LoadSaveBase> | LoadSaveBase;
};
export type LoadSaveBase = {
    find?: LoadFind;
    read?: LoadRead;
    save?: LoadSave;
    task?: string;
};
export type LoadSort = {
    name: string;
    tilt: '+' | '-';
};
export declare const Load: z.ZodType<Load>;
export declare const LoadFind: z.ZodType<LoadFind>;
export declare const LoadRead: z.ZodType<LoadRead>;
export declare const LoadSave: z.ZodType<LoadSave>;
export declare const LoadFindBind: z.ZodType<LoadFindBind>;
export declare const LoadFindRoll: z.ZodType<LoadFindRoll>;
export declare const LoadFindTest: z.ZodEnum<["bond", "base_link_mark", "head_link_mark", "base_mark", "head_mark", "base_text", "miss_bond", "have_bond", "have_text"]>;
export declare const LoadFindLike: z.ZodType<LoadFindLike>;
export declare const LoadFindLink: z.ZodType<LoadFindLink>;
export declare const LoadFindLikeBond: z.ZodType<LoadFindLikeBond>;
export declare const LoadFindLikeLinkBond: z.ZodType<LoadFindLikeLinkBond>;
export declare const LoadReadLink: z.ZodType<LoadReadLink>;
export declare const LoadSaveBase: z.ZodType<LoadSaveBase>;
export declare const LoadSort: z.ZodType<LoadSort>;
