export declare namespace Face {
    namespace Form {
        type Post = {
            author: User;
            content: string;
            createdAt: Date;
            id: string;
            title: string;
        };
        type User = {
            email?: string | null | undefined;
            id: string;
            name: string;
            posts: Array<Post>;
        };
    }
    type Base = {
        post: Form.Post;
        user: Form.User;
    };
    type Name = keyof Base;
}
