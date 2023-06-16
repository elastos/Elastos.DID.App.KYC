import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router, ActivatedRoute } from '@angular/router';
import { EKYCReturnCode } from 'src/app/model/ekyc/ekycreturncode';
import { AuthService } from 'src/app/services/auth.service';
import { CacheService } from 'src/app/services/cache.service';
import { CredentialsService } from 'src/app/services/credentials.service';
import { EkycService } from 'src/app/services/ekyc.service';
import { ThemeService } from 'src/app/services/theme.service';
import * as api from 'src/assets/js/jsvm_all.js';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VerifyComponent {
  @ViewChild('passbaseButton') passbaseButton: ElementRef;
  public isStartProcessIDOCR = false;
  public isStartPrcocessEKYC = false;
  public isStartProcessFaceVerify = false;
  public isStartProcessFaceLiveness = false;
  public isStartCheckResult = false;

  public verificationInProgress = false;
  public verificationCompleted = false;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private authService: AuthService,
    private credentialsService: CredentialsService,
    private themeService: ThemeService,
    private ekycService: EkycService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(async (params) => {
      try {
        if (!params) {
          console.log("params is null");
          return;
        }

        const returnURLRespose = params.response;
        const responseObj = JSON.parse(returnURLRespose);
        const resultCode = responseObj.resultCode;

        if (resultCode != EKYCReturnCode.Success) {
          console.log("result code is not success");
          alert("Error: " + this.handleErrorMsg(resultCode));
          return;
        }

        const transactionId = responseObj.extInfo.certifyId;

        const credentialResponse = await this.credentialsService.fetchEkycCredential(transactionId);
        console.log("check result response is ", credentialResponse);

        CacheService.setVerificationStatus(this.authService.signedInDID(), credentialResponse);
        this.verificationCompleted = true;
      } catch (error) {
        console.error("error is ", error);
      }
    });
  }

  processIDOCR() {
    this.isStartProcessIDOCR = true;

    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);

    this.ekycService.processIDOCR(metainfo);
  }

  async processEKYC() {
    this.isStartPrcocessEKYC = true;

    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);

    try {
      const response = await this.ekycService.processEKYC(metainfo);
      const resultObj = await response.json()
      const requestId = resultObj.requestId
      const transactionId = resultObj.transactionId
      const transactionUrl = resultObj.transactionUrl

      console.log("requestId is ", requestId);
      console.log("transactionId is ", transactionId);
      console.log("transactionUrl is ", transactionUrl);

      window.location.href = transactionUrl;
    } catch (error) {
      console.error("process ekyc error is ", error);
    }
  }

  async processFaceVerify() {
    this.isStartProcessFaceVerify = true;

    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);

    const facePictureBase64: string = "";
    const facePictureUrl: string = "";

    const response = await this.ekycService.processFaceVerify(metainfo, facePictureBase64, facePictureUrl);
    const resultObj = await response.json();

    const requestId = resultObj.requestId
    const transactionId = resultObj.transactionId
    const transactionUrl = resultObj.transactionUrl

    console.log("requestId is ", requestId);
    console.log("transactionId is ", transactionId);
    console.log("transactionUrl is ", transactionUrl);
  }

  async processFaceLiveness() {
    this.isStartProcessFaceLiveness = true;

    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);

    try {
      const response = await this.ekycService.processFaceLiveness(metainfo);
      const resultObj = await response.json()
      const requestId = resultObj.requestId
      const transactionId = resultObj.transactionId
      const transactionUrl = resultObj.transactionUrl

      console.log("requestId is ", requestId);
      console.log("transactionId is ", transactionId);
      console.log("transactionUrl is ", transactionUrl);

      window.location.href = transactionUrl;
    } catch (error) {
      console.error("process ekyc error is ", error);
    }






  }

  checkResult() {
    this.isStartCheckResult = true;
    const transactionId = "hks88a8d6f44899e5813af7b6d27d6bb";

    console.log("CheckResult request transactionId is ", transactionId);
    const transactionBody = {
      "transactionId": transactionId
    }
    this.ekycService.checkResult(transactionBody);
  }

  //pop up aliyun ocr window
  openBottomSheet(): void {
    this._bottomSheet.open(VerifyComponent);
  }

  async ngAfterViewInit() {
    // let passbaseMetadata = await this.credentialsService.fetchUserPassbaseMetadata();

    // logger.log("Passbase metadata:", passbaseMetadata);

    // if (passbaseMetadata) { // Make sure to have metadata or forbid verification
    //   Passbase.renderButton(
    //     this.passbaseButton.nativeElement,
    //     process.env.NG_APP_PASSBASE_PUBLIC_API_KEY,
    //     {
    //       onStart: () => {
    //         console.log('Passbase onstart');
    //         this.verificationInProgress = true;
    //       },
    //       onError: (error, context) => {
    //         console.log('Passbase onerror', error);
    //         this.verificationInProgress = false;
    //       },
    //       // onSubmitted: received at the very end of the verification steps before clicking "finish"
    //       onSubmitted: (identityAccessKey) => {
    //         console.log('Passbase onSubmitted', identityAccessKey);

    //         this.credentialsService.savePassbaseUUID(identityAccessKey);
    //       },
    //       // onFinish: received at the very end of the verification steps after clicking "finish"
    //       onFinish: (identityAccessKey) => {
    //         console.log('Passbase onFinish', identityAccessKey);

    //         this.verificationInProgress = false;
    //         this.verificationCompleted = true;
    //       },
    //       metaData: passbaseMetadata,
    //       prefillAttributes: {
    //         email: this.authService.getAuthUser().email, // pre-fill user's email for convenience, if provided
    //       },
    //       theme: {
    //         darkMode: this.themeService.isDarkMode // TODO: not working (remains white) - passbase team is checking this
    //       }
    //     }
    //   );
    // }
  }

  public backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  handleErrorMsg(errorCode: string) {
    let errorMessage = "";
    switch (errorCode) {
      case EKYCReturnCode.Success:
        errorMessage = "Success";
        break;
      case EKYCReturnCode.SystemError:
        errorMessage = "SystemError";
        break;
      case EKYCReturnCode.FlowError:
        errorMessage = "The process is missing or abnormal, no process is available";
        break;
      case EKYCReturnCode.InitError:
        errorMessage = "Client initialization exception";
        break;
      case EKYCReturnCode.CameraError:
        errorMessage = "Evoking camera exception";
        break;
      case EKYCReturnCode.ProductCodeError:
        errorMessage = "Product code return error";
        break;
      case EKYCReturnCode.RetryLimitError:
        errorMessage = "The number of retry exceeds the upper limit.";
        break;
      case EKYCReturnCode.UserQuit:
        errorMessage = "User voluntarily logs out";
        break;
      case EKYCReturnCode.SystemException:
        errorMessage = "System exception";
        break;
      case EKYCReturnCode.eKYCFail:
        errorMessage = "Authentication failed";
        break;
    }
    return errorMessage;
  }
}
