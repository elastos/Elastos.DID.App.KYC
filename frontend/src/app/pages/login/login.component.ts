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

  constructor(
    private authService: AuthService,
    private connectivityService: ConnectivityService,
    private promoteService: PromoteService,
    private dialog: MatDialog
  ) { }

  public async signIn() {
    this.signingIn = true;
    await this.authService.signIn().then((status: string) => {
      if (status != "SUCCESS") {
        //show error dialog
        this.openDialog("Tips", "Unable to sign in now, please try again later")
        return;
      }
      this.signingIn = false;
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

      this.disconnectEssentialsWithoutNav();
      this.signingIn = false;
    });
  }
}
