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

  public async processIDOCR(metaInfo: string) {
    if (metaInfo) {
      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/idocr/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(metaInfo)
        });

        if (response.ok) {
          console.log("processIDOCR: response ok");
          console.log("response is ", response);

          //TODO
          // this.router.navigate([response.redirectUrl]);

        } else {
          console.error(response);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}