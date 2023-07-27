import { JSONObject, VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { ProviderType } from "./providertype";
import { ProviderVerificationStatus } from "./providerverificationstatus";

/**
 * Status as received from the API
 */
export type RawVerificationStatus = {
  // passbase: { // Status for the passbase provider
  //   status: PassbaseVerificationStatus
  // }
  extInfo: {
    providertype: ProviderType,
    status: ProviderVerificationStatus
  }
  credentials: JSONObject[] // All credentials that we have for a user (serialized to JSON objects)
}

/**
 * Status after polishing
 */
export type VerificationStatus = {
  // passbase: { // Status for the passbase provider
  //   status: PassbaseVerificationStatus
  // }
  extInfo: {
    providertype: ProviderType,
    status: ProviderVerificationStatus
  }
  credentials: VerifiableCredential[] // All credentials that we have for a user
}
