import { JSONObject } from "@elastosfoundation/did-js-sdk";
import { ProviderType } from "./providertype";
import { ProviderVerificationStatus } from "./providerverificationstatus";
// import { PassbaseVerificationStatus } from "./passbase/passbaseverificationstatus";

export type VerificationStatus = {
  // passbase: { // Status for the passbase provider
  //   status: PassbaseVerificationStatus
  // }
  extInfo: {
    type: ProviderType | string,
    status: ProviderVerificationStatus
  },
  credentials: JSONObject[] // All credentials that we have for this user (serialized to JSON objects)
}