import { Component, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from '@angular/router';
import { JSONObject, VerifiableCredential } from '@elastosfoundation/did-js-sdk/typings';
import moment from 'moment';
import { OverallStatus } from 'src/app/model/overallstatus';
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
    setTimeout(() => {
      this.verificationStatus = CacheService.getVerificationStatus(this.authService.signedInDID());
      if (this.verificationStatus) {
        this.availableCredentials = this.verificationStatus.credentials;
      }
      this.prepareOverallStatus();

      this.fetchingVerificationStatus = false
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
      case "dateOfBirth": return "Data of birth"
      case "passportNumber": return "Passport Number";
      case "passportNumberHash": return "Passport Number Hash";
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

  /**
   * Send the credential to the identity wallet for import
   */
  public importCredentials(credentials: VerifiableCredential[]) {
    this.isProcess["credentials"] = true;
    this.credentialsService.importCredentials(credentials)
      .then(() => {
        this.isProcess["credentials"] = false;
      })
      .catch(err => {
        this.isProcess["credentials"] = false;
      });
  }

  public prepareOverallStatus() {
    if (!this.verificationStatus || !this.verificationStatus.credentials || this.verificationStatus.credentials.length == 0) {
      this.overallVerificationStatus = OverallStatus.UNVERIFIED;
      return;
    }
    this.overallVerificationStatus = OverallStatus.VERIFIED;
  }

}
