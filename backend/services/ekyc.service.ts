import { SecretConfig } from "../config/env-secret";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { Config } = require("@alicloud/openapi-client");
const CloudAuth = require("@alicloud/cloudauth-intl20220809");
const Client = CloudAuth.default;


class EkycService {
  public async setup() {
  }

  public async processIdOcr(metaInfo: string) {
    const productCode = SecretConfig.EkycIDOCR.productCode;
    const returnUrl = SecretConfig.EkycIDOCR.returnUrl;
    const merchantBizId = SecretConfig.EkycIDOCR.merchantBizId;
    const merchantUserId = SecretConfig.EkycIDOCR.merchantUserId;

    const response = await this.initial(productCode, metaInfo, returnUrl, merchantBizId, merchantUserId);

    // Get result
    console.log("requestId is ", response.body.requestId);
    console.log("transactionId is ", response.body.result.transactionId);
    console.log("transactionUrl is ", response.body.result.transactionUrl);
  }

  public initial(productCode: string, metaInfo: string, returnUrl: string, merchantBizId: string, merchantUserId: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {

      const config = new Config({
        accessKeyId: SecretConfig.Ekyc.accessKeyId,
        accessKeySecret: SecretConfig.Ekyc.accessKeySecret,
        endpoint: SecretConfig.Ekyc.endpoint
      });
      const client = new Client(config);

      // Build request
      /**
       * @param productCode {string} Product code of identity proofing. Set to eKYC in this mode.
       *              For example, the product code of the ID card OCR service is ID_OCR.
       * @param metaInfo {string} The meta information about the SDK and the user's device.
       *            When App SDK mode is used, its value comes from the Alibaba Cloud SDK in the JSON string format, for example:
       *            "{\"apdidToken\":\"69b74bfe-bf7f-4d3b-ac59-907ee09e7955\",\"appName\":\"com.alibabacloud.atomic.client\",\"appVersion\":\"1.0.9\",\"bioMetaInfo\":\"3.46.0:2916352,0\",\"deviceModel\":\"MI 6\",\"deviceType\":\"android\",\"osVersion\":\"9\",\"zimVer\":\"1.0.0\"}"
       * @param returnUrl {string} The destination address of your business page bounce.
       * @param merchantBizId {string} A unique business ID for tracing purpose. For example，the sequence ID from the merchant's business-related database.
       * @param merchantUserId {string} Merchant user ID, or other identifiers that can be used to identify a specific user, for example, mobile phone number, email address and so on. It is strongly recommended to pre-desensitize the value of the userId field, for example, by hashing the value.
       */
      const request = new CloudAuth.InitializeRequest({
        productCode: productCode,
        metaInfo: JSON.stringify(metaInfo),
        returnUrl: returnUrl,
        merchantBizId: merchantBizId,
        merchantUserId: merchantUserId
      });

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
}

export const ekycService = new EkycService();