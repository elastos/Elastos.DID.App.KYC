import { Component, OnInit } from '@angular/core';
import { ConnectivityService } from './services/connectivity.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    public connectorService: ConnectivityService // init
  ) { }

  ngOnInit() {
    let qParams = window.location.href.split('&');
    document.body.style.backgroundColor = qParams.includes('theme=dark')
      ? 'black'
      : 'white';

    document.body.style.color = qParams.includes('theme=dark')
      ? 'white'
      : 'black';
  }
}
