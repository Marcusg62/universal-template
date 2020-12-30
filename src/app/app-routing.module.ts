import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountComponent } from './account/account.component';
import { HomeComponent } from './home/home.component';
import { GroupsResolver } from './resolvers/groups.resolver';
import { MenuResolver } from './resolvers/menu.resolver';
import { ModifierResolver } from './resolvers/modifier.resolver';
import { RestaurantResolver } from './resolvers/restaurant.resolver';
import { RestaurantComponent } from './restaurant/restaurant.component';
import { CheckoutComponent } from './restaurants/checkout/checkout.component';
import { OrderStatusComponent } from './restaurants/order-status/order-status.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'restaurant', redirectTo: '' },

  {

    path: 'restaurant/:restaurant', //:restaurant is dynamic here
    component: RestaurantComponent,
    resolve: {
      // restaurant: RestaurantResolver,
      // groups: GroupsResolver,
      // menuItems: MenuResolver

      // modifiers: ModifierResolver,
    },
  },
  { path: 'restaurant/:restaurant/checkout', component: CheckoutComponent },
  { path: 'account', component: AccountComponent },
  { path: 'account/orderstatus', redirectTo: 'account' },
  { path: 'account/orderstatus/:orderId', component: OrderStatusComponent }


];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled',
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
