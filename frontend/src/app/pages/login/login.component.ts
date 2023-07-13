import { Component } from '@angular/core';
import { connectivity } from "@elastosfoundation/elastos-connectivity-sdk-js";
import { AuthService } from 'src/app/services/auth.service';
import { ConnectivityService } from 'src/app/services/connectivity.service';
import { PromoteService } from 'src/app/services/promote.service';
import { MatDialog } from '@angular/material/dialog';
import { PromoteComponent } from 'src/app/components/promote/promote.component';

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
  ) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.isShowDisconnectButton = true;
    } else {
      this.isShowDisconnectButton = false;
    }
  }

  public async signIn() {
    this.signingIn = true;
    await this.authService.signIn().then((status: string) => {
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
}
