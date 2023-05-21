import { Base } from './index.js';
export default function make(base: Base): Promise<{
    back: {
        form: string;
        test: string;
    };
    face: {
        form: string;
        test: string;
    };
}>;
