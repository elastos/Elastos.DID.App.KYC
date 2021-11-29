import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import Passbase from "@passbase/button";
import { AuthService } from 'src/app/services/auth.service';
import { CredentialsService } from 'src/app/services/credentials.service';

@Component({
  selector: 'app-verified',
  templateUrl: './verified.component.html',
  styleUrls: ['./verified.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VerifiedComponent implements OnInit {
  @ViewChild('passbaseButton') passbaseButton: ElementRef;

  public verificationInProgress = false;
  public verificationCompleted = false;
  public isDarkTheme = false

  constructor(
    private _bottomSheet: MatBottomSheet,
    private authService: AuthService,
    private credentialsService: CredentialsService,
    private router: Router) {
  }

  ngOnInit() {

    let themeColor = document.body.style.backgroundColor
    this.isDarkTheme = themeColor === 'black' ? true : false;
  }
}
