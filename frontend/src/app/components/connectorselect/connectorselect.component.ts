import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'connectorselect',
  templateUrl: './connectorselect.component.html',
  styleUrls: ['./connectorselect.component.scss']
})
export class ConnectorSelectComponent {
  public dialogTitle: string;
  public dialogContent: string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ConnectorSelectComponent>,
  ) {
  }

  ngOnInit(): void {
    this.dialogTitle = "Select Connector";
  }

  selectConnectorVersion(connector: string) {
    this.dialogRef.close(connector);
  }
}
