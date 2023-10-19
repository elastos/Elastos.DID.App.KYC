import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserModule } from '@angular/platform-browser';
import { CloudsComponent } from './clouds/clouds.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { AppRoutingModule } from './../app-routing.module';
import { MatDialogModule } from '@angular/material/dialog';
import { PromoteComponent } from './promote/promote.component';
import { ConnectorSelectComponent } from './connectorselect/connectorselect.component';

@NgModule({
  declarations: [
    ToolbarComponent,
    CloudsComponent,
    PromoteComponent,
    ConnectorSelectComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
    MatDialogModule
  ],
  exports: [
    ToolbarComponent,
    CloudsComponent,
    PromoteComponent,
    ConnectorSelectComponent
  ],
  providers: [],
})
export class ComponentsModule { }
