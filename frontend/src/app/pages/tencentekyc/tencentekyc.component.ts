import { Component, ViewEncapsulation } from '@angular/core';
import { DocType } from 'src/app/model/ekyc/ekycdoctype';
import { EKYCResponseType } from 'src/app/model/ekyc/ekycresponsetype';
import { TencentEkycService } from 'src/app/services/tencent.ekyc.service';
import { ActivatedRoute } from '@angular/router';
import { PromoteService } from 'src/app/services/promote.service';
import { PromoteComponent } from 'src/app/components/promote/promote.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-tencentekyc',
  templateUrl: './tencentekyc.component.html',
  styleUrls: ['./tencentekyc.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TencentEkycComponent {
  public video: HTMLVideoElement;
  public canvas: HTMLCanvasElement;
  public mediaSteam: MediaStream;
  private imageData: string;
  public isShowCameraResult: boolean;
  private docType: string;
  public isStartPrcocessEKYC = false;
  constructor(
    private tencentEkycService: TencentEkycService,
    private route: ActivatedRoute,
    private promoteService: PromoteService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(queryParams => {
      console.log("queryParams", queryParams)
      if ("docType" in queryParams) {
        this.docType = queryParams["docType"];
        console.log('docType = ', this.docType);
      }
    })

    this.canvas = document.querySelector('#canvas');
    this.openCamera();
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.closeCamera();
  }

  takePicture() {
    if (this.video) {
      this.isShowCameraResult = true;
      this.video.hidden = true;
      this.canvas.hidden = false;

      this.canvas.width = this.video.videoWidth;

      this.canvas.height = this.video.videoHeight;
      this.canvas.getContext('2d').drawImage(this.video, 0, 0);

      const dataUrl = this.canvas.toDataURL();
      this.imageData = dataUrl;
    }

    this.closeCamera();
  }

  closeCamera() {
    if (this.mediaSteam) {
      this.mediaSteam.getVideoTracks().forEach((track) => {
        track.stop();

        this.video = null;
        this.mediaSteam = null;
      });
    }
  }

  openCamera() {
    if (!this.video) {
      this.video = document.querySelector('#video');
      this.isShowCameraResult = false;
      this.video.hidden = false;
      this.canvas.hidden = true;

      const height = window.screen.height;
      const width = window.screen.width;

      const videoHeight = width;
      const videoWidth = width / 1.585;
      console.log('width = ', width);
      console.log('height = ', height);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: videoWidth, height: videoHeight } }).then(
        (stream) => {
          this.video.srcObject = stream;
          this.mediaSteam = stream;
        }
      ).catch((error) => { });
    }
  }

  async processOCR() {
    try {
      this.isStartPrcocessEKYC = true;

      const response = await this.tencentEkycService.processEKYC(this.imageData, this.docType, `${process.env.NG_APP_TENCENT_REDIRECT_URL}`);
      const result = await response.json();
      console.log("ekyc result response is ", result);

      const responseObj = JSON.parse(result);

      if (responseObj.code == EKYCResponseType.DID_NOT_MATCH) {
        this.showDIDNotMatchedDialog(responseObj.code)
        return;
      }

      if (responseObj.code != EKYCResponseType.SUCCESS) {
        this.showErrorDialog(responseObj.code)
        return;
      }

      const responseData = responseObj.data;
      const verificationUrl = responseData.verificationUrl;

      window.location.href = verificationUrl;
    } catch (error) {
      this.isStartPrcocessEKYC = false;
      console.log('Process ocr error', error);
    }
  }

  showDIDNotMatchedDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Did not matched");
  }

  showErrorDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Process ekyc error, please try again");
  }

  openDialog(title: string, content: string) {
    this.promoteService.setPromoteTitle(title);
    this.promoteService.setPromoteContent(content);
    const dialogRef = this.dialog.open(PromoteComponent, { role: "alertdialog", disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (!result)
        return;
      this.isStartPrcocessEKYC = false;
    });
  }
}
