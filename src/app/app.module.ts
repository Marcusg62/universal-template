import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';


import { environment } from '../environments/environment';


import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavComponent } from './nav/nav.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDayjsDateModule, MAT_DAYJS_DATE_ADAPTER_OPTIONS } from '@tabuckner/material-dayjs-adapter';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';


import { OrderFormService } from './restaurants/order-form.service';
import { HomeComponent } from './home/home.component'
import { RestaurantComponent } from './restaurant/restaurant.component';
import { MenuComponent } from './restaurants/menu/menu.component';
import { MenuGroupComponent } from './restaurants/menu-group/menu-group.component';
import { OrderDetailsComponent } from './restaurants/order-details/order-details.component';
import { AddToCartComponent } from './restaurants/add-to-cart/add-to-cart.component';
import { RestaurantResolver } from './resolvers/restaurant.resolver';
import { GroupsResolver } from './resolvers/groups.resolver';
import { ModifierResolver } from './resolvers/modifier.resolver';
import { MenuResolver } from './resolvers/menu.resolver';
import { GooglePlacesDirective } from './google-places.directive';
import { CheckoutComponent } from './restaurants/checkout/checkout.component';
import { LoginComponent } from './login/login.component';
import { PaymentDialogComponent } from './restaurants/payment-dialog/payment-dialog.component';
import { OrderStatusComponent } from './restaurants/order-status/order-status.component';
import { AccountComponent } from './account/account.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HomeComponent,
    RestaurantComponent,
    MenuComponent,
    MenuGroupComponent,
    OrderDetailsComponent,
    AddToCartComponent,
    GooglePlacesDirective,
    CheckoutComponent,
    LoginComponent,
    PaymentDialogComponent,
    OrderStatusComponent,
    AccountComponent,

  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    ReactiveFormsModule,
    BrowserTransferStateModule,


    AppRoutingModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatDayjsDateModule,
    MatProgressBarModule,
    MatProgressSpinnerModule

  ],
  providers: [OrderFormService, RestaurantResolver, GroupsResolver, ModifierResolver, MenuResolver],
  bootstrap: [AppComponent]
})
export class AppModule { }
