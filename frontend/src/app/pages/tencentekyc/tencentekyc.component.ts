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
  public isSelectImage: boolean;
  private docType: string;
  public isStartPrcocessEKYC = false;
  constructor(
    private tencentEkycService: TencentEkycService,
    private route: ActivatedRoute,
    private promoteService: PromoteService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.isSelectImage = false;
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

      this.drawCanvas(this.video.videoWidth, this.video.videoHeight, this.video.videoWidth, this.video.videoHeight, this.video, this.canvas);
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

      // const height = window.screen.height;
      // const width = window.screen.width;

      // const videoHeight = width * 4;
      const videoWidth = 1024;
      const videoHeight = videoWidth / 1.585;

      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: videoWidth, height: videoHeight } }).then(
        (stream) => {
          this.video.srcObject = stream;
          this.mediaSteam = stream;
        }
      ).catch((error) => { });
    }
  }

  drawCanvas(canvasWidth: number, canvasHeight: number, naturalWidth: number, naturalHeight: number, drawImage: CanvasImageSource, canvas: HTMLCanvasElement) {
    if (canvasWidth == naturalWidth && canvasHeight == naturalHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.getContext('2d').drawImage(drawImage, 0, 0);
    } else {
      let scale = naturalWidth / canvasWidth;
      let height = naturalHeight / scale;

      console.log('canvasWidth = ', canvasWidth, 'canvasHeight', height);
      canvas.width = canvasWidth;
      canvas.height = height;
      canvas.getContext('2d').drawImage(drawImage, 0, 0, canvasWidth, height);
    }

    const dataUrl = canvas.toDataURL();
    this.imageData = dataUrl;

    console.log("this.imageData ", this.imageData);
  }

  async processOCR() {
    console.log('this.imageData', this.imageData);

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

      if (responseObj.code == EKYCResponseType.TENCENT_OCR_NOIDCARD) {
        this.showNotFoundIDCardDialog(responseObj.code)
        return;
      }

      if (responseObj.code == EKYCResponseType.TENCENT_OCR_NOPASSPORT) {
        this.showNotFoundPassportDialog(responseObj.code)
        return;
      }

      if (responseObj.code == EKYCResponseType.OCR_NOT_PASS) {
        this.showOCRNotPassedDialog(responseObj.code)
        return;
      }

      if (responseObj.code == EKYCResponseType.IMAGE_BLUR) {
        this.showOCRNotPassedDialog(responseObj.code)
        return;
      }

      if (responseObj.code == EKYCResponseType.FACE_LIVENESS_NOT_PASS) {
        this.showFaceLivenessNotPassDialog(responseObj.code)
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

  showFaceLivenessNotPassDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Face liveness detected not pass");
  }

  showNotFoundPassportDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Passport was not detected");
  }

  showOCRNotPassedDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Identification failed. Make sure your photo is fully visible, glare free and not blurrred.");
  }

  showNotFoundIDCardDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "IDCard was not detected");
  }

  showDIDNotMatchedDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "Did not matched");
  }

  showErrorDialog(responseCode: string) {
    console.log("responseCode", responseCode);
    this.openDialog("Tips", "The certificate information cannot be recognized. Please collect the certificate photos again");
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

  back() {
    window.history.back();
  }

  submit() {
    this.processOCR();
  }

  async handleSelectFile(event: any) {
    if (!event.target.files[0]) {
      return;
    }
    this.closeCamera();
    this.canvas.hidden = true;
    this.isSelectImage = true;
    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = async event => {
      try {
        let result = event.target.result.toString();
        this.setSelectImage(result);
      } catch (error) {
        console.log(error);
      }
    }
  }

  setSelectImage(imageSrc: string) {
    let selectedImage = document.querySelector('#displaySelectImg') as HTMLImageElement;
    selectedImage.src = imageSrc;
    this.isShowCameraResult = true;

    let canvas = document.createElement("canvas");

    selectedImage.onload = () => {
      let selectedImageWidth = 1024;
      let selectedImageHeight = 0;
      this.drawCanvas(selectedImageWidth, selectedImageHeight, selectedImage.naturalWidth, selectedImage.naturalHeight, selectedImage, canvas);
    }
  }
}
