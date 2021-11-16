export type User = {
  creationTime?: number;
  did: string;
  email?: string;
  passbaseUUID?: string; // User UUID created during passbase verification flow
}
