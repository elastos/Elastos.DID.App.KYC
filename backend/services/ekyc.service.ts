import { SecretConfig } from "../config/env-secret";
import { createRequire } from "module";
import { EKYCProductCode } from "../model/ekyc/ekycproductcode";
import { ErrorType } from "../model/dataorerror";
const require = createRequire(import.meta.url);

const { Config } = require("@alicloud/openapi-client");
const CloudAuth = require("@alicloud/cloudauth-intl20220809");
const Client = CloudAuth.default;


class EkycService {
  public async setup() {
  }

  public async processIdOcr(metaInfo: string) {
    const productCode = EKYCProductCode.ID_OCR;
    const returnUrl = SecretConfig.EKYC.returnUrl;
    const merchantBizId = SecretConfig.EKYC.merchantBizId;
    const merchantUserId = SecretConfig.EKYC.merchantUserId;

    const response = await this.initial(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId, "", "");

    // Get result
    console.log("requestId is ", response.body.requestId);
    console.log("transactionId is ", response.body.result.transactionId);
    console.log("transactionUrl is ", response.body.result.transactionUrl);
  }

  public async processEkyc(metaInfo: string) {
    const productCode = EKYCProductCode.EKYC;
    const returnUrl = SecretConfig.EKYC.returnUrl;
    const merchantBizId = SecretConfig.EKYC.merchantBizId;
    const merchantUserId = SecretConfig.EKYC.merchantUserId;

    const response = await this.initial(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId, "", "");

    // Get result
    console.log("requestId is ", response.body.requestId);
    console.log("transactionId is ", response.body.result.transactionId);
    console.log("transactionUrl is ", response.body.result.transactionUrl);
  }

  public async processFaceVerify(metaInfo: string, facePictureBase64: string, facePictureUrl: string) {
    const productCode = EKYCProductCode.FACE_VERIFY;
    const returnUrl = SecretConfig.EKYC.returnUrl;
    const merchantBizId = SecretConfig.EKYC.merchantBizId;
    const merchantUserId = SecretConfig.EKYC.merchantUserId;

    const response = await this.initial(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId,
      facePictureBase64, facePictureUrl);

    // Get result
    console.log("requestId is ", response.body.requestId);
    console.log("transactionId is ", response.body.result.transactionId);
    console.log("transactionUrl is ", response.body.result.transactionUrl);
  }

  public async processFaceLiveness(metaInfo: string) {
    const productCode = EKYCProductCode.FACE_LIVENESS;
    const returnUrl = SecretConfig.EKYC.returnUrl;
    const merchantBizId = SecretConfig.EKYC.merchantBizId;
    const merchantUserId = SecretConfig.EKYC.merchantUserId;

    const response = await this.initial(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId, "", "");

    // Get result
    console.log("requestId is ", response.body.requestId);
    console.log("transactionId is ", response.body.result.transactionId);
    console.log("transactionUrl is ", response.body.result.transactionUrl);
  }

  public initial(productCode: string, metaInfo: string, returnUrl: string, merchantBizId: string,
    merchantUserId: string, facePictureBase64: string, facePictureUrl: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {

      const config = new Config({
        accessKeyId: SecretConfig.EKYC.accessKeyId,
        accessKeySecret: SecretConfig.EKYC.accessKeySecret,
        endpoint: SecretConfig.EKYC.endpoint
      });
      const client = new Client(config);

      // Build request
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
          productCode: productCode,
          metaInfo: JSON.stringify(metaInfo),
          returnUrl: returnUrl,
          merchantBizId: merchantBizId,
          merchantUserId: merchantUserId
        });
      }

      console.log("request is ", request);
      // Invoke API
      const response = await client.initialize(request);
      if (!response) {
        resolve(response);
      } else {
        reject(response);
      }
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
        const response = await client.getVerifyToken(request);

        if (!response) {
          resolve(response);
        } else {
          reject(response);
        }
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
          resolve(response);
        } else {
          reject(response);
        }
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
          resolve(response);
        } else {
          reject(response);
        }
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
          resolve(response);
        } else {
          reject(response);
        }
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

      // Get result
      console.log(response.body.requestId);
      console.log(response.body.result.transactionId);
      console.log(response.body.result.passed);
      console.log(response.body.result.subCode);
      if (!response) {
        resolve(response);
      } else {
        reject(response);
      }
    });
  }
}

export const ekycService = new EkycService();