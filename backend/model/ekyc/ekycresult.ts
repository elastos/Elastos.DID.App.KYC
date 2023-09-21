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

export type EkycExtFaceInfo = {
    faceComparisonScore: number; // faceComparisonScore:    Specifies the score that indicates a result of comparing the live face (selfie) against the source face image. Required if the face verification process runs successfully. The value of this field is in the range of 0-100.
    facePassed: string; // Face Passed "N" or "Y"
    faceOcclusion: string;//Face Occlusion
}

export type EkycOCRIDEditInfo = {
}

export type SpoofInfo = {
    spoofResult: string; // spoofResult:    Y: failed the authenticity check.    N: pass.
    spoofType: string; // spoofType: SCREEN_REMARK: screen recapture    PHOTO_COPY: Copy, not original document    TAMPER: PS tampering
}

//Passport result
export type EkycPassportResult = {
    extFaceInfo: EkycExtFaceInfo;
    extIdInfo: EkycPassportExtIdInfo;
    passed: string;
    subCode: string;
}

export type EkycPassportExtIdInfo = {
    ocrIdEditInfo: EkycOCRIDEditInfo;
    ocrIdInfo: EkycPassportOCRIdInfo;
    ocrIdPassed: string;
    spoofInfo: SpoofInfo;
}

export type EkycPassportOCRIdInfo = {
    surname: string; // Surname
    givenname: string; // Given name
    sex: string; // Gender
    birthDate: string; // Date of birth
    passportNo: string; // Passport number
    nationality: string; // Country
    expiryDate: string; // Date of Expiry
    countryCode: string; // Country Code
}

//ID card
export type EkycIDCardResult = {
    extFaceInfo: EkycExtFaceInfo;
    extIdInfo: EkycIDCardExtIdInfo;
    passed: string;
    subCode: string;
}

export type EkycIDCardExtIdInfo = {
    ocrIdEditInfo: EkycOCRIDEditInfo;
    ocrIdInfo: EkycIDCardOCRInfo;
    ocrIdPassed: string;
    spoofInfo: SpoofInfo;
}

export type EkycIDCardOCRInfo = {
    address: string,
    ethnicity: string,
    province: string,
    city: string,
    sex: string,
    name: string,
    idNumber: string,
    birthDate: string // yyyy-MM-dd
}

