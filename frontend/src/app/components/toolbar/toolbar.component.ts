import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'Toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  constructor(public authService: AuthService) {
    authService.signedInDID();
  }

  public signOut() {
    this.authService.signOut();
  }
}
