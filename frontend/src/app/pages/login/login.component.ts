import { Component } from '@angular/core';
import { connectivity } from "@elastosfoundation/elastos-connectivity-sdk-js";
import { AuthService } from 'src/app/services/auth.service';
import { ConnectivityService } from 'src/app/services/connectivity.service';
import { PromoteService } from 'src/app/services/promote.service';
import { MatDialog } from '@angular/material/dialog';
import { PromoteComponent } from 'src/app/components/promote/promote.component';
import { ConnectorSelectComponent } from 'src/app/components/connectorselect/connectorselect.component';
import { SignStatus } from 'src/app/model/signstatus';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public signingIn = false;
  public isShowDisconnectButton = false;

  constructor(
    private authService: AuthService,
    private connectivityService: ConnectivityService,
    private promoteService: PromoteService,
    private dialog: MatDialog
  ) {
    this.authService.signinStatus.subscribe(signStatus => {

      switch (signStatus) {
        case SignStatus.PREPARE:
        case SignStatus.PROCESSING:
          this.signingIn = true;
          break;
        case SignStatus.SUCCESS:
          this.signingIn = false;
          break;

        case SignStatus.BACKEND_ERROR:
        case SignStatus.ERROR:
          this.openDialog("Tips", "Unable to sign in now, please try again later");
          break;
      }

    })
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.isShowDisconnectButton = true;
    } else {
      this.isShowDisconnectButton = false;
    }

    const r = new URL(window.location.href);
    if (new URLSearchParams(r.search).get("rid")) {
      this.signingIn = true;
    }
  }

  public async signIn() {
    this.signingIn = true;
    if ("elastos" in window) {
      console.log("elastos is in window");
      await this.authService.signIn('essentials').then((status: string) => {
        if (status != "SUCCESS") {
          //show error dialog
          this.openDialog("Tips", "Unable to sign in now, please try again later")
          return;
        }
        this.signingIn = false;
        this.isShowDisconnectButton = true;
      });
    } else {
      console.log("elastos is not in window");
      this.showConnectorSelectDialog().then(async (connectorName: string) => {
        // await this.authService.signIn(connector).then((status: string) => {
        await this.authService.signIn(connectorName).then((status: string) => {
          if (status != "SUCCESS") {
            //show error dialog
            this.openDialog("Tips", "Unable to sign in now, please try again later")
            return;
          }
          this.signingIn = false;
          this.isShowDisconnectButton = true;
        }).catch((error) => {
          console.error(error);
        });
      });
    }
  }

  public canDisconnectWalletConnectEssentials(): boolean {
    return this.isUsingEssentialsConnector() && this.connectivityService.getEssentialsConnector().hasWalletConnectSession();
  }

  private isUsingEssentialsConnector(): boolean {
    return connectivity.getActiveConnector() && this.connectivityService.getEssentialsConnector() && connectivity.getActiveConnector().name === this.connectivityService.getEssentialsConnector().name;
  }

  public disconnectEssentials() {
    console.log("disconnectEssentials");
    this.connectivityService.getEssentialsConnector().disconnectWalletConnect();
    this.authService.signOut();
  }

  public disconnectEssentialsWithoutNav() {
    this.connectivityService.getEssentialsConnector().disconnectWalletConnect();
    this.authService.signOutWithoutNav();
  }

  // public canDisconnectWalletConnectEssentials(): boolean {
  //   return this.isUsingConnector() && this.connectivityService.getEssentialsConnector().hasWalletConnectSession();
  // }

  // private isUsingConnector(): boolean {
  //   return connectivity.getActiveConnector() && this.connectivityService.getConnector() && connectivity.getActiveConnector().name === this.connectivityService.getConnector().name;
  // }

  // public disconnectEssentials() {
  //   console.log("disconnectEssentials");
  //   this.connectivityService.getEssentialsConnector().disconnectWalletConnect();
  //   this.authService.signOut();
  // }

  // public disconnectEssentialsWithoutNav() {
  //   this.connectivityService.getEssentialsConnector().disconnectWalletConnect();
  //   this.authService.signOutWithoutNav();
  // }


  openDialog(title: string, content: string) {
    this.promoteService.setPromoteTitle(title);
    this.promoteService.setPromoteContent(content);
    const dialogRef = this.dialog.open(PromoteComponent, { role: "alertdialog", disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      if (!result)
        return;

      // if (this.canDisconnectWalletConnectEssentials())
      //   this.disconnectEssentialsWithoutNav();
      this.authService.signOutWithoutNav();
      this.signingIn = false;
      this.isShowDisconnectButton = false;
    });
  }

  showConnectorSelectDialog(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const dialogRef = this.dialog.open(ConnectorSelectComponent, { role: "alertdialog", disableClose: true });
      dialogRef.afterClosed().subscribe(result => {
        console.log('result', result);
        if (!result)
          return;
        resolve(result);
      });
    });
  }
}
