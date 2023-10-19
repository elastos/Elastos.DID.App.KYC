import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { DID, didAccessV2 } from "@elastosfoundation/elastos-connectivity-sdk-js";
import jwtDecode from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';
import { User } from '../model/user';
import { ConnectivityService } from './connectivity.service';
import { VerifiablePresentation } from '@elastosfoundation/did-js-sdk';
const AUTH_TOKEN_STORAGE_KEY = "didauthtoken";
const CONNECTOR_NAME = "connectorname";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private postAuthRoute: string = null;
  public authenticatedUser = new BehaviorSubject<User>(null);

  constructor(private jwtHelper: JwtHelperService, public router: Router, private connectivityService: ConnectivityService) {
    this.loadUser();

    didAccessV2.onRequestCredentialsResponse(async (context, presentation) => {
      console.log("onRequestCredentialsResponse2222", context, presentation);
      try {
        if (!presentation) {
          console.warn("Presentation error,", presentation);
        }

        await this.processSignInBackend(JSON.stringify(presentation.toJSON()));
      } catch (error) {
      }
    });
  }

  /**
   * Reloads authenticated user info from the stored JWT.
   */
  private loadUser() {
    const token = this.getAuthToken();
    if (token) {
      try {
        this.authenticatedUser.next(jwtDecode(token));
        console.log("Loaded user from auth token:", this.authenticatedUser.value);
      }
      catch (e) {
        console.error("Failed to decode existing auth token, is this an invalid format?", token);
        // Cleanup this unclear state.
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        this.authenticatedUser.next(null);
      }
    }
  }

  public isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  public getAuthToken(): string {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  }

  public getAuthUser(): User {
    return this.authenticatedUser.value;
  }

  public signedInDID(): string {
    if (!this.authenticatedUser.value)
      return null;

    return this.authenticatedUser.value.did;
  }

  /**
   * Saves the route to which user should be redirected after a successful authentication.
   */
  public setPostAuthRoute(postAuthRoute: string) {
    console.log(`Setting post auth route to ${postAuthRoute}`);
    this.postAuthRoute = postAuthRoute;
  }

  public async signIn(connectorName: string): Promise<string> {
    // Always disconnect from older WC session first to restart fresh, if needed
    // if (this.connectivityService.getEssentialsConnector().hasWalletConnectSession())
    // await this.connectivityService.getEssentialsConnector().disconnectWalletConnect();
    // await this.connectivityService.getConnector(connectorName);
    return new Promise(async (resolve, reject) => {
      try {
        this.prepareSignin();
        localStorage.setItem(CONNECTOR_NAME, connectorName);

        await this.connectivityService.setActiveConnector(connectorName);
        let presentation = await this.requestCredentialsV2();

        if (!presentation) {
          console.warn("Presentation error,", presentation);
          resolve('FAILED');
        }

        await this.processSignInBackend(JSON.stringify(presentation.toJSON()));
        resolve('SUCCESS');
      } catch (error) {
        resolve('FAILED');
      }
    });
  }

  async prepareSignin() {
    const connectorName = localStorage.getItem(CONNECTOR_NAME)
    if (connectorName && connectorName == 'essentials') {
      if (this.connectivityService.getEssentialsConnector().hasWalletConnectSession())
        await this.connectivityService.getEssentialsConnector().disconnectWalletConnect();
    }
  }

  private processSignInBackend(presentationString: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const token = await this.signInBackend(presentationString);
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
        this.authenticatedUser.next(jwtDecode(token));
        console.log("Sign in: setting user to:", this.authenticatedUser.value);

        if (this.postAuthRoute) {
          this.router.navigate([this.postAuthRoute]);
          this.postAuthRoute = null;
        }
        else {
          this.router.navigate(['home']);
        }

        resolve("SUCCESS");
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  private signInBackend(presentationString: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: presentationString
        });

        if (!response.ok) {
          console.error(response);
          reject(response);
        }

        const token = await response.json();
        resolve(token);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  public signOut() {
    console.log("Signing out");
    this.signOutWithoutNav();
    this.router.navigate(['home']);
  }

  public signOutWithoutNav() {
    console.log("Signing out without nav");
    this.authenticatedUser.next(null);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(CONNECTOR_NAME);
  }

  private requestCredentialsV1(): Promise<VerifiablePresentation> {
    return new Promise(async (resolve, reject) => {
      const didAccess = new DID.DIDAccess();
      let presentation;

      console.log("Trying to sign in using the connectivity SDK");
      try {
        presentation = await didAccess.requestCredentials({
          claims: [
            // optional email to automatically fill passbase form for convenience
            DID.standardEmailClaim("Used during the KYC process", false)
          ]
        });
        resolve(presentation);
      } catch (e) {
        // Possible exception while using wallet connect (i.e. not an identity wallet)
        // Kill the wallet connect session
        console.warn("Error while getting credentials", e);
        resolve(null);
      }
    });
  }

  private requestCredentialsV2(): Promise<VerifiablePresentation> {
    return new Promise(async (resolve, reject) => {
      didAccessV2.onRequestCredentialsResponse((context, presentation) => {
        console.log("onRequestCredentialsResponse", context, presentation);
        resolve(presentation);
      });
      console.log('didAccessV2.requestCredentials');
      await didAccessV2.requestCredentials({
        claims: [
          // optional email to automatically fill passbase form for convenience
          DID.standardEmailClaim("Used during the KYC process", false)
        ]
      });
    });
  }
}