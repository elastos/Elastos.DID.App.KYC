export enum EKYCResponseType {
    SUCCESS = "200",
    DID_NOT_MATCH = "60001",//did don't match
    FACE_OCCLUSION = "60002", //face Occlusion
    PASSPORT_EXPIRE = "60003" //passport expire
}
