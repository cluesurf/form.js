import { TEXT, test_hash, test_list, test_load, test_text, test_tree, } from './test';
export const TILT = {
    '+': 'asc',
    '-': 'desc',
};
export const TOOL_NAME = ['mind'];
const FORM_BASE_NAME = make_form_base_name_mesh(FORM);
export function load_read_like_list({ name, find, seek, }) {
    const list = [];
    const form = FORM_BASE_NAME[name];
    for (const name in find) {
        const form_list = form[name];
        if (!form_list) {
            continue;
        }
        if (!seek(name)) {
            continue;
        }
        const link = find[name];
        if (!seek_link_form(link, form_list)) {
            continue;
        }
        list.push({
            link,
            name,
            test: '=',
        });
    }
    return list;
}
function test(wave, note) {
    if (!wave) {
        throw new Error(note);
    }
}
export function load_read_name_list({ name, read, seek, }) {
    const list = [];
    const form = FORM_BASE_NAME[name];
    for (const name in read) {
        if (form[name] && seek(name)) {
            list.push(name);
        }
    }
    return list;
}
export async function make_link_list({ name, save, tool, }) {
    const form = FORM[name];
    for (const link_name in save) {
        const link = save[link_name];
        const form_link = form[link_name];
        test_load(link);
        test_text(form_link.form);
        test_tool(form_link.form);
        const hook = tool[form_link.form];
        if (test_list(link)) {
            for (const list_link of link) {
                test_load(list_link);
                test_hash(list_link.save);
                await hook.make({ save: list_link.save, tool });
            }
        }
        else {
            test_hash(link.save);
            await hook.make({ save: link.save, tool });
        }
    }
}
export function make_make_seed({ save, name, }) {
    const form = FORM[name];
    const seed_base = {};
    const seed_link = {};
    const code = uuidv4();
    for (const save_name in save) {
        test(save_name in form, 'name_fail');
        const name_form = form[save_name];
        const save_load = save[save_name];
        test_load_link_save_form(save_load);
        switch (name_form.form) {
            case 'code':
            case 'text':
            case 'wave':
            case 'date':
            case 'mark': {
                seed_base[save_name] = save_load.save;
                break;
            }
            default:
                if (name_form.code) {
                    test_tree(save_load.save, { code: { save: TEXT } });
                    seed_link[`${save_name}_code`] = save_load.save.code.save;
                }
                else {
                    test_hash(save_load.save);
                    test_text(name_form.name);
                    seed_link[save_name] = {
                        save: {
                            ...save_load.save,
                            [name_form.name]: { save: { code: { save: code } } },
                        },
                    };
                }
                break;
        }
    }
    seed_link.code = code;
    return { code, seed_base, seed_link };
}
export function make_sort_list(name, base_sort_list) {
    const sort_list = [];
    const form = FORM_BASE_NAME[name];
    base_sort_list.forEach(base_sort => {
        const base_name = base_sort.name;
        if (seek_sort_name(base_name, form)) {
            sort_list.push({
                name: base_name,
                tilt: TILT[base_sort.tilt],
            });
        }
    });
    return sort_list;
}
export function read_base_link_form(blob) {
    const form = typeof blob;
    switch (form) {
        case 'string':
            return 'text';
        case 'number':
            return 'mark';
        case 'undefined':
            return 'void';
        default:
            if (blob == null) {
                return 'void';
            }
            else {
                return 'mesh';
            }
    }
}
export async function read_list({ find, read, name, curb = 100, move, sort = [], seek, }) {
    const { count } = db.fn;
    const like_list = load_read_like_list({
        find,
        name,
        seek,
    });
    let size_find = db
        .selectFrom(`tl_${name}`)
        .select([count('code').as('size')]);
    like_list.forEach(like => {
        size_find = size_find.where(like.name, like.test, like.link);
    });
    const { size } = (await size_find.executeTakeFirst()) ?? { size: 0 };
    const read_list = load_read_name_list({
        name,
        read,
        seek,
    });
    let list_find = db.selectFrom(`tl_${name}`).select(read_list);
    like_list.forEach(like => {
        list_find = list_find.where(like.name, like.test, like.link);
    });
    if (curb) {
        list_find = list_find.limit(curb);
    }
    if (move) {
        list_find = list_find.offset(move);
    }
    const sort_list = make_sort_list(name, sort);
    sort_list.forEach(sort => {
        list_find = list_find.orderBy(sort.name, sort.tilt);
    });
    const list = await list_find.execute();
    return { list, size };
}
export async function read_mesh({ find, read, name, seek, }) {
    const read_list = load_read_name_list({
        name,
        read,
        seek,
    });
    const like_list = load_read_like_list({
        find,
        name,
        seek,
    });
    let query = db.selectFrom(`tl_${name}`).select(read_list);
    like_list.forEach(like => {
        query = query.where(like.name, like.test, like.link);
    });
    return await query.executeTakeFirst();
}
// export async function read_link_list<L extends string>({
//   tool,
//   read,
//   config,
//   find,
// }: ReadAssocationLinkForm<L>) {
//   const result: Record<string, unknown> = {}
//   for (const key in config.keys) {
//     // test_form(key, config.check)
//     if (seek_tree(read, { [key]: READ_CONFIG_OBJECT })) {
//       const toolName = config.keys[key]
//       const details = read[key]
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//       const data = await tool[toolName].read({
//         find: {
//           ...details.find,
//           ...find,
//         },
//         read: details.read,
//         tool,
//       })
//       result[key] = data
//     }
//   }
//   return result
// }
function make_form_base_name_mesh(base) {
    const mesh = {};
    for (const form_name in base) {
        const form = base[form_name];
        const mesh_form = {};
        for (const link_name in form) {
            const link = form[link_name];
            switch (link.form) {
                case 'code':
                case 'wave':
                case 'mark':
                case 'text':
                case 'date': {
                    const form_name = [link.form];
                    if (link.void) {
                        form_name.push('void');
                    }
                    mesh_form[link_name] = form_name;
                    break;
                }
                default:
                    break;
            }
        }
        mesh[`tl_${form_name}`] = mesh_form;
    }
    return mesh;
}
export function seek_link_form(link, form_list) {
    const form = read_base_link_form(link);
    return form_list.includes(form);
}
export function seek_sort_name(name, name_list) {
    return name_list.hasOwnProperty(name);
}
export function seek_tool(name) {
    return TOOL_NAME.includes(name);
}
 && typeof base && !Array.isArray(base);
{
    return;
}
throw new Error('invalid');
export function test_tool(name) {
    if (!seek_tool(name)) {
        throw new Error('test_fail');
    }
}
//# sourceMappingURL=kysely.js.map