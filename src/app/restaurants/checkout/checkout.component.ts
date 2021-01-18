import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OrderFormService } from '../order-form.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatDialog } from '@angular/material/dialog';
// import { CouponDialogComponent } from "../coupon-dialog/coupon-dialog.component";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';
import { PropayComponent } from 'src/app/payments/propay/propay.component';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {


  otherTipAmount: number = 20;
  tip;
  user;
  loading;

  constructor(private _snackBar: MatSnackBar, public router: Router,
    private afs: AngularFirestore, public afAuth: AngularFireAuth, private functions: AngularFireFunctions,
    public dialog: MatDialog, public orderForm: OrderFormService) {
    this.afAuth.user.subscribe(val => {
      this.user = val;
    });
    document.getElementsByTagName('mat-sidenav-content')[0].scrollTo(0, 0) // TO DO: make sure this does not break ssr

  }

  ngOnInit() {
    this.orderForm.canOrderNow();
    const dialogRef = this.dialog.open(OrderDetailsComponent, {
      width: '90vw',
      maxWidth: '700px',
      disableClose: true,
    });

  }

  removeItem(item): void {
    this.orderForm.removeFromCart(item);
  }


  openPaymentDialog(e) {
    // console.log('orderObject before open the dialog: ',this.orderForm.orderObject.value)

    e.preventDefault();


    if (this.orderForm.orderObject.invalid) {
      return;
    }

    console.log('this.orderForm.restaurant', this.orderForm.restaurant)

    
    switch (this.orderForm.restaurant.payment_processing.processor) {
      case 'propay':
        let propayDialogRef = this.dialog.open(PropayComponent, {
          width: '90vw',
          maxWidth: '550px',
          disableClose: true,
          autoFocus: false,

        });

        break;

      default:
        let dialogRef = this.dialog.open(OrderDetailsComponent, {
          width: '90vw',
          maxWidth: '500px',
          disableClose: true,
          autoFocus: false,
        });
        break;
    }

  }

  tipChange(val) {
    // console.log('tip change', val);
    if (val == "other") {

      if (this.otherTipAmount < 0) {
        this._snackBar.open('Tip must be greater than Zero. ', 'Ok 😅', {
          duration: 10000,
        });
        return;
      }
      this.orderForm.tipPercent = this.otherTipAmount / 100;

    } else {
      let newVal = parseFloat(val);
      // ////console.log(newVal);
      this.orderForm.tipPercent = newVal;
    }

    this.orderForm.calculateTotal();
  }
  // openCouponDialog() {
  //   const dialogRef = this.dialog.open(CouponDialogComponent, {
  //     width: '90vw',
  //     maxWidth: '700px',
  //     autoFocus: false,
  //   });
  // }
  openOrderDetails() {
    const dialogRef = this.dialog.open(OrderDetailsComponent, {
      width: '100%',
      maxWidth: '700px',
      autoFocus: false,
    });
  }

}