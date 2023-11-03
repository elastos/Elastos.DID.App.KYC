import { DID, Issuer, JSONObject, VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { SecretConfig } from "../config/env-secret";
import { createRequire } from "module";

import { FullCredentialType } from "../model/fullcredentialtype";
import { didService } from "./did.service";
import moment from "moment";
import { EkycIDCardOCRInfo, EkycIDCardResult, EkycPassportOCRIdInfo, EkycPassportResult, EkycRawResult, EkycResponse } from "../model/ekyc/ekycresult";
import { EkycPassportGenerator } from "./generators/ekyc/passport.generator";
import { EkycIDCardGenerator } from "./generators/ekyc/idcard.generator";
import SparkMD5 from 'spark-md5';
import { RequestOptions, request } from "http";
import { UploadUrlResult } from "../model/ekyc/tencent/uploadurlresult";
import { IDCardOCROriginResult, IDCardOCRResult } from "../model/ekyc/tencent/idcardocrresult";
import { VerificationUrlresult } from "../model/ekyc/tencent/verificationurlresult";
import { dbService } from "./db.service";
import { CommonUtils } from "../utils/commonutils";
import { DocType } from "../model/ekyc/ekycproductcode";
import { PassportOcrResult } from "../model/ekyc/tencent/passportocrresult";

const require = createRequire(import.meta.url);
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

const OcrClient = tencentcloud.ocr.v20181119.Client;
const models = tencentcloud.ocr.v20181119.Models;

const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;

const FaceidClient = tencentcloud.faceid.v20180301.Client;
const faceIdmodels = tencentcloud.faceid.v20180301.Models;

const leastScore = 0.93;

class TencentEkycService {
  public async setup() {
  }

  processEkyc(docType: string, imageBase64: string, redirectUrl: string): Promise<{ verificationUrlresult: string, ocrResult: any }> {
    return new Promise(async (resolve, reject) => {
      try {
        let retImageBase64 = '';
        let ocrResult;
        switch (docType) {
          case DocType.ChinaMainLand2ndIDCard:
            const idCardOcrResult = await this.processIDCardOCR(imageBase64);
            const idCardResult: IDCardOCRResult = this.parseIDCardOCRResult(idCardOcrResult);
            const idCardOcrOriginResult: IDCardOCROriginResult = this.parseIDCardOCROriginResult(idCardOcrResult);
            ocrResult = idCardOcrOriginResult;
            console.log('idCardResult,', idCardResult);
            console.log('redirectUrl = ', redirectUrl);
            retImageBase64 = idCardResult.AdvancedInfo.Portrait;
            if (!this.checkIDCardImageQuality(idCardResult.AdvancedInfo.Quality)) {
              reject({ requestId: '', code: 'ImageQualityScoreLow' });
              return;
            }

            if (!this.checkIDCardOCRResult(idCardOcrOriginResult)) {
              reject({ requestId: '', code: 'IDCardOCRFailed' });
              return;
            }
            break;
          case DocType.Passport:
            const result = await this.processPassportOCR(imageBase64);
            console.log('result = ', result);

            const passportOcrResult: PassportOcrResult = this.parsePassportOCRResult(result);
            ocrResult = passportOcrResult;
            retImageBase64 = passportOcrResult.Image;
            if (!this.checkPassportOCRResult(passportOcrResult)) {
              reject({ requestId: '', code: 'PassportOCRFailed' });
              return;
            }
            break;
        }
        const verificationUrlresult = await this.processLiveness(retImageBase64, redirectUrl);
        console.log('verificationUrlresult = ', verificationUrlresult);
        if (!verificationUrlresult) {
          reject('Verification Url result is null');
          return;
        }

        resolve({ verificationUrlresult: verificationUrlresult, ocrResult: ocrResult });
      } catch (error) {
        reject(error);
      }
    });
  }

  processPassportOCR(imageBase64: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

      const OcrClient = tencentcloud.ocr.v20181119.Client;
      const models = tencentcloud.ocr.v20181119.Models;

      const Credential = tencentcloud.common.Credential;
      const ClientProfile = tencentcloud.common.ClientProfile;
      const HttpProfile = tencentcloud.common.HttpProfile;

      // Initial
      // set scretId and secretKey, The key is available on the official website console https://console.tencentcloud.com/capi
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // Instantiate an http option. (optional)
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "ocr.tencentcloudapi.com";
      // Instantiate a client option. (Optional)
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;
      clientProfile.signMethod = 'TC3-HMAC-SHA256';

      // Instantiate a clientProfile. (Optional)
      let client = new OcrClient(cred, "ap-singapore", clientProfile);

      // Instantiate a request object, one for each interface
      let req = new models.MLIDPassportOCRRequest();

      let params = {
        "ImageBase64": imageBase64,
        "RetImage": true
      };

      console.log('params', params);
      req.from_json_string(JSON.stringify(params))

      // The returned resp is an instance of MLIDPassportOCRResponse, corresponding to the request object
      client.MLIDPassportOCR(req, function (err: any, response: any) {
        if (err) {
          console.log(err);
          reject(err)
          return;
        }
        // Output a string in json format back to the package
        console.log(response.to_json_string());
        resolve(response);
      });
    });
  }

  processIDCardOCR(imageBase64: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // Initial
      // set scretId and secretKey, The key is available on the official website console https://console.tencentcloud.com/capi
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // Instantiate an http option. (optional)
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "ocr.tencentcloudapi.com";
      // Instantiate a client option. (Optional)
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;
      clientProfile.signMethod = 'TC3-HMAC-SHA256';

      // Instantiate a clientProfile. (Optional)
      let client = new OcrClient(cred, "ap-beijing", clientProfile);

      // Instantiate a request object, one for each interface
      let req = new models.IDCardOCRRequest();

      const config = { "CropPortrait": true, "Quality": true };
      let params = { ImageBase64: imageBase64, Config: JSON.stringify(config) };
      req.from_json_string(JSON.stringify(params))

      // The returned resp is an instance of IDCardOCRResponse, corresponding to the request object
      client.IDCardOCR(req, (err: any, response: any) => {
        console.log("err,", err);
        console.log("response,", response);
        if (err) {
          reject(err);
          console.log(err);
          return;
        }

        // Output a string in json format back to the package
        console.log(response.to_json_string());
        resolve(response);
      });
    });
  }

  async processLiveness(imageBase64: string, redirectUrl: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const verificationUrlresult = await this.applyWebVerificationBizToken(redirectUrl, imageBase64, 'extratest:testvalue');
        console.log('result = ', verificationUrlresult);

        resolve(verificationUrlresult);
      } catch (error) {
        reject(error);
      }
    });
  }

  // applyWebVerificationToken(redirectUrl: string, compareImageUrl: string, imageMd5: string): Promise<any> {
  //   return new Promise(async (resolve, reject) => {
  //     const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

  //     const FaceidClient = tencentcloud.faceid.v20180301.Client;
  //     const models = tencentcloud.faceid.v20180301.Models;

  //     const Credential = tencentcloud.common.Credential;
  //     const ClientProfile = tencentcloud.common.ClientProfile;
  //     const HttpProfile = tencentcloud.common.HttpProfile;

  //     // Initial
  //     // set scretId and secretKey, The key is available on the official website console https://console.tencentcloud.com/capi
  //     let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
  //     // Instantiate an http option. (optional)
  //     let httpProfile = new HttpProfile();
  //     httpProfile.endpoint = "faceid.tencentcloudapi.com";
  //     // Instantiate a client option. (Optional)
  //     let clientProfile = new ClientProfile();
  //     clientProfile.httpProfile = httpProfile;

  //     // Instantiate a clientProfile. (Optional)
  //     let client = new FaceidClient(cred, "ap-singapore", clientProfile);

  //     // Instantiate a request object, one for each interface
  //     let req = new models.ApplyWebVerificationTokenRequest();

  //     let params = {
  //       "RedirectUrl": redirectUrl,
  //       "CompareImageUrl": compareImageUrl,
  //       "CompareImageMd5": imageMd5
  //     };
  //     req.from_json_string(JSON.stringify(params))
  //     console.log('Input params is ', JSON.stringify(params));

  //     // return resp is a ApplyWebVerificationTokenResponse instance, corresponding to the request object
  //     client.ApplyWebVerificationToken(req, function (err: any, response: any) {
  //       if (err) {
  //         console.log(err);
  //         reject(err);
  //         return;
  //       }
  //       // Output a string in json format back to the package
  //       console.log('ApplyWebVerificationToken = ', response.to_json_string());
  //       resolve(response);
  //       return response;
  //     });
  //   });
  // }

  applyWebVerificationBizToken(redirectUrl: string, CompareImageBase64: string, extraInfo: string) {
    return new Promise(async (resolve, reject) => {
      const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

      const FaceidClient = tencentcloud.faceid.v20180301.Client;
      const models = tencentcloud.faceid.v20180301.Models;

      const Credential = tencentcloud.common.Credential;
      const ClientProfile = tencentcloud.common.ClientProfile;
      const HttpProfile = tencentcloud.common.HttpProfile;

      // Initial
      // set scretId and secretKey, The key is available on the official website console https://console.tencentcloud.com/capi
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // Instantiate an http option. (optional)
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "faceid.tencentcloudapi.com";
      // Instantiate a client option. (Optional)
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;

      // Instantiate a clientProfile. (Optional)
      let client = new FaceidClient(cred, "ap-singapore", clientProfile);

      // Instantiate a request object, one for each interface
      let req = new models.ApplyWebVerificationBizTokenIntlRequest();

      let params = {
        "CompareImageBase64": CompareImageBase64,
        "RedirectURL": redirectUrl,
        "Extra": extraInfo,
        "Config": {
          "AutoSkip": false
        }
      };
      req.from_json_string(JSON.stringify(params))

      // Return resp is a ApplyWebVerificationBizTokenIntlResponse instance, corresponding to the request object
      client.ApplyWebVerificationBizTokenIntl(req, function (err: any, response: any) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        // Output a string in json format back to the package
        console.log(response.to_json_string());
        resolve(response.to_json_string());
      });
    });
  }

  getWebVerificationResultIntl(bizToken: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

      const FaceidClient = tencentcloud.faceid.v20180301.Client;
      const models = tencentcloud.faceid.v20180301.Models;

      const Credential = tencentcloud.common.Credential;
      const ClientProfile = tencentcloud.common.ClientProfile;
      const HttpProfile = tencentcloud.common.HttpProfile;

      // Initial
      // set scretId and secretKey, The key is available on the official website console https://console.tencentcloud.com/capi
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // Instantiate an http option. (optional)
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "faceid.tencentcloudapi.com";
      // Instantiate a client option. (Optional)
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;

      // Instantiate a clientProfile. (Optional)
      let client = new FaceidClient(cred, "ap-singapore", clientProfile);

      // Instantiate a request object, one for each interface
      let req = new models.GetWebVerificationResultIntlRequest();

      let params = {
        "BizToken": bizToken
      };
      req.from_json_string(JSON.stringify(params))

      // Return resp is a GetWebVerificationResultIntlResponse instance, corresponding to the request object
      client.GetWebVerificationResultIntl(req, function (err: any, response: any) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        // Output a string in json format back to the package
        console.log(response.to_json_string());
        resolve(response.to_json_string());
      });
    });
  }

  public async processDeleteCachedData(bizToken: string, did: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await dbService.deleteOCRInfo(bizToken);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  public async generateNewUserPassportCredentials(did: string, passportOcrResult: PassportOcrResult): Promise<VerifiableCredential[]> {
    if (!passportOcrResult) {
      return [];
    }

    const ekycBirthDate = CommonUtils.formatDate3(passportOcrResult.DateOfBirth);
    const reverseBirthDate = CommonUtils.formatDate(ekycBirthDate);
    const ekycExpirationDate = CommonUtils.formatDate3(passportOcrResult.DateOfExpiration);


    try {
      const ekycOcrInfo: EkycPassportOCRIdInfo = {
        surname: passportOcrResult.Surname,
        givenname: passportOcrResult.GivenName,
        sex: passportOcrResult.Sex,
        birthDate: reverseBirthDate,
        passportNo: passportOcrResult.ID,
        nationality: passportOcrResult.Nationality,
        expiryDate: ekycExpirationDate,
        countryCode: passportOcrResult.Nationality
      }

      let generatedCredentials: VerifiableCredential[] = [];
      let ekycPassportGenerator = new EkycPassportGenerator();
      await ekycPassportGenerator.generateAll(did, ekycOcrInfo, generatedCredentials);
      return generatedCredentials;
    }
    catch (e) {
      console.warn("fetchNewUserCredentials(): Error:", e);
      return [];
    }
  }

  public async generateNewUserIDCardCredentials(did: string, idCardOCRResult: IDCardOCRResult): Promise<VerifiableCredential[]> {
    if (!idCardOCRResult) {
      return [];
    }

    const ekycBirthDate = CommonUtils.formatDate2(idCardOCRResult.Birth);
    try {
      const ekycOcrInfo: EkycIDCardOCRInfo = {
        address: idCardOCRResult.Address,
        ethnicity: idCardOCRResult.Nation,
        province: '',
        city: '',
        sex: idCardOCRResult.Sex,
        name: idCardOCRResult.Name,
        idNumber: idCardOCRResult.IdNum,
        birthDate: ekycBirthDate
      }

      let generatedCredentials: VerifiableCredential[] = [];
      let ekycIDCardGenerator = new EkycIDCardGenerator();
      await ekycIDCardGenerator.generateAll(did, ekycOcrInfo, generatedCredentials);
      return generatedCredentials;
    }
    catch (e) {
      console.warn("fetchNewUserCredentials(): Error:", e);
      return [];
    }
  }

  public async createPassportNumberHashCredential(targetDID: string, credentialType: FullCredentialType, subject: JSONObject, iconUrl: string, title: string, description: string): Promise<VerifiableCredential> {
    const types = [
      "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
      "https://ns.elastos.org/credentials/profile/passportnumberhash/v1#PassportNumberHashCredential"
    ]

    return this.createBaseCredential(targetDID, credentialType, subject, iconUrl, title, description, types);
  }

  public async createPassportNumberCredential(targetDID: string, credentialType: FullCredentialType, subject: JSONObject, iconUrl: string, title: string, description: string): Promise<VerifiableCredential> {
    const types = [
      "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
      "https://ns.elastos.org/credentials/v1#SensitiveCredential",
      "https://ns.elastos.org/credentials/profile/passportnumber/v1#PassportNumberCredential"
    ]

    return this.createBaseCredential(targetDID, credentialType, subject, iconUrl, title, description, types);
  }


  public async createCredential(targetDID: string, credentialType: FullCredentialType, subject: JSONObject, iconUrl: string, title: string, description: string): Promise<VerifiableCredential> {
    const types = [
      credentialType.context + "#" + credentialType.shortType,
      "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
      "https://ns.elastos.org/credentials/v1#SensitiveCredential"
    ]

    return this.createBaseCredential(targetDID, credentialType, subject, iconUrl, title, description, types);
  }

  public async createBaseCredential(targetDID: string, credentialType: FullCredentialType, subject: JSONObject, iconUrl: string, title: string, description: string, types: string[]): Promise<VerifiableCredential> {
    let issuer = new Issuer(didService.getIssuerDID());

    let targetDIDObj = DID.from(targetDID); // User that receives the credential

    let randomCredentialIdNumber = Math.floor((Math.random() * 10000000));
    let credentialId = `${credentialType.shortType}${randomCredentialIdNumber}`;

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
      .types(...types)
      .properties(fullSubject)
      .expirationDate(moment().add(1, "years").toDate()) // 1 year validity
      .seal(didService.getStorePass());

    return credential;
  }

  public static blobToDataURL(blob: Blob): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let file = new FileReader();
        file.onload = (e) => {
          resolve(e.target.result.toString());
        }
        file.readAsDataURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  public dataURLtoBlob(dataurl: string): Blob {
    let arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  parseIDCardOCRResult(result: any): IDCardOCRResult {
    const idCardOCROriginResult = result as IDCardOCROriginResult;
    const advancedInfo = JSON.parse(idCardOCROriginResult.AdvancedInfo);
    const idCardResult: IDCardOCRResult = {
      Name: idCardOCROriginResult.Name,
      Sex: idCardOCROriginResult.Sex,
      Nation: idCardOCROriginResult.Nation,
      Birth: idCardOCROriginResult.Birth,
      Address: idCardOCROriginResult.Address,
      IdNum: idCardOCROriginResult.IdNum,
      Authority: idCardOCROriginResult.Authority,
      ValidDate: idCardOCROriginResult.ValidDate,
      AdvancedInfo: advancedInfo,
      RequestId: idCardOCROriginResult.RequestId
    }

    return idCardResult;
  }

  parseIDCardOCROriginResult(result: any): IDCardOCROriginResult {
    const idCardOCROriginResult = result as IDCardOCROriginResult;
    return idCardOCROriginResult;
  }

  parsePassportOCRResult(result: any): PassportOcrResult {
    const passportOcrResult = result as PassportOcrResult;
    return passportOcrResult;
  }

  /**
   * Check Passport ocr result
   * @returns true: OCR passed,  false: OCR not passed
   */
  checkPassportOCRResult(passportOcrResult: PassportOcrResult): boolean {
    try {
      if (!passportOcrResult || !passportOcrResult.AdvancedInfo) {
        return false;
      }

      const advancedInfoObj = JSON.parse(passportOcrResult.AdvancedInfo);
      if (!advancedInfoObj || !advancedInfoObj.Name ||
        !advancedInfoObj.Name || !advancedInfoObj.ID ||
        !advancedInfoObj.Nationality || !advancedInfoObj.DateOfBirth ||
        !advancedInfoObj.Sex || !advancedInfoObj.DateOfExpiration ||
        !advancedInfoObj.Surname || !advancedInfoObj.GivenName) {
        return false;
      }

      const nameConfidence = advancedInfoObj.Name.Confidence;
      const idConfidence = advancedInfoObj.ID.Confidence;
      const nationalityConfidence = advancedInfoObj.Nationality.Confidence;
      const dateOfBirthConfidence = advancedInfoObj.DateOfBirth.Confidence;
      const sexConfidence = advancedInfoObj.Sex.Confidence;
      const dateOFExpirationConfidence = advancedInfoObj.DateOfExpiration.Confidence;
      const surnameConfidence = advancedInfoObj.Surname.Confidence;
      const givenNameConfidence = advancedInfoObj.GivenName.Confidence;

      const issuingCountry = advancedInfoObj.IssuingCountry.Confidence;
      const codeSet = advancedInfoObj.CodeSet.Confidence;
      const codeCrc = advancedInfoObj.CodeCrc.Confidence;

      if (!nameConfidence || !idConfidence ||
        !nationalityConfidence || !dateOfBirthConfidence ||
        !sexConfidence || !dateOFExpirationConfidence ||
        !surnameConfidence || !givenNameConfidence ||
        !issuingCountry || !codeSet || !codeCrc) {
        return false;
      }

      if (nameConfidence < leastScore || idConfidence < leastScore ||
        nationalityConfidence < leastScore || dateOfBirthConfidence < leastScore ||
        sexConfidence < leastScore || dateOFExpirationConfidence < leastScore ||
        surnameConfidence < leastScore || givenNameConfidence < leastScore ||
        issuingCountry < leastScore || codeSet < leastScore || codeCrc < leastScore) {
        return false
      }

      return true;
    } catch (error) {
      console.log('error', error);
      return false
    }
  }

  /**
   * Check ID Card ocr result
   * @returns true: OCR passed,  false: OCR not passed
   */
  checkIDCardOCRResult(passportOcrResult: IDCardOCROriginResult): boolean {
    return true;
  }

  /**
   * Check Image quality score
   * @returns true: passed,  false: not passed
   */
  checkIDCardImageQuality(qualityScore: number): boolean {
    if (!qualityScore) {
      return false
    }
    if (qualityScore > 50) {
      return true;
    }
    return false;
  }
}

export const tencentEkycService = new TencentEkycService();