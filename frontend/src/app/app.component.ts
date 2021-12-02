import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConnectivityService } from './services/connectivity.service';
import { ThemeService, ThemeType } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    public connectorService: ConnectivityService, // init
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(queryParams => {
      console.log("queryParams", queryParams)
      if ("theme" in queryParams) {
        this.themeService.setTheme(queryParams["theme"] === "dark" ? ThemeType.DARK : ThemeType.LIGHT);
      }
    })
  }
}
