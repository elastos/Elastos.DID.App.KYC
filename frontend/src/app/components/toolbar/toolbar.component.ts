import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'Toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    authService.signedInDID();
  }

  public signOut() {
    this.authService.signOut();
  }
}
