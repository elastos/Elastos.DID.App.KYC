import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EkycService {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
  }

  public async processIDOCR(metaInfo: string): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      if (!metaInfo) {
        console.error("metaInfo is null");
      }

      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/idocr`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(metaInfo)
        });
        console.log("metaInfobody  is ", JSON.stringify(metaInfo));

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }
        console.log("response ok ", response);
        resolve(response);

      } catch (error) {
        console.error(error);
      }
    });

  }

  public async processEKYC(metaInfo: string): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      if (!metaInfo) {
        console.error("metaInfo is null");
      }

      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/ekyc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(metaInfo)
        });

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }
        console.log("response ok ", response);
        resolve(response);
      } catch (error) {
        console.error(error);
      }
    });
  }

  public async processFaceVerify(metaInfo: string, facePictureBase64: string, facePictureUrl: string): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      if (!metaInfo) {
        console.error("metaInfo error", metaInfo);
      }

      if (!facePictureBase64 && !facePictureUrl) {
        console.error("facePictureBase64 or facePictureUrl error", facePictureBase64, facePictureUrl);
      }

      try {
        const faceVerifyBody = {
          metaInfo: metaInfo,
          facePictureBase64: facePictureBase64,
          facePictureUrl: facePictureUrl
        }
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/faceverify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(faceVerifyBody)
        });

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }
        console.log("response ok ", response);
        resolve(response);
      } catch (error) {
        console.error(error);
      }
    });
  }


  public async processFaceLiveness(metaInfo: string): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      if (!metaInfo) {
        console.error("metaInfo error");
      }

      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/faceliveness`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(metaInfo)
        });

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }
        console.log("response ok ", response);
        resolve(response);
      } catch (error) {
        console.error(error);
      }
    });
  }

  public async processFaceCompare(sourceFacePictureBase64: string, sourceFacePictureUrl: string,
    targetFacePictureBase64: string, targetFacePictureUrl: string): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      if (!sourceFacePictureBase64 && !sourceFacePictureUrl && !targetFacePictureBase64 && !targetFacePictureUrl) {
        console.error("processFaceCompare: Invalid input");
        return;
      }
      try {
        const faceCompareBody = {
          sourceFacePictureBase64: sourceFacePictureBase64,
          sourceFacePictureUrl: sourceFacePictureUrl,
          targetFacePictureBase64: targetFacePictureBase64,
          targetFacePictureUrl: targetFacePictureUrl
        }
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/facecompare`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(faceCompareBody)
        });

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }
        console.log("response ok ", response);
        resolve(response);
      } catch (error) {
        console.error(error);
      }
    });
  }

  public async checkResult(transactionId: any): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      if (!transactionId) {
        console.error("metaInfo is null");
      }

      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/checkresult`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(transactionId)
        });

        console.log("Check body: body is ", transactionId);

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }
        console.log("response ok ", response);
        resolve(response);
      } catch (error) {
        console.error(error);
      }
    });

  }

  public handleIDOCRResult() {
    // Initialize the url object
    var url = new URL(window.location.href);
    // Parsing response
    var response = JSON.parse(url.searchParams.get('response'));
    console.log("response result is ", response);
    // response = {
    //     resultCode: '',
    //     resultMessage: '',
    //     ocrResult: {code: '',reason: '', extInfo: {certifyId: ''}},
    // }
  }
}