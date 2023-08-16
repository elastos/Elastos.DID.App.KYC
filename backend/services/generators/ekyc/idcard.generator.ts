import { VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { SecretConfig } from "../../../config/env-secret";
import { FullCredentialType } from "../../../model/fullcredentialtype";
import { ekycService } from "../../ekyc.service";
import { EkycIDCardOCRInfo } from "../../../model/ekyc/ekycresult";
import { CommonUtils, commonUtils } from "../../../utils/commonutils";

export class EkycIDCardGenerator {
  public async generateAll(did: string, ocrIdInfo: EkycIDCardOCRInfo, generatedCredentials: VerifiableCredential[]): Promise<void> {
    if (!ocrIdInfo) {
      console.warn("EKYC info incomplete");
      return null;
    }
    // name - 姓名 - https://ns.elastos.org/credentials/profile/name/v1
    // ethnicGroup - 民族 - TODO - https://ns.elastos.org/credentials/profile/ethnicgroup/v1
    // gender - 性别 - https://ns.elastos.org/credentials/profile/gender/v1
    // birthDate - 出生日期 - TODO - https://ns.elastos.org/credentials/profile/birthdate/v1
    // address - 地址 - TODO - https://ns.elastos.org/credentials/profile/address/v1
    // nationalId - 身份证号 - TODO - https://ns.elastos.org/credentials/profile/nationalid/v1
    // nationalIdHash - 身份证号Hash - TODO - https://ns.elastos.org/credentials/profile/nationalidhash/v1

    // name
    let nameCredential = await this.generateNameCredential(did, ocrIdInfo);
    if (nameCredential)
      generatedCredentials.push(nameCredential);

    //ethnicGroup
    let ethnicGroupCredential = await this.generateEthnicGroupCredential(did, ocrIdInfo);
    if (ethnicGroupCredential)
      generatedCredentials.push(ethnicGroupCredential);

    // gender
    let genderCredential = await this.generateGenderCredential(did, ocrIdInfo);
    if (genderCredential)
      generatedCredentials.push(genderCredential);

    // birthDate
    let birthDateCredential = await this.generateBirthDateCredential(did, ocrIdInfo);
    if (birthDateCredential)
      generatedCredentials.push(birthDateCredential);

    // address
    let addressCredential = await this.generateAddressCredential(did, ocrIdInfo);
    if (addressCredential)
      generatedCredentials.push(addressCredential);

    // nationalId
    let nationalIdCredential = await this.generateNationalIdCredential(did, ocrIdInfo);
    if (nationalIdCredential)
      generatedCredentials.push(nationalIdCredential);

    // nationalIdHash
    let nationalIdHashCredential = await this.generateNationalIdHashCredential(did, ocrIdInfo);
    if (nationalIdHashCredential)
      generatedCredentials.push(nationalIdHashCredential);
  }

  // Generate name credential
  private async generateNameCredential(targetDID: string, ocrIdInfo: EkycIDCardOCRInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.name)
      return null;

    let credentialType: FullCredentialType = {
      context: "https://ns.elastos.org/credentials/profile/name/v1",
      shortType: "NameCredential"
    };

    let credentialSubject = {
      name: ocrIdInfo.name,
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/name.png`;
    let title = "Name";
    let description = "${name}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }

  // Generate gender credential
  private async generateGenderCredential(targetDID: string, ocrIdInfo: EkycIDCardOCRInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.sex)
      return null;

    let credentialType = {
      context: "https://ns.elastos.org/credentials/profile/gender/v1",
      shortType: "GenderCredential"
    };

    if (ocrIdInfo.sex == "男") {
      ocrIdInfo.sex = "M"
    }

    if (ocrIdInfo.sex == "女") {
      ocrIdInfo.sex = "F"
    }

    let credentialSubject = {
      gender: ocrIdInfo.sex,
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/gender.png`;
    let title = "Gender";
    let description = "${gender}";

    // Create Credential
    return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
  }


  private async generateBirthDateCredential(targetDID: string, ocrIdInfo: EkycIDCardOCRInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.birthDate)
      return null;

    let credentialType = {
      context: "did://elastos/iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK/BirthDateCredential",
      shortType: "BirthDateCredential"
    };
    let credentialSubject = {
      dateOfBirth: ocrIdInfo.birthDate,
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/birthdate.png`;
    let title = "Date of birth";
    let description = "${dateOfBirth}";

    // Create Credential
    // return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
    // Workaround
    const types = [
      "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
      "https://ns.elastos.org/credentials/v1#SensitiveCredential"
    ]
    return await ekycService.createBaseCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description, types);
  }

  // Generate EthnicGroup credential
  private async generateEthnicGroupCredential(targetDID: string, ocrIdInfo: EkycIDCardOCRInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.ethnicity)
      return null;

    let credentialType = {
      context: "https://ns.elastos.org/credentials/profile/ethnicgroup/v1",
      shortType: "EthnicGroupCredential"
    };
    let credentialSubject = {
      ethnicgroup: ocrIdInfo.ethnicity,
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/ethnicgroup.png`;
    let title = "Ethnic group";
    let description = "${ethnicgroup}";

    // Create Credential
    // return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);

    // Workaround
    const types = [
      "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
      "https://ns.elastos.org/credentials/v1#SensitiveCredential"
    ]
    return await ekycService.createBaseCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description, types);
  }

  // Generate address credential
  private async generateAddressCredential(targetDID: string, ocrIdInfo: EkycIDCardOCRInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.address)
      return null;

    let credentialType = {
      context: "https://ns.elastos.org/credentials/profile/address/v1",
      shortType: "AddressCredential"
    };
    let credentialSubject = {
      address: ocrIdInfo.address,
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/address.png`;
    let title = "Address";
    let description = "${address}";

    // Create Credential
    // return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);

    // Workaround
    const types = [
      "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
      "https://ns.elastos.org/credentials/v1#SensitiveCredential"
    ]
    return await ekycService.createBaseCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description, types);
  }

  /**
   * nationalIdCredential
   */
  //TODO tobe update id number
  private async generateNationalIdCredential(targetDID: string, ocrIdInfo: EkycIDCardOCRInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.idNumber)
      return null;

    let credentialType = {
      context: "https://ns.elastos.org/credentials/profile/nationalid/v1",
      shortType: "NationalIdCredential"
    };
    let credentialSubject = {
      nationalId: ocrIdInfo.idNumber,
    };
    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/nationalid.png`;
    let title = "National Id";
    let description = "${nationalId}";

    // Create Credential
    // return await ekycService.createCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description);
    // Workaround
    const types = [
      "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
      "https://ns.elastos.org/credentials/v1#SensitiveCredential"
    ]
    return await ekycService.createBaseCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description, types);
  }

  /**
   * nationalIdHashCredential
   */
  //TODO tobe update id number hash
  private async generateNationalIdHashCredential(targetDID: string, ocrIdInfo: EkycIDCardOCRInfo): Promise<VerifiableCredential> {
    if (!ocrIdInfo.idNumber || !ocrIdInfo.name)
      return null;

    const nationalIdUtf8 = Buffer.from(ocrIdInfo.idNumber, 'utf-8').toString();
    const nationalIdUTF8NFC = nationalIdUtf8.normalize('NFC');

    const nameUtf8 = Buffer.from(ocrIdInfo.name, 'utf-8').toString();
    const nameUtf8NFC = nameUtf8.normalize('NFC');

    const nationalIdHash = CommonUtils.SHA256(nationalIdUTF8NFC + nameUtf8NFC);

    console.log("nationalIdHash = ", nationalIdHash);

    let credentialType = {
      context: "https://ns.elastos.org/credentials/profile/nationalidhash/v1",
      shortType: "NationalIdHashCredential"
    };

    let credentialSubject = {
      nationalIdHash: nationalIdHash,
    };

    let iconUrl = `${SecretConfig.Express.publicEndpoint}/icons/credentials/nationalidhash.png`;
    let title = "National Id hash";
    let description = "${nationalIdHash}";
    // const types = [
    //   "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
    //   "https://ns.elastos.org/credentials/profile/nationalidhash/v1#NationalIdHashCredential"
    // ]
    // Create Credential
    // return await ekycService.createBaseCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description, types);
    // Workaround
    const types = [
      "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
    ]
    return await ekycService.createBaseCredential(targetDID, credentialType, credentialSubject, iconUrl, title, description, types);
  }


}