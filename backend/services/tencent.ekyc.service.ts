import { DID, Issuer, JSONObject, VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { SecretConfig } from "../config/env-secret";
import { createRequire } from "module";

import { FullCredentialType } from "../model/fullcredentialtype";
import { didService } from "./did.service";
import moment from "moment";
import { EkycIDCardResult, EkycPassportResult, EkycRawResult, EkycResponse } from "../model/ekyc/ekycresult";
import { EkycPassportGenerator } from "./generators/ekyc/passport.generator";
import { EkycIDCardGenerator } from "./generators/ekyc/idcard.generator";

const require = createRequire(import.meta.url);
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

const OcrClient = tencentcloud.ocr.v20181119.Client;
const models = tencentcloud.ocr.v20181119.Models;

const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;


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
      let params = { ImageBase64: imageBase64 };

      req.from_json_string(JSON.stringify(params))

      // 返回的resp是一个IDCardOCRResponse的实例，与请求对象对应
      client.IDCardOCR(req, (err: any, response: any) => {
        if (err) {
          reject(err);
          console.log(err);
          return;
        }

        // console.log("response,", response);
        console.log("response,", response.substring(0, 100));
        // 输出json格式的字符串回包
        // console.log(response.to_json_string());
        resolve(response);
      });
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
}

export const tencentEkycService = new TencentEkycService();