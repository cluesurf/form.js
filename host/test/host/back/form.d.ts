export declare namespace Back {
    namespace Form {
        type Post = {
            authorId: string;
            content: string;
            createdAt: Date;
            id: string;
            title: string;
        };
        type User = {
            email?: string | null | undefined;
            id: string;
            name: string;
        };
    }
    type Base = {
        post: Form.Post;
        user: Form.User;
    };
    type Name = keyof Base;
}
