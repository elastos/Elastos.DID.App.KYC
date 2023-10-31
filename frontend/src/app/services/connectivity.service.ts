import { Injectable } from '@angular/core';
import { connectivity } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { EssentialsConnector } from "@elastosfoundation/essentials-connector-client-browser";
import { MydentityConnector } from '@trinitytech/mydentity-connector-browser';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private myDentityConnector: MydentityConnector = null;
  private essentialsConnector: EssentialsConnector = null;

  constructor() {
    this.essentialsConnector = new EssentialsConnector();
    connectivity.registerConnector(this.essentialsConnector);

    this.myDentityConnector = new MydentityConnector({
      webServiceEndpoint: "https://staging.ownmydentity.com",
      webServiceAPIEndpoint: "https://staging-api.ownmydentity.com"
    })
    connectivity.registerConnector(this.myDentityConnector);
    connectivity.setApplicationDID('did:elastos:iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK');
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

    console.log('ActiveConnector is', activeConnector.name);
  }
}