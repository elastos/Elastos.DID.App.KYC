import { Component, ViewEncapsulation } from '@angular/core';
import { DocType } from 'src/app/model/ekyc/ekycdoctype';
import { EKYCResponseType } from 'src/app/model/ekyc/ekycresponsetype';
import { TencentEkycService } from 'src/app/services/tencent.ekyc.service';
import { ActivatedRoute } from '@angular/router';

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
  constructor(
    private tencentEkycService: TencentEkycService,
    private route: ActivatedRoute
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
      const response = await this.tencentEkycService.processEKYC(this.imageData, this.docType, `${process.env.NG_APP_TENCENT_REDIRECT_URL}`);
      const result = await response.json();
      console.log("ekyc result response is ", result);

      const responseObj = JSON.parse(result);

      if (responseObj.code != EKYCResponseType.SUCCESS) {
        // this.showDIDNotMatchedDialog(responseObj.code)
        // TODO
        console.log('Did not match');
        return;
      }
      const responseData = responseObj.data;
      const verificationUrl = responseData.verificationUrl;

      window.location.href = verificationUrl;
    } catch (error) {
      console.log('Process ocr error', error);
    }
  }
}