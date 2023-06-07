import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
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
    private router: Router
  ) { }

  processIDOCR() {
    this.isStartProcessIDOCR = true;

    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);

    this.ekycService.processIDOCR(metainfo);
    // window.location.href = "xxx";
  }

  processEKYC() {
    this.isStartPrcocessEKYC = true;

    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);

    this.ekycService.processEKYC(metainfo);
  }

  processFaceVerify() {
    this.isStartProcessFaceVerify = true;

    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);

    const facePictureBase64: string = "";
    const facePictureUrl: string = "";

    this.ekycService.processFaceVerify(metainfo, facePictureBase64, facePictureUrl);
  }

  processFaceLiveness() {
    this.isStartProcessFaceLiveness = true;

    const metainfo = api.getMetaInfo();
    console.log("meta info is ", metainfo);

    this.ekycService.processFaceLiveness(metainfo);
  }

  checkResult() {
    this.isStartCheckResult = true;
    const transactionId = "";

    console.log("transactionId is ", transactionId);

    this.ekycService.checkResult(transactionId);
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
}
