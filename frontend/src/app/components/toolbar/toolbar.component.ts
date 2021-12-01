import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'Toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
  public isUserLoggedIn =
    this.authService.getAuthUser() !== null ? true : false;
  constructor(public authService: AuthService, public router: Router) {
    authService.signedInDID();
  }

  public signIn() {
    // let qParams = window.location.href.split('?');
    // let themeValue = qParams.includes('theme=dark') ? 'dark' : 'light';
    // this.router.navigate(['login'], { queryParams: { theme: themeValue } });
    this.router.navigate(['login']);
  }

  public signOut() {
    this.authService.signOut();
  }
}
