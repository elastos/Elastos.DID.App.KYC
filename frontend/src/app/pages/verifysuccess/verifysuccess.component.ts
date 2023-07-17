import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-verifysuccess',
  templateUrl: './verifysuccess.component.html',
  styleUrls: ['./verifysuccess.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VerifySuccessComponent {
  constructor(
    private _bottomSheet: MatBottomSheet,
  ) { }

  ngOnInit() {
    window.history.replaceState({}, '', '/dashboard');
    // const pathName = window.location.pathname;
    // if (pathName == "/verifysuccess")
    //   window.location.replace("/home")
  }

  //pop up aliyun ocr window
  openBottomSheet(): void {
    this._bottomSheet.open(VerifySuccessComponent);
  }

  public backToDashboard() {
    // this.router.navigate(['/dashboard']);
    window.location.replace("/dashboard");
  }
}
