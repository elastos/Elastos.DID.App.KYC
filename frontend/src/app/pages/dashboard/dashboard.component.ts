import { Component, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from '@angular/router';
import { JSONObject, VerifiableCredential } from '@elastosfoundation/did-js-sdk/typings';
import { VerificationStatus } from 'src/app/model/verificationstatus';
import { CredentialsService } from 'src/app/services/credentials.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class DashboardComponent {
  public fetchingVerificationStatus = true;
  public verificationStatus: VerificationStatus;
  public fetchingCredentials = true;
  public availableCredentials: VerifiableCredential[] = [];

  constructor(
    private _bottomSheet: MatBottomSheet,
    private _snackBar: MatSnackBar,
    private credentialsService: CredentialsService,
    private router: Router) {
  }

  async ngAfterViewInit() {
    // Fetch status
    this.verificationStatus = await this.credentialsService.fetchUserVerificationStatus();
    this.fetchingVerificationStatus = false

    //this.verificationStatus = VerificationStatus.VERIFIED
    //this.verificationStatus = VerificationStatus.UNVERIFIED; // DEBUG

    // Fetch user's credentials
    this.availableCredentials = await this.credentialsService.fetchUserCredentials();
    this.fetchingCredentials = false;

    // If we have verifiable credentials, force status to "verified". The first time when both
    // "status" and "credentials" apis are called at the same time, the server status is "pending"
    // because credentials are not fetched yet. Can be improved
    if (this.availableCredentials.length > 0)
      this.verificationStatus = VerificationStatus.VERIFIED;
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
      default: return key;
    }
  }

  public getCredentialProperties(credential: VerifiableCredential): { key: string, value: string }[] {
    let props = credential.getSubject().getProperties();
    // Exclude the DisplayableCredential special field
    return Object.keys(props).filter(k => k !== "displayable").map(k => {
      return { key: k, value: props[k] as string };
    });
  }

  /**
   * Send the credential to the identity wallet for import
   */
  public importCredential(credential: VerifiableCredential) {
    this.credentialsService.importCredential(credential);
  }
}
