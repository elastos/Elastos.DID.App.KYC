import { DID, Issuer, JSONObject, VerifiableCredential } from "@elastosfoundation/did-js-sdk";
import { SecretConfig } from "../config/env-secret";
import { createRequire } from "module";
import { DocType, EKYCProductCode } from "../model/ekyc/ekycproductcode";
import { ErrorType } from "../model/dataorerror";
import { FullCredentialType } from "../model/fullcredentialtype";
import { didService } from "./did.service";
import moment from "moment";
import { EKYCResult } from "../model/ekyc/ekycresult";
import { EkycPassportGenerator } from "./generators/ekyc/passport.generator";

const require = createRequire(import.meta.url);

const { Config } = require("@alicloud/openapi-client");
const CloudAuth = require("@alicloud/cloudauth-intl20220809");
const Client = CloudAuth.default;

class EkycService {
  public async setup() {
  }

  public async processIdOcr(metaInfo: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const productCode = EKYCProductCode.ID_OCR;
      const returnUrl = SecretConfig.EKYC.returnUrl;
      const merchantBizId = SecretConfig.EKYC.merchantBizId;
      const merchantUserId = SecretConfig.EKYC.merchantUserId;
      const docType = DocType.Passport;

      try {
        const response = await this.initialIDOCRAndEKYC(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId, docType);

        if (!response) {
          reject("response is null");
          return;
        }
        resolve({ requestId: response.body.requestId, transactionId: response.body.result.transactionId, transactionUrl: response.body.result.transactionUrl });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async processEkyc(metaInfo: string, merchantUserId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const productCode = EKYCProductCode.EKYC;
      const returnUrl = SecretConfig.EKYC.returnUrl;
      const merchantBizId = SecretConfig.EKYC.merchantBizId;
      const docType = DocType.Passport;

      try {
        const response = await this.initialIDOCRAndEKYC(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId, docType);

        if (!response) {
          reject("response is null");
          return;
        }
        resolve({ requestId: response.body.requestId, transactionId: response.body.result.transactionId, transactionUrl: response.body.result.transactionUrl });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async processFaceVerify(metaInfo: string, facePictureBase64: string, facePictureUrl: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const productCode = EKYCProductCode.FACE_VERIFY;
      const returnUrl = SecretConfig.EKYC.returnUrl;
      const merchantBizId = SecretConfig.EKYC.merchantBizId;
      const merchantUserId = SecretConfig.EKYC.merchantUserId;

      try {
        const response = await this.initialFaceVerify(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId,
          facePictureBase64, facePictureUrl);
        if (!response) {
          reject("response is null");
          return;
        }
        resolve({ requestId: response.body.requestId, transactionId: response.body.result.transactionId, transactionUrl: response.body.result.transactionUrl });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async processFaceLiveness(metaInfo: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const productCode = EKYCProductCode.FACE_LIVENESS;
      const returnUrl = SecretConfig.EKYC.returnUrl;
      const merchantBizId = SecretConfig.EKYC.merchantBizId;
      const merchantUserId = SecretConfig.EKYC.merchantUserId;

      try {
        const response = await this.initialFaceLiveness(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId);
        if (!response) {
          reject("response is null");
          return;
        }
        resolve({ requestId: response.body.requestId, transactionId: response.body.result.transactionId, transactionUrl: response.body.result.transactionUrl });
      } catch (error) {
        reject(error);
      }
    });
  }


  /**
   * Initial ID_OCR and EKYC 
   * @param productCode * @param productCode {string} Product code of identity proofing. Set to eKYC in this mode.
   *              For example, the product code of the ID card OCR service is ID_OCR.
   * @param metaInfo {string} The meta information about the SDK and the user's device.
   *            When App SDK mode is used, its value comes from the Alibaba Cloud SDK in the JSON string format, for example:
   *            "{\"apdidToken\":\"69b74bfe-bf7f-4d3b-ac59-907ee09e7955\",\"appName\":\"com.alibabacloud.atomic.client\",
   *              \"appVersion\":\"1.0.9\",\"bioMetaInfo\":\"3.46.0:2916352,0\",\"deviceModel\":\"MI 6\",\"deviceType\":\"android\",\"osVersion\":\"9\",\"zimVer\":\"1.0.0\"}"
   * @param returnUrl {string} The destination address of your business page bounce.
   * @param merchantBizId {string} A unique business ID for tracing purpose. For example，the sequence ID from the merchant's business-related database.
   * @param merchantUserId {string} Merchant user ID, or other identifiers that can be used to identify a specific user, for example, 
   *             mobile phone number, email address and so on. It is strongly recommended to pre-desensitize the value of the userId field, for example, by hashing the value.
   * @returns response
   */
  private initialIDOCRAndEKYC(productCode: string, metaInfo: string, returnUrl: string, merchantBizId: string,
    merchantUserId: string, docType: string) {
    return new Promise<any>(async (resolve, reject) => {
      const config = new Config({
        accessKeyId: SecretConfig.EKYC.accessKeyId,
        accessKeySecret: SecretConfig.EKYC.accessKeySecret,
        endpoint: SecretConfig.EKYC.endpoint
      });

      const client = new Client(config);

      // Build request
      let request = null
      if (productCode == EKYCProductCode.FACE_VERIFY) {
        request = new CloudAuth.InitializeRequest({
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId,
        });
      } else {
        request = new CloudAuth.InitializeRequest({
          docType: docType,
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          returnUrl: returnUrl,
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId,
          idSpoof: false
        });
      }

      // Invoke API
      const response = await client.initialize(request);
      if (!response) {
        reject(response);
        return;
      }

      resolve(response);
    });
  }

  /**
   * @param productCode
   * @param merchantBizId
   * @param metaInfo
   * @param merchantUserId
   * @param returnUrl
   */
  private initialFaceLiveness(productCode: string, metaInfo: string, returnUrl: string, merchantBizId: string,
    merchantUserId: string) {
    return new Promise<any>(async (resolve, reject) => {

      const config = new Config({
        accessKeyId: SecretConfig.EKYC.accessKeyId,
        accessKeySecret: SecretConfig.EKYC.accessKeySecret,
        endpoint: SecretConfig.EKYC.endpoint
      });

      const client = new Client(config);

      let request = null
      if (productCode == EKYCProductCode.FACE_VERIFY) {
        request = new CloudAuth.InitializeRequest({
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId
        });
      } else {
        request = new CloudAuth.InitializeRequest({
          docType: DocType.Passport,
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          returnUrl: returnUrl,
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId,
        });
      }

      // Invoke API
      const response = await client.initialize(request);

      if (!response) {
        reject(response);
        return;
      }

      resolve(response);
    });
  }

  /**
   * @param productCode {string} Product code of identity proofing. Set to eKYC in this mode.
   *              For example, the product code of the ID card OCR service is ID_OCR.
   * @param metaInfo {string} The meta information about the SDK and the user's device.
   *            When App SDK mode is used, its value comes from the Alibaba Cloud SDK in the JSON string format, for example:
   *            "{\"apdidToken\":\"69b74bfe-bf7f-4d3b-ac59-907ee09e7955\",\"appName\":\"com.alibabacloud.atomic.client\",
   *              \"appVersion\":\"1.0.9\",\"bioMetaInfo\":\"3.46.0:2916352,0\",\"deviceModel\":\"MI 6\",\"deviceType\":\"android\",\"osVersion\":\"9\",\"zimVer\":\"1.0.0\"}"
   * @param returnUrl {string} The destination address of your business page bounce.
   * @param merchantBizId {string} A unique business ID for tracing purpose. For example，the sequence ID from the merchant's business-related database.
   * @param merchantUserId {string} Merchant user ID, or other identifiers that can be used to identify a specific user, for example, 
   *             mobile phone number, email address and so on. It is strongly recommended to pre-desensitize the value of the userId field, for example, by hashing the value.
   * @param facePictureBase64 {string} The base64-encoded image of the user's face.
   * @param facePictureUrl {string} The URL of the user's face image.
   */
  private initialFaceVerify(productCode: string, metaInfo: string, returnUrl: string, merchantBizId: string,
    merchantUserId: string, facePictureBase64: string, facePictureUrl: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {

      const config = new Config({
        accessKeyId: SecretConfig.EKYC.accessKeyId,
        accessKeySecret: SecretConfig.EKYC.accessKeySecret,
        endpoint: SecretConfig.EKYC.endpoint
      });

      const client = new Client(config);

      let request = null
      if (productCode == EKYCProductCode.FACE_VERIFY) {
        request = new CloudAuth.InitializeRequest({
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          facePictureBase64: facePictureBase64,
          facePictureUrl: facePictureUrl,
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId
        });
      } else {
        request = new CloudAuth.InitializeRequest({
          docType: DocType.Passport,
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          returnUrl: returnUrl,
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId,
        });
      }

      // Invoke API
      const response = await client.initialize(request);

      if (!response) {
        reject(response);
        return;
      }
      resolve(response);
    });

  }

  //
  /**
   * Initial ID_OCR and EKYC 
   * @param productCode * @param productCode {string} Product code of identity proofing. Set to eKYC in this mode.
   *              For example, the product code of the ID card OCR service is ID_OCR.
   * @param metaInfo {string} The meta information about the SDK and the user's device.
   *            When App SDK mode is used, its value comes from the Alibaba Cloud SDK in the JSON string format, for example:
   *            "{\"apdidToken\":\"69b74bfe-bf7f-4d3b-ac59-907ee09e7955\",\"appName\":\"com.alibabacloud.atomic.client\",
   *              \"appVersion\":\"1.0.9\",\"bioMetaInfo\":\"3.46.0:2916352,0\",\"deviceModel\":\"MI 6\",\"deviceType\":\"android\",\"osVersion\":\"9\",\"zimVer\":\"1.0.0\"}"
   * @param returnUrl {string} The destination address of your business page bounce.
   * @param merchantBizId {string} A unique business ID for tracing purpose. For example，the sequence ID from the merchant's business-related database.
   * @param merchantUserId {string} Merchant user ID, or other identifiers that can be used to identify a specific user, for example, 
   *             mobile phone number, email address and so on. It is strongly recommended to pre-desensitize the value of the userId field, for example, by hashing the value.
   * @returns response
   */
  public initial(productCode: string, metaInfo: string, returnUrl: string,
    merchantBizId: string, merchantUserId: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const config = new Config({
        accessKeyId: SecretConfig.EKYC.accessKeyId,
        accessKeySecret: SecretConfig.EKYC.accessKeySecret,
        endpoint: SecretConfig.EKYC.endpoint
      });

      const client = new Client(config);

      // Build request
      let request = null
      if (productCode == EKYCProductCode.FACE_VERIFY) {
        request = new CloudAuth.InitializeRequest({
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId
        });
      } else {
        request = new CloudAuth.InitializeRequest({
          docType: DocType.Passport,
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          returnUrl: returnUrl,
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId,
        });
      }

      // Invoke API
      const response = await client.initialize(request);

      if (!response) {
        reject(response);
        return;
      }

      resolve(response);
    });
  }

  public async checkResult(transactionId: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const config = new Config({
          accessKeyId: SecretConfig.EKYC.accessKeyId,
          accessKeySecret: SecretConfig.EKYC.accessKeySecret,
          endpoint: SecretConfig.EKYC.endpoint
        });
        const client = new Client(config);

        // Build request
        const request = new CloudAuth.CheckResultRequest({
          merchantBizId: SecretConfig.EKYC.merchantBizId,
          transactionId: transactionId
        });

        // Invoke API
        const response = await client.checkResult(request);

        if (!response) {
          reject(response);
          return;
        }
        resolve(response);
      } catch (error) {
        console.log('Check result error: ', error);
        reject(error);
      }
    });
  }

  public async checkID_OCRRResult(transactionId: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const response = await this.checkResult(transactionId);
        /**
         * @param requestId {string} The unique ID of the request, which can be used to locate issues..
         * @param code {string} Return code. For the full list of codes,
         * @param message {string} Response detailed message.
         * @param result.passed {string} Certification result. Possible values and their meanings are as below:
         *        Y: pass.
         *        N: fail.
         * @param result.subCode {string} Authentication result sub code
         * @param result.extIdInfo {string} Detailed information about face liveness process.Optional. JSON string of ExtFaceInfo.  
         */
        if (!response) {
          reject(response);
          return;
        }
        resolve(response);
      } catch (error) {
        return { errorType: ErrorType.SERVER_ERROR, error: "server error" };
      }
    });
  }

  public async checkEKYCResult(transactionId: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const response = await this.checkResult(transactionId);
        /**
         * @param requestId {string} The unique ID of the request, which can be used to locate issues.for example: 130A2C10-B9EE-4D84-88E3-5384FF039795
         * @param code {string} Return code. For the full list of codes. for example: Success
         * @param message {string} Response detailed message. for example: success
         * @param result.passed {string} Certification result. Possible values and their meanings are as below:
         *        Y: pass.
         *        N: fail.
         * @param result.subCode {string} Authentication result sub code. for example: 200
         * @param result.extIdInfo {string} Detailed information about face liveness process.Optional. JSON string of ExtFaceInfo.  for example:
         *      {
                  "ocrIdInfo": {
                    "expiryDate": "",
                    "originOfIssue": "公安部出入境管理局",
                    "englishName": "LI SI",
                    "sex": "男",
                    "name": "李四",
                    "idNumber": "H11111112",
                    "issueDate": "2013-01-02",
                    "birthDate": "1990-02-21"
                  },
                  "ocrIdPassed": "N",
                  "spoofInfo": {
                    "spoofResult": "Y",
                    "spoofType": [
                      "SCREEN_REMARK"
                    ]
                  }
                }
         */
        if (!response) {
          reject(response);
          return;
        }
        resolve(response);
      } catch (error) {
        return { errorType: ErrorType.SERVER_ERROR, error: "server error" };
      }
    });
  }

  public async checkFaceVerifyResult(transactionId: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const response = await this.checkResult(transactionId);
        /**
         * @param requestId {string} The unique ID of the request, which can be used to locate issues.
         * @param code {string} Return code. For the full list of codes,
         * @param message {string} Response detailed message.
         * @param result.passed {string} Certification result. Possible values and their meanings are as below:
         *        Y: pass.
         *        N: fail.
         * @param result.subCode {string} Authentication result sub code
         * @param result.extIdInfo {string} Detailed information about face liveness process.Optional. JSON string of ExtFaceInfo.  
         */
        if (!response) {
          reject(response);
          return;
        }
        resolve(response);
      } catch (error) {
        return { errorType: ErrorType.SERVER_ERROR, error: "server error" };
      }
    });
  }

  public async faceCompare(sourceFacePictureBase64: string, sourceFacePictureUrl: string,
    targetFacePictureBase64: string, targetFacePictureUrl: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const config = new Config({
        accessKeyId: SecretConfig.EKYC.accessKeyId,
        accessKeySecret: SecretConfig.EKYC.accessKeySecret,
        endpoint: SecretConfig.EKYC.endpoint
      });
      const client = new Client(config);

      // Build request
      const request = new CloudAuth.FaceCompareRequest({
        //set sourceFacePictureBase64 or sourceFacePictureUrl
        sourceFacePictureBase64: sourceFacePictureBase64,
        sourceFacePictureUrl: sourceFacePictureUrl,
        //set targetFacePictureBase64 or targetFacePictureUrl
        targetFacePictureBase64: targetFacePictureBase64,
        targetFacePictureUrl: targetFacePictureUrl,
        merchantBizId: SecretConfig.EKYC.merchantBizId
      });

      // Invoke API
      const response = await client.faceCompare(request);

      if (!response) {
        reject(response);
        return;
      }
      resolve(response);
    });
  }

  public async generateNewUserCredentials(did: string, ekycResult: EKYCResult): Promise<VerifiableCredential[]> {
    if (!ekycResult || !ekycResult.extIdInfo || !ekycResult.extIdInfo.ocrIdInfo) {
      return [];
    }

    try {
      const ekycOcrInfo = ekycResult.extIdInfo.ocrIdInfo;

      let generatedCredentials: VerifiableCredential[] = [];
      let ekycPassportGenerator = new EkycPassportGenerator();
      await ekycPassportGenerator.generateAll(did, ekycResult.extIdInfo.ocrIdInfo, generatedCredentials);
      return generatedCredentials;
    }
    catch (e) {
      console.warn("fetchNewUserCredentials(): Error:", e);
      return [];
    }
  }

  public async createCredential(targetDID: string, credentialType: FullCredentialType, subject: JSONObject, iconUrl: string, title: string, description: string): Promise<VerifiableCredential> {
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
      .types(
        credentialType.context + "#" + credentialType.shortType,
        "https://ns.elastos.org/credentials/displayable/v1#DisplayableCredential",
        "https://ns.elastos.org/credentials/v1#SensitiveCredential"
      )
      .properties(fullSubject)
      .expirationDate(moment().add(1, "years").toDate()) // 1 year validity
      .seal(didService.getStorePass());

    return credential;
  }
}

export const ekycService = new EkycService();