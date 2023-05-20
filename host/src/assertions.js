/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
export const LIST = [];
export const MARK = 1;
export const OBJECT = {};
export const OBJECT_LIST = [];
export const TEXT = '';
export const WAVE = true;
export function isArray(x) {
    return _.isArray(x);
}
export function isObject(x) {
    return _.isObject(x);
}
export function seek_load(x) {
    return (!_.isArray(x) &&
        _.isObject(x) &&
        ('task' in x || 'save' in x || 'find' in x || 'take' in x));
}
export function seek_save(x) {
    return !_.isArray(x) && _.isObject(x);
}
export function seek_text(x) {
    return _.isString(x);
}
export function seek_tree(x, example, message = 'invalid value') {
    const typex = getForm(x);
    if (typex !== getForm(example)) {
        return false;
    }
    if (typex === 'object') {
        for (const name in example) {
            if (!seek_tree(x[name], example[name], message)) {
                return false;
            }
        }
    }
    return true;
}
export function seek_wave(x) {
    return _.isBoolean(x);
}
export function test_code(x) {
    if (!seek_code(x)) {
        throw new Error('not_uuid');
    }
}
export function test_form(seed, check, invalid = 'invalid') {
    if (!check(seed)) {
        throw new Error(invalid);
    }
}
export function test_hash(x) {
    if (!seek_hash(x)) {
        throw new Error('not_object');
    }
}
export function test_list(x) {
    return seek_list(x);
}
export function test_load(x) {
    if (!seek_load(x)) {
        throw new Error('not_load');
    }
}
export function test_save(x) {
    if (!seek_save(x)) {
        throw new Error('not_save');
    }
}
export function test_text(x) {
    if (!seek_text(x)) {
        throw new Error('not_string');
    }
}
function getForm(x) {
    const rawForm = typeof x;
    if (rawForm === 'object' && !x) {
        return 'null';
    }
    if (Array.isArray(x)) {
        return 'array';
    }
    return rawForm;
}
export function test_tree(x, example, message = 'invalid value') {
    const typex = getForm(x);
    if (typex !== getForm(example)) {
        throw new Error(message);
    }
    if (typex === 'object') {
        for (const name in example) {
            test_tree(x[name], example[name], message);
        }
    }
}
//# sourceMappingURL=assertions.js.map