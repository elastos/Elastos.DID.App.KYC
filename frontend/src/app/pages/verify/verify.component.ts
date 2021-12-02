import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import Passbase from '@passbase/button';
import { AuthService } from 'src/app/services/auth.service';
import { CredentialsService } from 'src/app/services/credentials.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VerifyComponent {
  @ViewChild('passbaseButton') passbaseButton: ElementRef;

  public verificationInProgress = false;
  public verificationCompleted = false;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private authService: AuthService,
    private credentialsService: CredentialsService,
    private themeService: ThemeService,
    private router: Router
  ) { }

  async ngAfterViewInit() {
    let passbaseMetadata = await this.credentialsService.fetchUserPassbaseMetadata();

    console.log("this.themeService.isDarkMode", this.themeService.isDarkMode)
    Passbase.renderButton(
      this.passbaseButton.nativeElement,
      process.env.NG_APP_PASSBASE_PUBLIC_API_KEY,
      {
        onStart: () => {
          console.log('Passbase onstart');
          this.verificationInProgress = true;
        },
        onError: (error, context) => {
          console.log('Passbase onerror', error);
          this.verificationInProgress = false;
        },
        // onSubmitted: received at the very end of the verification steps before clicking "finish"
        onSubmitted: (identityAccessKey) => {
          console.log('Passbase onSubmitted', identityAccessKey);

          this.credentialsService.savePassbaseUUID(identityAccessKey);
        },
        // onFinish: received at the very end of the verification steps after clicking "finish"
        onFinish: (identityAccessKey) => {
          console.log('Passbase onFinish', identityAccessKey);

          this.verificationInProgress = false;
          this.verificationCompleted = true;
        },
        metaData: passbaseMetadata,
        prefillAttributes: {
          email: this.authService.getAuthUser().email, // pre-fill user's email for convenience, if provided
        },
        theme: {
          darkMode: this.themeService.isDarkMode // TODO: not working (remains white) - passbase team is checking this
        }
      }
    );
  }
}
