import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { SecretConfig } from "../../../config/env-secret";
import { FullCredentialType } from "../../../model/fullcredentialtype";
import { NationalIDCardResourceEntry } from "../../../model/passbase/idcardresourceentry";
import { User } from "../../../model/user";
import { passbaseService } from "../../passbase.service";

// https://support.passbase.com/what-data-do-i-receive-when-users-complete-a-verification
export class PassbaseNationalIDCardGenerator {
  public async generateAll(user: User, idCardEntries: NationalIDCardResourceEntry, generatedCredentials: VerifiableCredential[], existingCredentialsInDB: VerifiableCredential[]): Promise<void> {
    let nameCredential = await this.maybeGenerateNameCredential(user.did, idCardEntries, existingCredentialsInDB);
    if (nameCredential)
      generatedCredentials.push(nameCredential);

    let nationalityCredential = await this.maybeGenerateNationalityCredential(user.did, idCardEntries, existingCredentialsInDB);
    if (nationalityCredential)
      generatedCredentials.push(nationalityCredential);

    let genderCredential = await this.maybeGenerateGenderCredential(user.did, idCardEntries, existingCredentialsInDB);
    if (genderCredential)
      generatedCredentials.push(genderCredential);

    let birthDateCredential = await this.maybeGenerateBirthDateCredential(user.did, idCardEntries, existingCredentialsInDB);
    if (birthDateCredential)
      generatedCredentials.push(birthDateCredential);
  }

  private async maybeGenerateNameCredential(targetDID: string, idCardEntries: NationalIDCardResourceEntry, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential> {
    // We need at least something in last names. Normally, we get first names AND last name. But in some cases
    // of long names, passbase can't split this well and returns everything in "last_name" without "first_names".
    if (!idCardEntries.last_name)
      return null; // Passbase could not extract the name

    let credentialType: FullCredentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/NameCredential",
      shortType: "NameCredential"
    };
    let credentialSubject = {
      lastName: idCardEntries.last_name.toUpperCase(),
      ...("first_names" in idCardEntries && { firstNames: idCardEntries.first_names.toUpperCase() }), // Add the field only if existing
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/name.png`;
    let title = "Full name";
    let description = "${lastName} ${firstNames}";

    if (passbaseService.credentialAlreadyExists(credentialType, credentialSubject, existingCredentialsInDB))
      return null;

    // Credential does not exist, create it
    return await passbaseService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  public async maybeGenerateNationalityCredential(targetDID: string, idCardEntries: NationalIDCardResourceEntry, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential> {
    if (!idCardEntries.nationality)
      return null; // Passbase could not extract the nationality

    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/NationalityCredential",
      shortType: "NationalityCredential"
    };
    let credentialSubject = {
      nationality: idCardEntries.nationality.toUpperCase(),
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/nationality.png`;
    let title = "Nationality";
    let description = "${nationality}";

    if (passbaseService.credentialAlreadyExists(credentialType, credentialSubject, existingCredentialsInDB))
      return null;

    // Credential does not exist, create it
    return await passbaseService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  private async maybeGenerateGenderCredential(targetDID: string, idCardEntries: NationalIDCardResourceEntry, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential> {
    if (!idCardEntries.sex)
      return null; // Passbase could not extract the gender

    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/GenderCredential",
      shortType: "GenderCredential"
    };
    let credentialSubject = {
      gender: idCardEntries.sex.toUpperCase(),
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/gender.png`;
    let title = "Gender";
    let description = "${gender}";

    if (passbaseService.credentialAlreadyExists(credentialType, credentialSubject, existingCredentialsInDB))
      return null;

    // Credential does not exist, create it
    return await passbaseService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  private async maybeGenerateBirthDateCredential(targetDID: string, idCardEntries: NationalIDCardResourceEntry, existingCredentialsInDB: VerifiableCredential[]): Promise<VerifiableCredential> {
    if (!idCardEntries.date_of_birth)
      return null; // Passbase could not extract the birth date

    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/BirthDateCredential",
      shortType: "BirthDateCredential"
    };
    let credentialSubject = {
      dateOfBirth: idCardEntries.date_of_birth.toUpperCase(),
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/birthdate.png`;
    let title = "Date of birth";
    let description = "${dateOfBirth}";

    if (passbaseService.credentialAlreadyExists(credentialType, credentialSubject, existingCredentialsInDB))
      return null;

    // Credential does not exist, create it
    return await passbaseService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }
}