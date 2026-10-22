export interface ResultError {
    message: string;
}

export type Result<T = void, E = ResultError> =
    | { readonly success: true; readonly data: T; readonly error: null }
    | { readonly success: false; readonly data: null; readonly error: E };

// ---------- ok ----------
export function ok(): Result<void>;
export function ok<T>(data: T): Result<T>;
export function ok<T = void>(data?: T): Result<T> {
    return { success: true, data: data as T, error: null };
}

// ---------- fail ----------
export function fail(): Result<never>;
export function fail(message: string): Result<never>;
export function fail<E>(error: E): Result<never, E>;
export function fail<E = ResultError>(arg?: E | string): Result<never, E> {
    if (arg === undefined) {
        return { success: false, data: null, error: { message: "fail" } as E };
    }
    if (typeof arg === "string") {
        return { success: false, data: null, error: { message: arg } as E };
    }
    return { success: false, data: null, error: arg };
}