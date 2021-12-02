import { Injectable } from '@angular/core';

export enum ThemeType {
  LIGHT = "light",
  DARK = "dark"
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private theme: ThemeType;

  constructor() {
    this.setTheme(ThemeType.DARK);
  }

  public setTheme(theme: ThemeType) {
    this.theme = theme;

    console.log(`Theme set to ${theme}`);

    document.body.style.backgroundColor = theme === ThemeType.DARK ? 'black' : 'white';
    document.body.style.color = theme === ThemeType.DARK ? 'white' : 'black';
  }

  public get isDarkMode(): boolean {
    return this.theme === ThemeType.DARK;
  }
}