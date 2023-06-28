import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { SecretConfig } from "../../../config/env-secret";
import { FullCredentialType } from "../../../model/fullcredentialtype";
import { ekycService } from "../../ekyc.service";
import { OCRIdInfo } from "../../../model/ekyc/ekycresult";
import { CommonUtils, commonUtils } from "../../../utils/commonutils";

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

    let passportNumberCredential = await this.generatePassportNumberCredential(did, ocrIdInfo);
    if (passportNumberCredential)
      generatedCredentials.push(passportNumberCredential);

    let passportNumberHashCredential = await this.generatePassPortNumberHashCredential(did, ocrIdInfo);
    if (passportNumberHashCredential)
      generatedCredentials.push(passportNumberHashCredential);
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

    const formateDate = this.formatDate(ocrIdInfo.birthDate.toUpperCase());
    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/BirthDateCredential",
      shortType: "BirthDateCredential"
    };
    let credentialSubject = {
      dateOfBirth: formateDate,
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/birthdate.png`;
    let title = "Date of birth";
    let description = "${dateOfBirth}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  /**
   * PassportNumberCredential
   */
  private async generatePassportNumberCredential(targetDID: string, ocrIdInfo: OCRIdInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.passportNo)
      return null;

    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/PassportNumberCredential",
      shortType: "PassportNumberCredential"
    };
    let credentialSubject = {
      passportNo: ocrIdInfo.passportNo.toUpperCase(),
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/passportno.png`;
    let title = "PassportNumber";
    let description = "${passportNo}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  /**
   * PassportNumberHashCredential
   */
  private async generatePassPortNumberHashCredential(targetDID: string, ocrIdInfo: OCRIdInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.passportNo || !ocrIdInfo.givenname || !ocrIdInfo.surname)
      return null;

    const passportNoHash = CommonUtils.SHA256(ocrIdInfo.passportNo.toUpperCase() + ocrIdInfo.givenname.toUpperCase() + ocrIdInfo.surname.toUpperCase());
    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/PassportNumberHashCredential",
      shortType: "PassportNumberHashCredential"
    };
    let credentialSubject = {
      passportNoHash: passportNoHash,
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/passportnohash.png`;
    let title = "PassportNumberHash";
    let description = "${passportNoHash}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  /**
   * formate time: dd-mm-yyyy => yyyy-mm-dd
   */
  public formatDate(date: string): string {
    if (!date)
      return null;

    let parts = date.split("-");
    if (parts.length != 3)
      return null;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

}