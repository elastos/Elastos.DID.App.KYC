import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'Toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
  public isUserLoggedIn = this.authService.isAuthenticated();

  constructor(public authService: AuthService, public router: Router, private route: ActivatedRoute) {
    this.authService.authenticatedUser.subscribe(user => {
      this.isUserLoggedIn = user !== null;
    });
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

  public currentlyOnSignInPage(): boolean {
    return this.route.snapshot.routeConfig.path === "login";
  }
}
