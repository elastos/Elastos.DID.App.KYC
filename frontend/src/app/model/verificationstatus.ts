import { JSONObject, VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { PassbaseVerificationStatus } from "./passbase/passbaseverificationstatus";

/**
 * Status as received from the API
 */
export type RawVerificationStatus = {
  passbase: { // Status for the passbase provider
    status: PassbaseVerificationStatus
  }
  credentials: JSONObject[] // All credentials that we have for a user (serialized to JSON objects)
}

/**
 * Status after polishing
 */
export type VerificationStatus = {
  passbase: { // Status for the passbase provider
    status: PassbaseVerificationStatus
  }
  credentials: VerifiableCredential[] // All credentials that we have for a user
}