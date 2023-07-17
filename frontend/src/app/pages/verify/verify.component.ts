import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { EKYCResponseType } from 'src/app/model/ekyc/ekycresponsetype';
import { EKYCReturnCode } from 'src/app/model/ekyc/ekycreturncode';
import { AuthService } from 'src/app/services/auth.service';
import { CacheService } from 'src/app/services/cache.service';
import { CredentialsService } from 'src/app/services/credentials.service';
import { EkycService } from 'src/app/services/ekyc.service';
import { ThemeService } from 'src/app/services/theme.service';
import { PromoteComponent } from 'src/app/components/promote/promote.component';
import { PromoteService } from 'src/app/services/promote.service';

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

  public verificationInProgress = false;
  public verificationCompleted = false;

  public enableVerify = true;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private authService: AuthService,
    private credentialsService: CredentialsService,
    private themeService: ThemeService,
    private ekycService: EkycService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private promoteService: PromoteService,
    private dialog: MatDialog
  ) { }

  openDialog(title: string, content: string) {
    this.promoteService.setPromoteTitle(title);
    this.promoteService.setPromoteContent(content);
    const dialogRef = this.dialog.open(PromoteComponent, { role: "alertdialog", disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (!result)
        return;
      this.isStartPrcocessEKYC = false;
      // window.location.replace("/verify");
    });
  }

  ngOnInit() {
    const metainfo = this.getMetaInfo();
    if (!this.checkIsH5(metainfo)) {
      this.enableVerify = false;
    }

    this.activatedRoute.queryParams.subscribe(async (params) => {
      try {
        const cerifacations = CacheService.getVerificationStatus(this.authService.signedInDID());
        console.log("cerifacations ====>" + cerifacations);
        if (cerifacations) {
          window.location.replace("/dashboard");
        }

        if (!params || !params.response) {
          return;
        }

        this.isStartPrcocessEKYC = true;
        const returnURLRespose = params.response;
        const responseObj = JSON.parse(returnURLRespose);

        const resultCode = responseObj.resultCode;
        const transactionId = responseObj.extInfo.certifyId;
        window.history.replaceState({}, '', '/verify');

        if (resultCode == EKYCReturnCode.VERIFY_FAILED) {
          const result = await this.checkResult(transactionId)
          const parsedResult = this.ekycService.parseResult(result);
          if (!parsedResult) {
            this.handleVerifyError();
            return;
          }

          if (parsedResult.facePassed != "Y") {
            this.handleFacelivenessError();
            return;
          }

          if (parsedResult.ocrIdPassed != "Y") {
            this.handleOCRError()
            return;
          }
        }

        if (resultCode != EKYCReturnCode.SUCCESS) {
          this.handleError(resultCode);
          return;
        }


        const credentialResponse = await this.credentialsService.fetchEkycCredential(transactionId);
        const credentialResponseObj = JSON.parse(credentialResponse)

        if (credentialResponseObj.code != EKYCResponseType.SUCCESS) {
          this.handleDIDNotMatched(credentialResponseObj.code)
          return;
        }

        CacheService.setVerificationStatus(this.authService.signedInDID(), JSON.stringify(credentialResponseObj.data));
        this.verificationCompleted = true;
        this.router.navigate(['/verifysuccess'], { skipLocationChange: true });

      } catch (error: any) {
        this.openDialog("Tips", "The server encountered a temporary error and could not complete your request. ");
        // alert("The server encountered a temporary error and could not complete your request. ");
        console.error("error is ", error);
      }
    });
  }

  handleDIDNotMatched(responseCode: string) {
    console.log("responseCode", responseCode);
    // alert("Error: " + "Did not matched");
    this.openDialog("Tips", "Did not matched");
  }

  handleError(resultCode: string) {
    console.log("result code is not success");
    // alert("Error: " + this.handleErrorMsg(resultCode));
    this.openDialog("Tips", this.handleErrorMsg(resultCode));
  }

  processIDOCR() {
    this.isStartProcessIDOCR = true;
    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);
    this.ekycService.processIDOCR(metainfo);
  }

  async processEKYC() {
    this.isStartPrcocessEKYC = true;
    const metainfo = this.getMetaInfo();

    try {
      const response = await this.ekycService.processEKYC(metainfo);
      const result = await response.json()


      console.log("check result response is ", result);
      const responseObj = JSON.parse(result)
      console.log("responseObj is ", responseObj);

      console.log("code", responseObj.code);

      if (responseObj.code != EKYCResponseType.SUCCESS) {
        this.handleDIDNotMatched(responseObj.code)
        return;
      }

      const responseData = responseObj.data;

      const requestId = responseData.requestId
      const transactionId = responseData.transactionId
      const transactionUrl = responseData.transactionUrl

      console.log("requestId is ", requestId);
      console.log("transactionId is ", transactionId);
      console.log("transactionUrl is ", transactionUrl);

      window.location.href = transactionUrl;
    } catch (error) {
      console.error("process ekyc error is ", error);
    }
  }

  getMetaInfo() {
    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);
    return metainfo;
  }

  checkIsH5(metainfo: any): boolean {
    const deviceType = metainfo.deviceType;
    console.log("deviceType is ", deviceType);

    if (deviceType.toLowerCase() == "h5") {
      return true;
    }

    return false;
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

  async checkResult(transactionId: string) {
    console.log("CheckResult request transactionId is ", transactionId);
    const transactionBody = {
      "transactionId": transactionId
    }
    return await this.ekycService.checkResult(transactionBody);
  }

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
      // case EKYCReturnCode.Success:
      //   errorMessage = "Success";
      //   break;
      // case EKYCReturnCode.SystemError:
      //   errorMessage = "SystemError";
      //   break;
      // case EKYCReturnCode.FlowError:
      //   errorMessage = "The process is missing or abnormal, no process is available";
      //   break;
      // case EKYCReturnCode.InitError:
      //   errorMessage = "Client initialization exception";
      //   break;
      // case EKYCReturnCode.CameraError:
      //   errorMessage = "Evoking camera exception";
      //   break;
      // case EKYCReturnCode.ProductCodeError:
      //   errorMessage = "Product code return error";
      //   break;
      // case EKYCReturnCode.RetryLimitError:
      //   errorMessage = "The number of retry exceeds the upper limit.";
      //   break;
      // case EKYCReturnCode.UserQuit:
      //   errorMessage = "User voluntarily logs out";
      //   break;
      // case EKYCReturnCode.SystemException:
      //   errorMessage = "System exception";
      //   break;
      // case EKYCReturnCode.eKYCFail:
      //   errorMessage = "Authentication failed";
      //   break;

      case EKYCReturnCode.SUCCESS:
        errorMessage = "Verify success.";
        break;
      case EKYCReturnCode.VERIFY_FAILED:
        errorMessage = "Verify failed. ";
        break;
      case EKYCReturnCode.SYSTEM_ERROR:
        errorMessage = "System error.";
        break;
      case EKYCReturnCode.SDK_INIT_ERROR:
        errorMessage = "Sdk initialization error, please confirm that the time on the mobile phone is correct.";
        break;
      case EKYCReturnCode.CAMERA_INIT_ERROR:
        errorMessage = "Camera initialization error.";
        break;
      case EKYCReturnCode.NETWORK_ERROR:
        errorMessage = "Network error.";
        break;
      case EKYCReturnCode.USER_CANCELED:
        errorMessage = "User canceled.";
        break;
      case EKYCReturnCode.INVALID_TRANSACTION_ID:
        errorMessage = "Invalid transactionId.";
        break;
      case EKYCReturnCode.TIMESTAMP_ERROR:
        errorMessage = "Timestamp error.";
        break;
      case EKYCReturnCode.WRONG_DOCUMENT_TYPE:
        errorMessage = "Wrong document type.";
        break;
      case EKYCReturnCode.KEY_INFO_MISSING:
        errorMessage = "The key information identified by OCR is missing or the format validation fails.";
        break;
      case EKYCReturnCode.BAD_IMAGE_QUALITY:
        errorMessage = "Bad image quality.";
        break;
      case EKYCReturnCode.ERROR_COUNT_EXCEEDED:
        errorMessage = "Error count exceeded.";
        break;
      default:
        errorMessage = "Unknown error";
        break;
    }
    return errorMessage;
  }

  handleOCRError() {
    this.openDialog("Tips", "ID verification failed, please try again later.");
  }

  handleFacelivenessError() {
    this.openDialog("Tips", "Facial liveness detection failed, please try again later.");
  }

  handleVerifyError() {
    this.openDialog("Tips", "Verification failed, please try again later.");
  }
}
