import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute, Params } from '@angular/router';
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

interface DocTypeCategory {
  id: string;
  name: string;
}
import { DocType } from 'src/app/model/ekyc/ekycdoctype';
import { TencentEkycService } from 'src/app/services/tencent.ekyc.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VerifyComponent {
  public isStartProcessIDOCR = false;
  public isStartPrcocessEKYC = false;
  public isStartProcessFaceVerify = false;
  public isStartProcessFaceLiveness = false;

  public verificationInProgress = false;
  public verificationCompleted = false;

  public enableVerify = true;

  categories: DocTypeCategory[];
  selectedCategory: DocTypeCategory;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private authService: AuthService,
    private credentialsService: CredentialsService,
    private themeService: ThemeService,
    private ekycService: EkycService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private promoteService: PromoteService,
    private dialog: MatDialog,
    private tencentEkycService: TencentEkycService
  ) {
    this.categories = [
      {
        id: DocType.Passport,
        name: "Passport"
      },
      {
        id: DocType.ChinaMainLand2ndIDCard,
        name: "ChinaMainLand2ndIDCard"
      }
    ];
    this.selectedCategory = this.categories[0];
  }

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

    this.activatedRoute.queryParams.subscribe(async (params: Params) => {
      try {
        const cerifacations = CacheService.getVerificationStatus(this.authService.signedInDID());
        if (cerifacations && cerifacations.credentials && cerifacations.credentials.length > 0) {
          window.location.replace("/dashboard");
        }

        if (!params || !(params.response || params.token)) {
          return;
        }

        this.isStartPrcocessEKYC = true;
        let credentialResponseObj = null;

        if (params.response) {
          credentialResponseObj = await this.processAlicloudEkycResult(params);
        }

        if (params.token) {
          credentialResponseObj = await this.processTencentEkycResult(params);//TODO 
        }

        if (!credentialResponseObj) {
          console.log('Credential responseObj is null')
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

  processAlicloudEkycResult(params: Params): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const returnURLRespose = params.response;
        const responseObj = JSON.parse(returnURLRespose);

        const resultCode = responseObj.resultCode;
        const transactionId = responseObj.extInfo.certifyId;

        window.history.replaceState({}, '', '/verify');
        if (resultCode == EKYCReturnCode.VERIFY_FAILED) {
          const result = await this.checkResult(transactionId)
          const parsedResult = this.ekycService.parseResult(result);
          this.deleteCachedData(transactionId);
          if (!parsedResult) {
            this.showVerifyErrorDialog();
            return;
          }
          const errorMsg = this.handleSubCode(parsedResult.subCode);
          if (errorMsg) {
            this.showErrorDialog(errorMsg);
            return;
          }

          if (parsedResult.facePassed != "Y") {
            this.showFacelivenessErrorDialog();
            return;
          }

          if (parsedResult.ocrIdPassed != "Y") {
            this.showOCRErrorDialog()
            return;
          }
        }

        if (resultCode != EKYCReturnCode.SUCCESS) {
          this.handleError(resultCode);
          return;
        }

        const credentialResponse = await this.credentialsService.fetchEkycCredential(transactionId);
        if (!credentialResponse) {
          console.log('Credential response is null');
          reject('Credential response is null');
          return;
        }

        this.deleteCachedData(transactionId);
        const credentialResponseObj = JSON.parse(credentialResponse)

        if (credentialResponseObj.code == EKYCResponseType.DID_NOT_MATCH) {
          this.showDIDNotMatchedDialog(credentialResponseObj.code)
          return;
        }

        if (credentialResponseObj.code == EKYCResponseType.FACE_OCCLUSION) {
          this.showFaceOcclusionDialog(credentialResponseObj.code)
          return;
        }

        if (credentialResponseObj.code == EKYCResponseType.PASSPORT_EXPIRE) {
          this.showPassportExpireDialog(credentialResponseObj.code)
          return;
        }
        resolve(credentialResponseObj);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  processTencentEkycResult(params: Params): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const bizToken = params.token;
        window.history.replaceState({}, '', '/verify');
        console.log('params.token = ', bizToken);
        const response = await this.tencentEkycService.checkResult(bizToken);
        //TODO check liveness valid
        if (!response) {
          reject('Response is null');
          return;
        }

        const responseObj = JSON.parse(response);
        const data = responseObj.data;
        const dataObj = JSON.parse(data);
        console.log('resultObj = ', dataObj);

        const credentialResponse = await this.credentialsService.fetchTencentEkycCredential(bizToken);
        if (!credentialResponse) {
          console.log('Credential response is null');
          reject('Credential response is null');
          return;
        }

        //TODO delete cached data
        // this.deleteCachedData(transactionId);
        const credentialResponseObj = JSON.parse(credentialResponse)
        console.log('credentialResponseObj ', credentialResponseObj);
        if (credentialResponseObj.code == EKYCResponseType.DID_NOT_MATCH) {
          this.showDIDNotMatchedDialog(credentialResponseObj.code)
          return;
        }

        if (credentialResponseObj.code == EKYCResponseType.FACE_OCCLUSION) {
          this.showFaceOcclusionDialog(credentialResponseObj.code)
          return;
        }

        if (credentialResponseObj.code == EKYCResponseType.PASSPORT_EXPIRE) {
          this.showPassportExpireDialog(credentialResponseObj.code)
          return;
        }
        resolve(credentialResponseObj);
      } catch (error) {
        reject(error);
      }
    });
  }

  showDIDNotMatchedDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Did not matched");
  }

  showFaceOcclusionDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Occluded face detected, please try again");
  }

  showPassportExpireDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Passport expired detected, please try again");
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
  async processEKYCFromTencent() {
    this.router.navigate(['/tencentekyc']);
  }

  async processEKYC() {
    this.isStartPrcocessEKYC = true;
    const metainfo = this.getMetaInfo();

    try {
      const response = await this.ekycService.processEKYC(metainfo, this.selectedCategory.id);
      const result = await response.json()
      console.log("ekyc result response is ", result);
      const responseObj = JSON.parse(result)

      if (responseObj.code != EKYCResponseType.SUCCESS) {
        this.showDIDNotMatchedDialog(responseObj.code)
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


  private async deleteCachedData(transactionId: string) {
    return await this.ekycService.deleteCachedData(transactionId);
  }

  openBottomSheet(): void {
    this._bottomSheet.open(VerifyComponent);
  }

  async ngAfterViewInit() {
  }

  public backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  handleErrorMsg(errorCode: string) {
    let errorMessage = "";
    switch (errorCode) {
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

  handleSubCode(subCode: string) {
    let errorMessage = "";
    switch (subCode) {
      case "200":
        errorMessage = "Verify success.";
        break;
      case "201":
        errorMessage = "Owner Name and ID number do not match in the authority database. The user information may be incorrect or false. Please try again.";
        break;
      case "202":
        errorMessage = "No identity information can be found in the authority database. Please contact the project team for manual review.";
        break;
      case "204":
        errorMessage = "The authentication failed. Similarity score is lower than threshold.  Please try again.";
        break;
      case "205":
        errorMessage = "The authentication failed.Spoofing behavior is detected.";
        break;
      case "207":
        errorMessage = "Face comparison with the authority database failed. Please try again.";
        break;
      case "209":
        errorMessage = "Authority database exception. Please try again.";
        break;
      case "212":
        errorMessage = "The result of certificate anti - counterfeiting detection indicates tampering, screen recapture or photo copy are detected. Please try again.";
        break;
      default:
        break;
    }
    return errorMessage;
  }

  showOCRErrorDialog() {
    this.openDialog("Tips", "ID verification failed. Please retake the ID card after changing the environment or light, and then continue the authentication.");
  }

  showFacelivenessErrorDialog() {
    this.openDialog("Tips", "Facial liveness detection failed, please try again later.");
  }

  showVerifyErrorDialog() {
    this.openDialog("Tips", "Verification failed, please try again later.");
  }

  showErrorDialog(errorMsg: string) {
    this.openDialog("Tips", errorMsg);
  }
}
