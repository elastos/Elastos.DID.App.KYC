import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TencentEkycService {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {
  }

  public async processEKYC(imageBase64: string, docType: string, redirectUrl: string): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      if (!imageBase64 || !docType) {
        console.error("Process ekyc ocr params is null");
        reject('');
      }

      const userDid = this.authService.signedInDID();
      const requestBody = {
        imageBase64: imageBase64,
        userId: userDid,
        docType: docType,
        redirectUrl: redirectUrl
      }
      console.log("requestBody is ", requestBody);

      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/tencent/processeocr`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(requestBody)
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

  public async checkResult(bizToken: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!bizToken) {
        console.error("Process ekyc ocr params is null");
        reject('');
      }

      const userDid = this.authService.signedInDID();
      const requestBody = {
        bizToken: bizToken,
        userId: userDid
      }
      console.log("requestBody is ", requestBody);

      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/tencent/checkresult`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }
        let result = await response.json();
        console.log("response ok ", response);
        resolve(result);
      } catch (error) {
        console.error(error);
      }
    });
  }

  public async deleteCachedData(bizToken: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!bizToken) {
        console.error("Process delete cached ocr info params is null");
        reject('');
      }

      const userDid = this.authService.signedInDID();
      const requestBody = {
        bizToken: bizToken,
        userId: userDid
      }
      console.log("requestBody is ", requestBody);

      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/tencent/deleteCachedData`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }
        let result = await response.json();
        console.log("response ok ", response);
        resolve(result);
      } catch (error) {
        console.error(error);
      }
    });
  }

  public parseResult(result: any) {
  }

  public handleIDOCRResult() {
  }
}