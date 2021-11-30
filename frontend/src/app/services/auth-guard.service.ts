import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  constructor(public auth: AuthService, public router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (!this.auth.isAuthenticated()) {
      this.auth.setPostAuthRoute(state.url);

      let qParams = window.location.href.split('?');
      let themeValue = qParams.includes('theme=dark') ? 'dark' : 'light';

      this.router.navigate(['login'], { queryParams: { theme: themeValue } });
      return false;
    }
    return true;
  }
}
