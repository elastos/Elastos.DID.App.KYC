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

            break;
          case DocType.Passport:
            const result = await this.processPassportOCR(imageBase64);
            console.log('result = ', result);

            const passportOcrResult: PassportOcrResult = this.parsePassportOCRResult(result);
            ocrResult = passportOcrResult;
            retImageBase64 = passportOcrResult.Image;
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

      // 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
      // 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。密钥可前往官网控制台 https://console.tencentcloud.com/capi 进行获取
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // 实例化一个http选项，可选的，没有特殊需求可以跳过
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "ocr.tencentcloudapi.com";
      // 实例化一个client选项，可选的，没有特殊需求可以跳过
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;

      // 实例化要请求产品的client对象,clientProfile是可选的
      let client = new OcrClient(cred, "ap-singapore", clientProfile);

      // 实例化一个请求对象,每个接口都会对应一个request对象
      let req = new models.MLIDPassportOCRRequest();

      let params = {
        "ImageBase64": imageBase64,
        "RetImage": true
      };

      console.log('params', params);
      req.from_json_string(JSON.stringify(params))

      // 返回的resp是一个MLIDPassportOCRResponse的实例，与请求对象对应
      client.MLIDPassportOCR(req, function (err: any, response: any) {
        if (err) {
          console.log(err);
          reject(err)
          return;
        }
        // 输出json格式的字符串回包
        console.log(response.to_json_string());
        resolve(response);
      });
    });
  }
  processIDCardOCR(imageBase64: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
      // 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。密钥可前往官网控制台 https://console.tencentcloud.com/capi 进行获取
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // 实例化一个http选项，可选的，没有特殊需求可以跳过
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "ocr.tencentcloudapi.com";
      // 实例化一个client选项，可选的，没有特殊需求可以跳过
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;

      // 实例化要请求产品的client对象,clientProfile是可选的
      let client = new OcrClient(cred, "ap-beijing", clientProfile);

      // 实例化一个请求对象,每个接口都会对应一个request对象
      let req = new models.IDCardOCRRequest();

      // {
      //   "ImageBase64": null,
      //   "ImageUrl": null,
      //   "CardSide": null,
      //   "Config": null,
      //   "EnableRecognitionRectify": null
      // }
      const config = { "CropPortrait": true }

      let params = { ImageBase64: imageBase64, Config: JSON.stringify(config) };

      req.from_json_string(JSON.stringify(params))

      // 返回的resp是一个IDCardOCRResponse的实例，与请求对象对应
      client.IDCardOCR(req, (err: any, response: any) => {
        console.log("err,", err);
        console.log("response,", response);
        if (err) {
          reject(err);
          console.log(err);
          return;
        }


        // console.log("response,", response.substring(0, 100));
        // 输出json格式的字符串回包
        console.log(response.to_json_string());
        resolve(response);
      });
    });
  }

  async processLiveness(imageBase64: string, redirectUrl: string): Promise<any> {
    // create upload url
    // upload image to url
    // calculate image md5
    // apply web verification token
    // redirect to VerificationUrl
    return new Promise(async (resolve, reject) => {
      try {
        // const uploadUrlResult: UploadUrlResult = await this.createUploadUrl();
        // console.log('uploadUrlResult', uploadUrlResult);

        // const uploadUrl = uploadUrlResult.UploadUrl;
        // await this.uploadImage(uploadUrl, imageBase64);

        // let imageMd5 = SparkMD5.hash(imageBase64);
        // console.log('imageMd5', imageMd5);

        // const compareImageUrl = uploadUrlResult.ResourceUrl;
        // const verificationUrlresult = await this.applyWebVerificationToken(redirectUrl, compareImageUrl, imageMd5) as VerificationUrlresult;


        const verificationUrlresult = await this.applyWebVerificationBizToken(redirectUrl, imageBase64, 'extratest:testvalue');
        console.log('result = ', verificationUrlresult);

        // console.log("verificationUrlresult = ", verificationUrlresult);
        resolve(verificationUrlresult);
      } catch (error) {
        reject(error);
      }
    });
  }

  createUploadUrl(): Promise<UploadUrlResult> {
    return new Promise((resolve, reject) => {
      const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

      const FaceidClient = tencentcloud.faceid.v20180301.Client;
      const models = tencentcloud.faceid.v20180301.Models;

      const Credential = tencentcloud.common.Credential;
      const ClientProfile = tencentcloud.common.ClientProfile;
      const HttpProfile = tencentcloud.common.HttpProfile;

      // 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
      // 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。密钥可前往官网控制台 https://console.tencentcloud.com/capi 进行获取
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // 实例化一个http选项，可选的，没有特殊需求可以跳过
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "faceid.tencentcloudapi.com";
      // 实例化一个client选项，可选的，没有特殊需求可以跳过
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;

      // 实例化要请求产品的client对象,clientProfile是可选的
      let client = new FaceidClient(cred, "ap-singapore", clientProfile);

      // 实例化一个请求对象,每个接口都会对应一个request对象
      let req = new models.CreateUploadUrlRequest();

      let params = {
        "TargetAction": "ApplyWebVerificationToken"
      };

      req.from_json_string(JSON.stringify(params))

      // 返回的resp是一个CreateUploadUrlResponse的实例，与请求对象对应
      client.CreateUploadUrl(req, function (err: any, response: any) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }

        // 输出json格式的字符串回包
        console.log(response.to_json_string());

        const resultJsonString = response.to_json_string();

        const resultobj: UploadUrlResult = JSON.parse(resultJsonString);
        console.log('resultobj ResourceUrl', resultobj.ResourceUrl);
        console.log('resultobj UploadUrl', resultobj.UploadUrl);
        console.log('resultobj ExpiredTimestamp', resultobj.ExpiredTimestamp);
        console.log('resultobj RequestId', resultobj.RequestId);

        resolve(resultobj);
      });
    });

  }

  async uploadImage(uploadImageUrl: string, imageBase64: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const url = new URL(uploadImageUrl);
        const hostName = url.hostname;

        const pathUrl = uploadImageUrl.replace(url.origin, '');
        console.log('pathUrl= ', pathUrl);

        const options: RequestOptions = {
          host: hostName,
          method: 'PUT',
          path: pathUrl,
          headers: {
            'Content-Type': 'application/json'
          },
        };

        const req = request(options, response => {
          let data: any = '';
          response.on('data', (chunk) => {
            data += chunk
          });

          response.on("end", () => {
            if (response.statusCode == 200) {
              resolve('SUCCESS');
            } else {
              reject('FAILED');
            }
            console.log('response.statusCode', response.statusCode);
            console.log('response', data);
          });

          response.on("error", (error) => {
            console.log('upload image error', error);
            reject('FAILD');
          });
        });
        // const body = Buffer.from(imageBase64)
        req.write(imageBase64);
        req.end();
      } catch (error) {
        console.error(error);
        reject('FAILED');
      }
    });
  }

  applyWebVerificationToken(redirectUrl: string, compareImageUrl: string, imageMd5: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

      const FaceidClient = tencentcloud.faceid.v20180301.Client;
      const models = tencentcloud.faceid.v20180301.Models;

      const Credential = tencentcloud.common.Credential;
      const ClientProfile = tencentcloud.common.ClientProfile;
      const HttpProfile = tencentcloud.common.HttpProfile;

      // 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
      // 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。密钥可前往官网控制台 https://console.tencentcloud.com/capi 进行获取
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // 实例化一个http选项，可选的，没有特殊需求可以跳过
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "faceid.tencentcloudapi.com";
      // 实例化一个client选项，可选的，没有特殊需求可以跳过
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;

      // 实例化要请求产品的client对象,clientProfile是可选的
      let client = new FaceidClient(cred, "ap-singapore", clientProfile);

      // 实例化一个请求对象,每个接口都会对应一个request对象
      let req = new models.ApplyWebVerificationTokenRequest();

      let params = {
        "RedirectUrl": redirectUrl,
        "CompareImageUrl": compareImageUrl,
        "CompareImageMd5": imageMd5
      };
      req.from_json_string(JSON.stringify(params))
      console.log('params = ', JSON.stringify(params));
      console.log('req = ', req);
      // 返回的resp是一个ApplyWebVerificationTokenResponse的实例，与请求对象对应
      client.ApplyWebVerificationToken(req, function (err: any, response: any) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        // 输出json格式的字符串回包
        console.log('ApplyWebVerificationToken = ', response.to_json_string());
        resolve(response);
        return response;
      });
    });
  }

  applyWebVerificationBizToken(redirectUrl: string, CompareImageBase64: string, extraInfo: string) {
    return new Promise(async (resolve, reject) => {
      const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

      const FaceidClient = tencentcloud.faceid.v20180301.Client;
      const models = tencentcloud.faceid.v20180301.Models;

      const Credential = tencentcloud.common.Credential;
      const ClientProfile = tencentcloud.common.ClientProfile;
      const HttpProfile = tencentcloud.common.HttpProfile;

      // 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
      // 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。密钥可前往官网控制台 https://console.tencentcloud.com/capi 进行获取
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // 实例化一个http选项，可选的，没有特殊需求可以跳过
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "faceid.tencentcloudapi.com";
      // 实例化一个client选项，可选的，没有特殊需求可以跳过
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;

      // 实例化要请求产品的client对象,clientProfile是可选的
      let client = new FaceidClient(cred, "ap-singapore", clientProfile);

      // 实例化一个请求对象,每个接口都会对应一个request对象
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

      // 返回的resp是一个ApplyWebVerificationBizTokenIntlResponse的实例，与请求对象对应
      client.ApplyWebVerificationBizTokenIntl(req, function (err: any, response: any) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        // 输出json格式的字符串回包
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

      // 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
      // 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。密钥可前往官网控制台 https://console.tencentcloud.com/capi 进行获取
      let cred = new Credential(SecretConfig.TencentEkyc.SecretId, SecretConfig.TencentEkyc.SecretKey);
      // 实例化一个http选项，可选的，没有特殊需求可以跳过
      let httpProfile = new HttpProfile();
      httpProfile.endpoint = "faceid.tencentcloudapi.com";
      // 实例化一个client选项，可选的，没有特殊需求可以跳过
      let clientProfile = new ClientProfile();
      clientProfile.httpProfile = httpProfile;

      // 实例化要请求产品的client对象,clientProfile是可选的
      let client = new FaceidClient(cred, "ap-singapore", clientProfile);

      // 实例化一个请求对象,每个接口都会对应一个request对象
      let req = new models.GetWebVerificationResultIntlRequest();

      let params = {
        "BizToken": bizToken
      };
      req.from_json_string(JSON.stringify(params))

      // 返回的resp是一个GetWebVerificationResultIntlResponse的实例，与请求对象对应
      client.GetWebVerificationResultIntl(req, function (err: any, response: any) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        // 输出json格式的字符串回包
        console.log(response.to_json_string());
        resolve(response.to_json_string());
      });
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
}

export const tencentEkycService = new TencentEkycService();