import { Component, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from '@angular/router';
import { JSONObject, VerifiableCredential } from '@elastosfoundation/did-js-sdk/typings';
import moment from 'moment';
import { OverallStatus } from 'src/app/model/overallstatus';
import { PassbaseVerificationStatus } from 'src/app/model/passbase/passbaseverificationstatus';
import { VerificationStatus } from 'src/app/model/verificationstatus';
import { CacheService } from 'src/app/services/cache.service';
import { CredentialsService } from 'src/app/services/credentials.service';
import { ThemeService } from 'src/app/services/theme.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class DashboardComponent {
  public fetchingVerificationStatus = true;
  public verificationStatus: VerificationStatus;
  public overallVerificationStatus: OverallStatus; // Overall status string for all KYC providers
  public availableCredentials: VerifiableCredential[] = [];
  public isDarkTheme; // TODO: NOT LIKE THIS, REWORK
  public isProcess: { [key: string]: boolean } = {};

  constructor(
    private _bottomSheet: MatBottomSheet,
    private _snackBar: MatSnackBar,
    private credentialsService: CredentialsService,
    private themeService: ThemeService,
    private router: Router,
    private authService: AuthService) {
    this.isDarkTheme = this.themeService.isDarkMode;
  }

  ngAfterViewInit() {
    // Fetch status
    // this.verificationStatus = await this.credentialsService.fetchUserVerificationStatus();
    setTimeout(() => {
      this.verificationStatus = CacheService.getVerificationStatus(this.authService.signedInDID());
      console.log("Verification status: ", this.verificationStatus);
      if (this.verificationStatus) {
        this.availableCredentials = this.verificationStatus.credentials;
      }
      this.prepareOverallStatus();

      this.fetchingVerificationStatus = false
      console.log("fetchingVerificationStatus status: ", this.fetchingVerificationStatus);
      //this.verificationStatus = VerificationStatus.VERIFIED
      //this.verificationStatus = VerificationStatus.PENDING; // DEBUG
    }, 500);
  }

  public getCredentialIcon(credential: VerifiableCredential) {
    // Credential should normally implement the DisplayableCredential interface, so we find the
    // icon url there
    let credProps = credential.getSubject().getProperties();
    if ("displayable" in credProps) {
      return (credProps["displayable"] as JSONObject)["icon"];
    }

    return null; // No icon found
  }

  public getDisplayableCredentialName(credential: VerifiableCredential): string {
    // Credential should normally implement the DisplayableCredential interface, so we find the
    // icon url there
    let credProps = credential.getSubject().getProperties();
    if ("displayable" in credProps) {
      return (credProps["displayable"] as JSONObject)["title"] as string;
    }

    // Fallback
    if (credential.getType().indexOf("NameCredential") >= 0)
      return "Full name";
    else if (credential.getType().indexOf("NationalityCredential") >= 0)
      return "Nationality";
    else if (credential.getType().indexOf("GenderCredential") >= 0)
      return "Gender";
    else
      return "Unknown credential type";
  }

  public getDisplayableCredentialPropertyKey(key: string): string {
    switch (key) {
      case "firstNames": return "First names";
      case "lastName": return "Last name";
      case "nationality": return "Nationality";
      case "gender": return "Gender";
      case "mrtdVerified": return "MRTD Verified";
      default: return key;
    }
  }

  public getCredentialProperties(credential: VerifiableCredential): { key: string, value: string }[] {
    let props = credential.getSubject().getProperties();
    // Exclude the DisplayableCredential special field
    return Object.keys(props).filter(k => k !== "displayable" && k !== "mrtdVerified").map(k => {
      return { key: k, value: props[k] as string };
    });
  }

  public getDisplayableCreationDate(credential: VerifiableCredential): string {
    return moment(credential.getIssuanceDate()).format("YYYY-MM-DD");
  }

  /**
   * Send the credential to the identity wallet for import
   */
  public importCredential(credential: VerifiableCredential) {
    this.isProcess[credential.getId().getFragment()] = true;
    this.credentialsService.importCredential(credential)
      .then(() => {
        this.isProcess[credential.getId().getFragment()] = false;
      })
      .catch(err => {
        this.isProcess[credential.getId().getFragment()] = false;
      });
  }

  public prepareOverallStatus() {
    if (this.verificationStatus) {
      // For now, only passbase is supported. So the passbase status is also the overall status.
      switch (this.verificationStatus.passbase.status) {
        case PassbaseVerificationStatus.APPROVED:
          this.overallVerificationStatus = OverallStatus.VERIFIED;
          break;
        case PassbaseVerificationStatus.PENDING:
        case PassbaseVerificationStatus.PROCESSING:
          this.overallVerificationStatus = OverallStatus.PENDING;
          break;
        case PassbaseVerificationStatus.DECLINED:
          this.overallVerificationStatus = OverallStatus.REJECTED;
          break;
        case PassbaseVerificationStatus.UNKNOWN:
          this.overallVerificationStatus = OverallStatus.UNVERIFIED;
          break;
      }
    }
    else {
      this.overallVerificationStatus = OverallStatus.UNVERIFIED;
    }
  }
}
