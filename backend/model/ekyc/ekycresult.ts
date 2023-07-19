export type EkycResponse = {
    code: string;
    message: string;
    requestId: string;
    result: EkycRawResult;
}

export type EkycRawResult = {
    extFaceInfo: string;
    extIdInfo: string;
    passed: string;
    subCode: string;
}

export type EKYCResult = {
    extFaceInfo: ExtFaceInfo;
    extIdInfo: ExtIdInfo;
    passed: string;
    subCode: string;
}

export type ExtFaceInfo = {
    faceComparisonScore: number; // faceComparisonScore:    Specifies the score that indicates a result of comparing the live face (selfie) against the source face image. Required if the face verification process runs successfully. The value of this field is in the range of 0-100.
    facePassed: string; // Face Passed "N" or "Y"
    faceOcclusion: string;//Face Occlusion
}

export type ExtIdInfo = {
    ocrIdEditInfo: OCRIDEditInfo;
    ocrIdInfo: OCRIdInfo;
    ocrIdPassed: string;
    spoofInfo: SpoofInfo;
}

export type OCRIDEditInfo = {
}

export type OCRIdInfo = {
    surname: string; // Surname
    givenname: string; // Given name
    sex: string; // Gender
    birthDate: string; // Date of birth
    passportNo: string; // Passport number
    nationality: string; // Country
    expiryDate: string; // Date of Expiry
    countryCode: string; // Country Code
}


export type SpoofInfo = {
    spoofResult: string; // spoofResult:    Y: failed the authenticity check.    N: pass.
    spoofType: string; // spoofType: SCREEN_REMARK: screen recapture    PHOTO_COPY: Copy, not original document    TAMPER: PS tampering
}