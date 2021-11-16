import { Component } from '@angular/core';
import { connectivity } from "@elastosfoundation/elastos-connectivity-sdk-js";
import { AuthService } from 'src/app/services/auth.service';
import { ConnectivityService } from 'src/app/services/connectivity.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public signingIn = false;

  constructor(
    private authService: AuthService,
    private connectivityService: ConnectivityService
  ) { }

  public async signIn() {
    this.signingIn = true;
    await this.authService.signIn();
    this.signingIn = false;
  }

  public canDisconnectWalletConnectEssentials(): boolean {
    return this.isUsingEssentialsConnector() && this.connectivityService.getEssentialsConnector().hasWalletConnectSession();
  }

  private isUsingEssentialsConnector(): boolean {
    return connectivity.getActiveConnector() && this.connectivityService.getEssentialsConnector() && connectivity.getActiveConnector().name === this.connectivityService.getEssentialsConnector().name;
  }

  public disconnectEssentials() {
    this.connectivityService.getEssentialsConnector().disconnectWalletConnect();
    this.authService.signOut();
  }
}
