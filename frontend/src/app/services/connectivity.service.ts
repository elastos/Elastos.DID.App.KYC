import { Injectable } from '@angular/core';
import { connectivity } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { EssentialsConnector } from "@elastosfoundation/essentials-connector-client-browser";
// import { DIDWebConnector } from '@trinitytech/did-web-connector-client-browser';
import { MydentityConnector } from '@trinitytech/mydentity-connector-browser';

const CONNECTOR_NAME = "connectorname";

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private myDentityConnector: MydentityConnector = null;
  private essentialsConnector: EssentialsConnector = null;

  constructor() {
    this.essentialsConnector = new EssentialsConnector();
    connectivity.registerConnector(this.essentialsConnector);
    console.log('essentialsConnector', this.essentialsConnector.name);

    this.myDentityConnector = new MydentityConnector({
      webServiceEndpoint: "https://staging.ownmydentity.com",
      webServiceAPIEndpoint: "https://staging-api.ownmydentity.com"
    })
    connectivity.registerConnector(this.myDentityConnector);
    connectivity.setApplicationDID('did:elastos:iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK');
    console.log('myDentityConnector.name', this.myDentityConnector.name);
  }

  public getEssentialsConnector(): EssentialsConnector {
    return this.essentialsConnector;
  }

  getMyDentityConnector(): MydentityConnector {
    return this.myDentityConnector;
  }

  async setActiveConnector(connectorName: string) {
    await connectivity.setActiveConnector(connectorName);
    const activeConnector = connectivity.getActiveConnector();
    console.log('activeConnector.name', activeConnector.name);
  }

  // async getConnector(): Promise<EssentialsConnector | MydentityConnector> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       if (!this.connector) {
  //         let connectorType = ''
  //         if (!connectorName) {
  //           connectorType = localStorage.getItem(CONNECTOR_NAME);
  //         } else {
  //           connectorType = connectorName;
  //         }

  //         switch (connectorType) {
  //           case 'DWS':
  //             this.connector = await this.createDIDWebConnector();
  //             break;

  //           case 'Essential':
  //           default:
  //             this.connector = await this.createEssentialConnector();
  //             break;
  //         }
  //       }
  //       console.log('this.connector.name', this.connector.name);
  //       resolve(this.connector);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   });
  // }

  // createEssentialConnector(): Promise<EssentialsConnector> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       console.log('createEssentialConnector');
  //       const connector = new EssentialsConnector();
  //       await connectivity.registerConnector(connector);
  //       resolve(connector);
  //     } catch (error) {
  //       console.log('error', error);
  //     }
  //   });
  // }

  // async createDIDWebConnector(): Promise<MydentityConnector> {
  //   // connectivity.setApplicationDID("did:elastos:inDxwJsTKBbGkeSJZ5NPA6p8mb3F6i7ytA");
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       console.log('createDIDWebConnector');
  //       const connector = new MydentityConnector();
  //       await connectivity.registerConnector(connector);
  //       resolve(connector);
  //     } catch (error) {
  //       console.log('error', error);
  //     }
  //   });
  // }
}