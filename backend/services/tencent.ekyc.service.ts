import { DID, Issuer, JSONObject, VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { SecretConfig } from "../config/env-secret";
import { createRequire } from "module";

import { FullCredentialType } from "../model/fullcredentialtype";
import { didService } from "./did.service";
import moment from "moment";
import { EkycIDCardResult, EkycPassportResult, EkycRawResult, EkycResponse } from "../model/ekyc/ekycresult";
import { EkycPassportGenerator } from "./generators/ekyc/passport.generator";
import { EkycIDCardGenerator } from "./generators/ekyc/idcard.generator";

import SparkMD5 from 'spark-md5';

import { UploadUrlResult } from "../model/ekyc/tencent/uploadurlresult";

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

  processEkyc(imageBase64: string) {
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
      const config = { "CropIdCard": true, "CropPortrait": true }

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

  processOCR() {

  }

  async processLiveness(compareImageBase64: string) {
    // create upload url
    // upload image to url
    // calculate image md5
    // apply web verification token
    // redirect to VerificationUrl

    const uploadUrlResult: UploadUrlResult = await this.createUploadUrl();
    console.log('uploadUrlResult', uploadUrlResult);

    let imageMd5 = SparkMD5.hash(compareImageBase64);
    console.log('imageMd5', imageMd5);
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
      let client = new FaceidClient(cred, "ap-hongkong", clientProfile);

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

  async uploadImage(uploadUrl: string, base64Image: string) {
    this.uploadImageTest(uploadUrl, base64Image);
  }

  applyWebVerificationToken() {
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

    const redirectUrl = 'http://localhost/test';
    const compareImageUrl = 'https://faceid-resource-hk-1258344699.cos.ap-hongkong.myqcloud.com/faceid%2FApplyWebVerificationToken%2F1317986905%2F8e680eef-01eb-48d8-943b-c260be872629?q-sign-algorithm=sha1&q-ak=AKIDe6JgmcBVYP9tUxA8pHTO3TdW7SYNvCE2&q-sign-time=1694154436%3B1694161636&q-key-time=1694154436%3B1694161636&q-header-list=host&q-url-param-list=&q-signature=264c04f7e912f3528cf07547c4d3d282a34c11b9';

    const imageMD5 = '21c505a077d04b8c0f1cf0787c20dfda';
    let params = {
      "RedirectUrl": redirectUrl,
      "CompareImageUrl": compareImageUrl,
      "CompareImageMd5": imageMD5
    };
    req.from_json_string(JSON.stringify(params))

    // 返回的resp是一个ApplyWebVerificationTokenResponse的实例，与请求对象对应
    client.ApplyWebVerificationToken(req, function (err: any, response: any) {
      if (err) {
        console.log(err);
        return;
      }
      // 输出json格式的字符串回包
      console.log(response.to_json_string());
    });
  }

  public async generateNewUserPassportCredentials(did: string, ekycResult: EkycPassportResult): Promise<VerifiableCredential[]> {
    if (!ekycResult || !ekycResult.extIdInfo || !ekycResult.extIdInfo.ocrIdInfo) {
      return [];
    }

    try {
      const ekycOcrInfo = ekycResult.extIdInfo.ocrIdInfo;

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

  public async generateNewUserIDCardCredentials(did: string, ekycResult: EkycIDCardResult): Promise<VerifiableCredential[]> {
    if (!ekycResult || !ekycResult.extIdInfo || !ekycResult.extIdInfo.ocrIdInfo) {
      return [];
    }

    try {
      const ekycOcrInfo = ekycResult.extIdInfo.ocrIdInfo;

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

  async uploadImageTest(uploadImageUrl: string, imageBase64: string) {
    try {
      let response = await fetch(uploadImageUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: this.dataURLtoBlob(imageBase64)
      });

      if (!response.ok) {
        console.error(response);
        return "FAILED";
      }

      console.log(response.json);
      return "SUCCESS";
    } catch (error) {
      console.error(error);
      return "FAILED";
    }
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
}

export const tencentEkycService = new TencentEkycService();