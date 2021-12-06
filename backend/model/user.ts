import { PassbaseVerificationStatus } from "./passbase/passbaseverificationstatus";

export type User = {
  creationTime?: number;
  did: string;
  email?: string;
  passbaseUUID?: string; // User UUID created during passbase verification flow
  passbaseVerificationStatus?: PassbaseVerificationStatus; // Passbase account status for this user's passbaseUUID
}
