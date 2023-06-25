export enum EKYCReturnCode {
    // Success = "1000",           // All processes are complete
    // SystemError = "1001",       // missing TransactionId
    // FlowError = "1002",         // The process is missing or abnormal, no process is available
    // InitError = "1003",         // Client initialization exception
    // CameraError = "1004",       // Evoking camera exception
    // ProductCodeError = "1005",  // Product code return error
    // RetryLimitError = "1006",   // The number of retry exceeds the upper limit.
    // UserQuit = "1007",          // User voluntarily logs out
    // SystemException = "1008",   // System exception
    // eKYCFail = "1009",          /* Authentication failed.    
    //                              * Indicate any of the following conditions：    
    //                              * The ID recognition process failed.    
    //                              * The face verification process failed.    
    //                              * The whole eKYC process failed
    //                              */


    SUCCESS = "1000",
    VERIFY_FAILED = "1001",
    SYSTEM_ERROR = "1002",
    SDK_INIT_ERROR = "1003",
    CAMERA_INIT_ERROR = "1004",
    NETWORK_ERROR = "1005",
    USER_CANCELED = "1006",
    INVALID_TRANSACTION_ID = "1007",
    TIMESTAMP_ERROR = "1009",
    WRONG_DOCUMENT_TYPE = "1011",
    KEY_INFO_MISSING = "1012",
    BAD_IMAGE_QUALITY = "1013",
    ERROR_COUNT_EXCEEDED = "1014",
}
