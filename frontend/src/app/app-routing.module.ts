import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VerifiedComponent } from './pages/verified/verified.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { VerifyComponent } from './pages/verify/verify.component';
import { AuthGuardService } from './services/auth-guard.service';

//  canActivate: [AuthGuardService]

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'verify', component: VerifyComponent },
  { path: 'verified', component: VerifiedComponent },
  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
