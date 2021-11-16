export enum ErrorType {
    STATE_ERROR, // 400
    FORBIDDEN_ACCESS, // 401
    INVALID_PARAMETER, // 403
    SERVER_ERROR // 500
}

export type DataOrError<T> = {
    error?: string, // If there is an error, the error message
    errorType?: ErrorType; // Hint to assess the http error code to return
    data?: T;
}
