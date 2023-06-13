export enum EKYCReturnCode {
    Success = "1000",           // All processes are complete
    SystemError = "1001",       // missing TransactionId
    FlowError = "1002",         // The process is missing or abnormal, no process is available
    InitError = "1003",         // Client initialization exception
    CameraError = "1004",       // Evoking camera exception
    ProductCodeError = "1005",  // Product code return error
    RetryLimitError = "1006",   // The number of retry exceeds the upper limit.
    UserQuit = "1007",          // User voluntarily logs out
    SystemException = "1008",   // System exception
    eKYCFail = "1009",          /* Authentication failed.    
                                 * Indicate any of the following conditions：    
                                 * The ID recognition process failed.    
                                 * The face verification process failed.    
                                 * The whole eKYC process failed
                                 */
}
