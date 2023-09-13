import { Component, ViewEncapsulation } from '@angular/core';
import { TencentEkycService } from 'src/app/services/tencent.ekyc.service';

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
  constructor(private tencentEkycService: TencentEkycService) { }

  ngOnInit() {
    this.canvas = document.querySelector('#canvas');
    this.openCamera();
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
      navigator.mediaDevices.getUserMedia({ video: true }).then(
        (stream) => {
          this.video.srcObject = stream;
          this.mediaSteam = stream;
        }
      ).catch((error) => { });
    }
  }

  async processOCR() {
    try {
      const response = await this.tencentEkycService.processEKYC(this.imageData, 'IDCardOCR', `${process.env.NG_APP_TENCENT_REDIRECT_URL}`);
      console.log('Process ocr response', response);
    } catch (error) {
      console.log('Process ocr error', error);
    }
  }
}
