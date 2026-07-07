export type UserRole = "user" | "admin";

export type AdminResult<T> = { ok: true; data: T } | { ok: false; error: string };
