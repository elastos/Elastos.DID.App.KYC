import { DID, Issuer, JSONObject, VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import {
  PassbaseClient,
  PassbaseConfiguration,
  ResponseFormats
} from "@passbase/node";
import { createPrivateKey, privateEncrypt } from "crypto";
import deepEqual from "deep-equal";
import { readFileSync } from "fs";
import moment from "moment";
import { SecretConfig } from "../config/env-secret";
import logger from "../logger";
import { PassbaseVerificationStatus } from "../model/passbase/passbaseverificationstatus";
import { PassportResourceEntry } from "../model/passbase/passportresourceentry";
import { User } from "../model/user";
import { dbService } from "./db.service";
import { didService } from "./did.service";

class PassbaseService {
  private passbaseClient: PassbaseClient = null;

  public setup() {
    // Configure the SDK with your API Secret access key
    const config = new PassbaseConfiguration({
      apiKey: SecretConfig.Passbase.apiKeySecret,
      format: ResponseFormats.Json,
    });
    this.passbaseClient = new PassbaseClient(config);
  }

  /**
   * Encrypts a JSON object representing metadata, into a base64 string for passbase api.
   */
  public encryptMetadata(metadata: unknown): string {
    const pkey = createPrivateKey({ format: 'pem', key: readFileSync(`./config/passbase/${SecretConfig.Passbase.metadataPrivateKey}`) });
    const encrypted_metadata = privateEncrypt(pkey, Buffer.from(JSON.stringify(metadata))).toString('base64');
    return encrypted_metadata;
  }

  /**
   * Gets user info from passbase, and checks if some potential VCs are missing. If so, generates
   * them and return them.
   */
  public async fetchNewUserCredentials(user: User, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential[]> {
    logger.log("Fetching passbase new user credentials");

    try {
      let identity = await this.passbaseClient.getIdentityById(user.passbaseUUID);
      if (!identity) {
        // Update and save current user's passbase status
        user.passbaseVerificationStatus = PassbaseVerificationStatus.UNKNOWN;
        await dbService.setPassbaseVerificationStatus(user.did, user.passbaseVerificationStatus);
        return []; // Failed to find this user
      }

      //console.log("Identity:", identity);

      // IMPORTANT: Make sure that the DID in the metadata object matches current user's DID.
      // This means that an attacker hasn't tried to pass a fake UUID to get another user's info.
      if (!identity.metadata || !("did" in identity.metadata) || identity.metadata["did"] !== user.did) {
        console.error(`Identity found for ${user.passbaseUUID} but authenticated user's DID ${user.did} doesn't match metadata DID`, identity.metadata);
        return [];
      }

      // Update and save current user's passbase status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user.passbaseVerificationStatus = identity.status as any;
      await dbService.setPassbaseVerificationStatus(user.did, user.passbaseVerificationStatus);

      if (identity.status !== "approved") {
        console.log(`Identity found for ${user.passbaseUUID} but not approved yet`);
        return [];
      }

      // Low verification score, low trust. Don't generate credentials.
      // NOTE: disabled - no need to check this, as we need to do a manual verification anyway
      /* if (identity.score < 0.8) {
        console.log(`Identity found for ${user.passbaseUUID} but trust score is too low: ${identity.score}`);
        return [];
      } */

      // Go through resources
      let generatedCredentials: VerifiableCredential[] = [];
      for (let resource of identity.resources) {
        if (resource.type === "PASSPORT") {
          let passportEntries: PassportResourceEntry = resource.datapoints as unknown as PassportResourceEntry;
          //console.log("PASSPORT RES POINTS", passportEntries);

          if (!passportEntries.mrtd_verified) {
            console.warn(`Note: passport MRTD is not verified for user ${user.passbaseUUID}.`);
            // Just a warning, continue
          }

          // CREDENTIALS TO GEN:
          /*
          - birth date : date_of_birth
          - name: last_name+ first_names
          - nationality: nationality
          - passport: document_number+ date_of_issue+ date_of_expiry+ document_origin_country+ authority
          - gender: sex*/

          let nameCredential = await this.maybeGenerateNameCredential(user.did, passportEntries, existingCredentialsInDB);
          if (nameCredential)
            generatedCredentials.push(nameCredential);

          let nationalityCredential = await this.maybeGenerateNationalityCredential(user.did, passportEntries, existingCredentialsInDB);
          if (nationalityCredential)
            generatedCredentials.push(nationalityCredential);

          let genderCredential = await this.maybeGenerateGenderCredential(user.did, passportEntries, existingCredentialsInDB);
          if (genderCredential)
            generatedCredentials.push(genderCredential);

          let birthDateCredential = await this.maybeGenerateBirthDateCredential(user.did, passportEntries, existingCredentialsInDB);
          if (birthDateCredential)
            generatedCredentials.push(birthDateCredential);
        }
        else {
          console.warn(`Unhandled passbase resource type ${resource.type} for user ${user.passbaseUUID}`);
          return [];
        }
      }

      console.log("generatedCredentials", generatedCredentials)

      return generatedCredentials;
    }
    catch (e) {
      console.warn("fetchNewUserCredentials(): Passbase error:", e);
      return [];
    }
  }

  private async maybeGenerateNameCredential(targetDID: string, passportEntries: PassportResourceEntry, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential> {
    if (!passportEntries.first_names || !passportEntries.last_name)
      return null; // Passbase could not extract the name

    let credentialType = "NameCredential";
    let credentialSubject = {
      lastName: passportEntries.last_name.toUpperCase(),
      firstNames: passportEntries.first_names.toUpperCase(),
      mrtdVerified: passportEntries.mrtd_verified || false
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/name.png`;
    let title = "Full name";
    let description = "${lastName} ${firstNames}";

    if (this.credentialAlreadyExists(credentialType, credentialSubject, existingCredentialsInDB))
      return null;

    // Credential does not exist, create it
    return await this.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  private async maybeGenerateNationalityCredential(targetDID: string, passportEntries: PassportResourceEntry, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential> {
    if (!passportEntries.nationality)
      return null; // Passbase could not extract the nationality

    let credentialType = "NationalityCredential";
    let credentialSubject = {
      nationality: passportEntries.nationality.toUpperCase(),
      mrtdVerified: passportEntries.mrtd_verified || false
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/name.png`;
    let title = "Nationality";
    let description = "${nationality}";

    if (this.credentialAlreadyExists(credentialType, credentialSubject, existingCredentialsInDB))
      return null;

    // Credential does not exist, create it
    return await this.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  private async maybeGenerateGenderCredential(targetDID: string, passportEntries: PassportResourceEntry, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential> {
    if (!passportEntries.sex)
      return null; // Passbase could not extract the gender

    let credentialType = "GenderCredential";
    let credentialSubject = {
      gender: passportEntries.sex.toUpperCase(),
      mrtdVerified: passportEntries.mrtd_verified || false
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/name.png`;
    let title = "Gender";
    let description = "${gender}";

    if (this.credentialAlreadyExists(credentialType, credentialSubject, existingCredentialsInDB))
      return null;

    // Credential does not exist, create it
    return await this.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  private async maybeGenerateBirthDateCredential(targetDID: string, passportEntries: PassportResourceEntry, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential> {
    if (!passportEntries.date_of_birth)
      return null; // Passbase could not extract the birth date

    let credentialType = "BirthDateCredential";
    let credentialSubject = {
      dateOfBirth: passportEntries.date_of_birth.toUpperCase(),
      mrtdVerified: passportEntries.mrtd_verified || false
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/name.png`;
    let title = "Date of birth";
    let description = "${dateOfBirth}";

    if (this.credentialAlreadyExists(credentialType, credentialSubject, existingCredentialsInDB))
      return null;

    // Credential does not exist, create it
    return await this.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  // Check if the same credential doesn't exist yet.
  // Same = same type + same subject fields
  private credentialAlreadyExists(credentialType: string, subject: unknown, existingCredentialsInDB: VerifiableCredential[]): boolean {
    // Remove the special displayable credential properties
    let filteredSubject = Object.assign({}, subject) as JSONObject;
    delete filteredSubject["displayable"];

    console.log(`Checking if credential already exists in DB`, credentialType);

    let verifiableCredentials = existingCredentialsInDB.map(credential => {
      return VerifiableCredential.parse(JSON.stringify(credential));
    });

    for (let credential of verifiableCredentials) {
      if (credential.getType().indexOf(credentialType) >= 0) {
        // Same type - now check subject keys
        let credentialFilteredSubject = Object.assign({}, credential.getSubject().getProperties()) as JSONObject;
        delete credentialFilteredSubject["displayable"];
        if (deepEqual(credentialFilteredSubject, filteredSubject)) {
          console.log(`Identical credential with type ${credentialType} already exists in DB`);
          return true;
        }
      }
    }

    return false; // Nothing matches: credential doesn't exist yet
  }

  private async createCredential(targetDID: string, credentialType: string, subject: JSONObject, iconUrl: string, title: string, description: string): Promise<VerifiableCredential> {
    let issuer = new Issuer(didService.getIssuerDID());
    //console.log("Issuer:", issuer);

    let targetDIDObj = DID.from(targetDID); // User that receives the credential
    //console.log("Target DID:", targetDID);

    let randomCredentialIdNumber = Math.floor((Math.random() * 10000000));
    let credentialId = `${credentialType}${randomCredentialIdNumber}`;

    // Append DisplayCredential info to the standard subject payload
    let fullSubject = Object.assign({}, subject, {
      displayable: {
        icon: iconUrl,
        title,
        description
      }
    });

    /**
     * DisplayableCredential: standard format to make it easy to display credentials in a human friendly way on UIs.
     * SensitiveCredential: standard format to warn users that they may be cautious about how they deal with such credentials, especially on UI, for instance to avoid publishing them on chain.
     */
    let credential = await new VerifiableCredential.Builder(issuer, targetDIDObj)
      .id(credentialId)
      .types(credentialType, "DisplayableCredential", "SensitiveCredential")
      .properties(fullSubject)
      .expirationDate(moment().add(3, "years").toDate()) // 3 years validity
      .seal(didService.getStorePass());

    return credential;
  }
}

export const passbaseService = new PassbaseService();