import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { GroupsResolver } from './resolvers/groups.resolver';
import { MenuResolver } from './resolvers/menu.resolver';
import { ModifierResolver } from './resolvers/modifier.resolver';
import { RestaurantResolver } from './resolvers/restaurant.resolver';
import { RestaurantComponent } from './restaurant/restaurant.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'restaurant/:restaurant', //:restaurant is dynamic here
    component: RestaurantComponent,
    resolve: {
      restaurant: RestaurantResolver,
      // groups: GroupsResolver,
      // menuItems: MenuResolver

      // modifiers: ModifierResolver,
    }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
