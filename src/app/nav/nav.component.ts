import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';
import { OrderFormService } from '../restaurants/order-form.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay(),
      startWith(true)
    );

  constructor(private router: Router, private breakpointObserver: BreakpointObserver, public orderForm: OrderFormService) { }


  getCartUrl() {
    if (this.orderForm.restaurant?.restaurantID) {
      this.router.navigate(['restaurant/' + this.orderForm.restaurant.restaurantID + ''])
    } else {

    }
  }

}
