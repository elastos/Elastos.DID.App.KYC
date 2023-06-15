/*
 * Copyright (c) 2021 Elastos Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VerifiableCredential } from '@elastosfoundation/did-js-sdk';
import { DID as ConnDID } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { RawVerificationStatus, VerificationStatus } from '../model/verificationstatus';
import { AuthService } from './auth.service';
import { PassbaseVerificationStatus } from '../model/passbase/passbaseverificationstatus';


@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  constructor(private authService: AuthService, private _snackBar: MatSnackBar) { }

  /**
   * Attach a passbase UUID to a user's DID in the backend
   */
  public async savePassbaseUUID(passbaseUUID: string) {
    try {
      let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/passbase/uuid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": this.authService.getAuthToken()
        },
        body: JSON.stringify({ passbaseUUID })
      });
      if (response.ok) {
        console.log("Passbase UUID saved");
      } else {
        console.error("Failed to save passbase UUID!", response.statusText);
      }
    } catch (error) {
      console.error("Failed to save passbase UUID!", error);
    }
  }

  public async fetchUserPassbaseMetadata(): Promise<string> {
    try {
      let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/passbase/metadata`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "token": this.authService.getAuthToken()
        }
      });
      if (response.ok) {
        let metadata = await response.json() as string;
        console.log("Received passbase metadata", metadata);
        return metadata;
      } else {
        console.error(response.statusText);
        return null;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async fetchEkycCredential(transactionId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!transactionId) {
        console.error("transactionId is null");
      }

      const transactionObj = {
        "transactionId": transactionId
      }

      try {
        let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/ekyc/ekyccredential`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.authService.getAuthToken()
          },
          body: JSON.stringify(transactionObj)
        });

        if (!response.ok) {
          console.error("response error", response);
          reject(response);
          return;
        }

        let result = await response.json()
        resolve(result);
      } catch (error) {
        console.error(error);
      }
    });
  }

  public async fetchUserVerificationStatus(): Promise<VerificationStatus> {
    try {
      let response = await fetch(`${process.env.NG_APP_API_URL}/api/v1/user/verificationstatus`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "token": this.authService.getAuthToken()
        }
      });
      if (response.ok) {
        let status = await response.json() as RawVerificationStatus;
        console.log("Received verification status", status);

        return {
          passbase: status.passbase,
          credentials: status.credentials.map(c => VerifiableCredential.parse(c))
        }
      } else {
        console.error(response.statusText);
        return null;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async importCredential(credential: VerifiableCredential) {
    let didAccess = new ConnDID.DIDAccess();
    let importedCredentials = await didAccess.importCredentials([credential]);

    if (importedCredentials.length == 1) {
      this._snackBar.open("Credential successfully imported to your wallet!", "Cool", {
        duration: 3000
      });
    }
  }
}
