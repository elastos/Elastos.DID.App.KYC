import { DIDBackend, DIDDocument, DIDStore, Features, RootIdentity } from "@elastosfoundation/did-js-sdk";
import { MyDIDAdapter } from "../adapters/mydid.adapter";
import { SecretConfig } from "../config/env-secret";

const storePass = "unsafepass"; // No real password. We store the mnemonic in the service anyway.

class DIDService {
  private issuerDID: DIDDocument = null;

  public async setup() {
    let storeId = "kyc-did-store";
    let passphrase = ""; // No mnemonic passphrase

    // Use full DID types with contexts
    Features.enableJsonLdContext(true);

    DIDBackend.initialize(new MyDIDAdapter());

    let didStore = await DIDStore.open(storeId);
    if (!didStore.containsDid(SecretConfig.DID.credentialIssuerDIDString)) {
      // The main issuer DID was not imported to the DID store yet, so we do it now.
      // This is mandatory to be able  to issue and sign credentials for others

      let rootIdentity = RootIdentity.createFromMnemonic(SecretConfig.DID.credentialIssuerDIDMnemonic, passphrase, didStore, storePass, true);
      console.log("Created issuer root identity");

      this.issuerDID = await rootIdentity.newDid(storePass, 0, true); // Index 0, overwrite
      console.log("Issuer DID:", this.issuerDID.getSubject().toString());
    }
    else {
      this.issuerDID = await didStore.loadDid(SecretConfig.DID.credentialIssuerDIDString);
      console.log("Loaded issuer DID:", this.issuerDID.getSubject().toString());
    }
  }

  public getIssuerDID(): DIDDocument {
    return this.issuerDID;
  }

  public getStorePass(): string {
    return storePass;
  }
}

export const didService = new DIDService();