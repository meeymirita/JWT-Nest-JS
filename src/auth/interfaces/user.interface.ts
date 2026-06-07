export const SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    updatedAt: true,
} as const;

export type SafeUser = {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
};
