
/**
 * Activation guard that checks if a auth token is passed as part of a transfer between two browsers.
 * In such case, a re-auth based on this token is done.
 */
/* @Injectable({
  providedIn: 'root'
})
export class AuthTransferService implements CanActivate {
  constructor(public auth: AuthService, public router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.auth.isAuthenticated()) {
      this.auth.setPostAuthRoute(state.url);
      this.router.navigate(['signin']);
      return false;
    }
    return true;
  }
} */