import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RestaurantComponent } from './restaurant/restaurant.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'restaurant/:restaurant', //:restaurant is dynamic here
    component: RestaurantComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
