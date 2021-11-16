export type Credential = {
  owner: string; // DID string of the user that owns this credential
  vc: unknown; // Verifiable Credential JSON object, parseable by the DID SDK
}