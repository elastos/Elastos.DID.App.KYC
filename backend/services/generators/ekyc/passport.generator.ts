import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { SecretConfig } from "../../../config/env-secret";
import { FullCredentialType } from "../../../model/fullcredentialtype";
import { passbaseService } from "../../passbase.service";
import { ekycService } from "../../ekyc.service";
import { OCRIdInfo } from "../../../model/ekyc/ekycresult";

export class EkycPassportGenerator {
  public async generateAll(did: string, ocrIdInfo: OCRIdInfo, generatedCredentials: VerifiableCredential[]): Promise<void> {
    if (!ocrIdInfo) {
      console.warn("EKYC info incomplete");
      return null;
    }

    let nameCredential = await this.generateNameCredential(did, ocrIdInfo);
    if (nameCredential)
      generatedCredentials.push(nameCredential);

    let nationalityCredential = await this.generateNationalityCredential(did, ocrIdInfo);
    if (nationalityCredential)
      generatedCredentials.push(nationalityCredential);

    let genderCredential = await this.generateGenderCredential(did, ocrIdInfo);
    if (genderCredential)
      generatedCredentials.push(genderCredential);

    let birthDateCredential = await this.generateBirthDateCredential(did, ocrIdInfo);
    if (birthDateCredential)
      generatedCredentials.push(birthDateCredential);
  }

  private async generateNameCredential(targetDID: string, ocrIdInfo: OCRIdInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.givenname)
      return null;

    let credentialType: FullCredentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/NameCredential",
      shortType: "NameCredential"
    };

    let credentialSubject = {
      lastName: ocrIdInfo.surname.toUpperCase(),
      ...("givenname" in ocrIdInfo && { firstNames: ocrIdInfo.givenname.toUpperCase() }), // Add the field only if existing
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/name.png`;
    let title = "Full name";
    let description = "${lastName} ${firstNames}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }


  public async generateNationalityCredential(targetDID: string, ocrIdInfo: OCRIdInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.nationality)
      return null;

    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/NationalityCredential",
      shortType: "NationalityCredential"
    };
    let credentialSubject = {
      nationality: ocrIdInfo.nationality.toUpperCase(),
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/nationality.png`;
    let title = "Nationality";
    let description = "${nationality}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }


  private async generateGenderCredential(targetDID: string, ocrIdInfo: OCRIdInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.sex)
      return null;

    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/GenderCredential",
      shortType: "GenderCredential"
    };
    let credentialSubject = {
      gender: ocrIdInfo.sex.toUpperCase(),
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/gender.png`;
    let title = "Gender";
    let description = "${gender}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }


  private async generateBirthDateCredential(targetDID: string, ocrIdInfo: OCRIdInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.birthDate)
      return null;

    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/BirthDateCredential",
      shortType: "BirthDateCredential"
    };
    let credentialSubject = {
      dateOfBirth: ocrIdInfo.birthDate.toUpperCase(),
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/birthdate.png`;
    let title = "Date of birth";
    let description = "${dateOfBirth}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }
}