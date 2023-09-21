// {
//     "ErrorCode": 0,
//     "ErrorMsg": "Success",
//     "VerificationDetailList": [
//       {
//         "ErrorCode": 0,
//         "ErrorMsg": "Success",
//         "LivenessErrorCode": 0,
//         "LivenessErrorMsg": "Success",
//         "CompareErrorCode": 0,
//         "CompareErrorMsg": "Success",
//         "ReqTimestamp": 1694672587648,
//         "Similarity": 96.67,
//         "Seq": "3a8f746f-xxx"
//       }
//     ],
//     "VideoBase64": "xxx",
//     "BestFrameBase64": "xxx",
//     "RequestId": "b7d4919f-xxx"
//   }

export type LivenessResult = {
    ErrorCode: number,
    ErrorMsg: string,
    VerificationDetailList: VerificationDetail[],
    VideoBase64: string,
    BestFrameBase64: string,
    RequestId: string
}

type VerificationDetail = {
    ErrorCode: number,
    ErrorMsg: string,
    LivenessErrorCode: number,
    LivenessErrorMsg: string,
    CompareErrorCode: number,
    CompareErrorMsg: string,
    ReqTimestamp: number,
    Similarity: number,
    Seq: string
}
