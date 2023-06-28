import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PromoteService } from 'src/app/services/promote.service';

@Component({
  selector: 'Promote',
  templateUrl: './promote.component.html',
  styleUrls: ['./promote.component.scss']
})
export class PromoteComponent {
  public dialogTitle: string;
  public dialogContent: string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<PromoteComponent>,
    private promoteService: PromoteService
  ) {
  }

  ngOnInit(): void {
    this.dialogTitle = this.promoteService.getPromoteTitle();
    this.dialogContent = this.promoteService.getPromoteContent();
  }

  closeDialog() {
    this.dialogRef.close("close");
  }
}
