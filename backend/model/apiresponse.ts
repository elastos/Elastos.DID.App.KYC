export type APIResponse<T> = {
    message?: string, // Usually, the error message, if any
    data?: T
}
