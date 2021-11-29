import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserModule } from '@angular/platform-browser';
import { CloudsComponent } from './clouds/clouds.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { AppRoutingModule } from './../app-routing.module';

@NgModule({
  declarations: [
    ToolbarComponent,
    CloudsComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule
  ],
  exports: [
    ToolbarComponent,
    CloudsComponent
  ],
  providers: [],
})
export class ComponentsModule { }
