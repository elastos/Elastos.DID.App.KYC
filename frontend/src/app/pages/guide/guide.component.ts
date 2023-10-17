import { Component, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class GuideComponent {
  private docType: string;
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(queryParams => {
      if ("docType" in queryParams) {
        this.docType = queryParams["docType"];
      }
    })
  }

  back() {
    window.history.back();
  }

  startEkyc() {
    setTimeout(() => {
      this.router.navigate(['/tencentekyc'], { queryParams: { docType: this.docType } });
    }, 10);
  }
}
