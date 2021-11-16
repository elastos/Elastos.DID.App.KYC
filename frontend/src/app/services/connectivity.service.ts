import { Injectable } from '@angular/core';
import { connectivity } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { EssentialsConnector } from "@elastosfoundation/essentials-connector-client-browser";

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private essentialsConnector: EssentialsConnector = null;

  constructor() {
    this.essentialsConnector = new EssentialsConnector();
    connectivity.registerConnector(this.essentialsConnector);
  }

  public getEssentialsConnector(): EssentialsConnector {
    return this.essentialsConnector;
  }
}