import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { VerifyComponent } from './pages/verify/verify.component';
import { VerifySuccessComponent } from './pages/verifysuccess/verifysuccess.component';
import { AuthGuardService } from './services/auth-guard.service';
import { TencentEkycComponent } from './pages/tencentekyc/tencentekyc.component';
import { GuideComponent } from './pages/guide/guide.component';

//  canActivate: [AuthGuardService]

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService] },
  { path: 'verify', component: VerifyComponent, canActivate: [AuthGuardService] },
  { path: 'verifysuccess', component: VerifySuccessComponent, canActivate: [AuthGuardService] },
  { path: 'tencentekyc', component: TencentEkycComponent, canActivate: [AuthGuardService] },
  { path: 'guide', component: GuideComponent, canActivate: [AuthGuardService] },

  { path: '**', redirectTo: '/', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
