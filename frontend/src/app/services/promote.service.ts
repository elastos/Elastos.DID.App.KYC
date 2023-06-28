import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PromoteService {
  public promoteTitle: string;
  public promoteContent: string;
  constructor() {
  }

  public setPromoteTitle(title: string) {
    this.promoteTitle = title;
  }

  public setPromoteContent(content: string) {
    this.promoteContent = content;
  }

  public getPromoteTitle(): string {
    return this.promoteTitle;
  }

  public getPromoteContent(): string {
    return this.promoteContent;
  }
}