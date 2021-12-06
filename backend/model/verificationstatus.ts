import { JSONObject } from "@elastosfoundation/did-js-sdk";
import { PassbaseVerificationStatus } from "./passbase/passbaseverificationstatus";

export type VerificationStatus = {
  passbase: { // Status for the passbase provider
    status: PassbaseVerificationStatus
  }
  credentials: JSONObject[] // All credentials that we have for this user (serialized to JSON objects)
}