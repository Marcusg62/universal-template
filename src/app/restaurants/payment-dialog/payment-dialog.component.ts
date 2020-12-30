import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef, Inject } from '@angular/core';
import { OrderFormService } from "../order-form.service";
import { MatDialog } from '@angular/material/dialog';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Router } from '@angular/router';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import * as dayjs from 'dayjs';
declare var Stripe;

@Component({
  selector: 'app-payment-dialog',
  templateUrl: './payment-dialog.component.html',
  styleUrls: ['./payment-dialog.component.scss']
})
export class PaymentDialogComponent implements OnInit {
  amount = 100;



  constructor(public analytics: AngularFireAnalytics, private dialog: MatDialog, private functions: AngularFireFunctions, public orderForm: OrderFormService,
    private router: Router) {
      analytics.logEvent('started_checkout_dialog');

    this.amount = Math.round(this.orderForm.orderObject.get('total').value * 100);
    console.log("this.orderForm.orderObject: ",this.orderForm.orderObject.value)

  }

  @ViewChild('cardElement') cardElement: ElementRef;

  paymentRequest: any;
  prButton: any;
  stripe; // : stripe.Stripe;
  card;
  cardErrors;

  loading = false;
  confirmation;

  canUseWallet = false;
  ngOnInit() {


  }
  ngAfterViewInit() {
    if (this.orderForm.mode == 'test') {
      let pk = this.orderForm.restaurant.testPublishableKey;
      this.stripe = Stripe(pk);
    } else {
      let pk = this.orderForm.restaurant.livePublishableKey;
      // console.log("publishable key: ", pk)
      this.stripe = Stripe(pk);
    }
    const elements = this.stripe.elements();

    this.card = elements.create('card');
    this.card.mount(this.cardElement.nativeElement);

    this.card.addEventListener('change', ({ error }) => {
      this.cardErrors = error && error.message;
    });


  }

  async handleForm(e) {
    
    this.loading = true;
    e.preventDefault();
    // e.stopImmediatePropagation()

    // update future order time 
    if (this.orderForm.orderObject.get('isFutureOrder').value == true) {
      const date = (this.orderForm.orderObject.get('futureOrderDateTime').value as dayjs.Dayjs).unix() * 1000;
      const time = this.orderForm.orderObject.get('futureOrderDateTime').value.format('hh:mm a');
      this.orderForm.orderObject.patchValue({ 'futureOrderDate': date, 'futureOrderTime': time });

    }

    const { paymentMethod, error } = await this.stripe.createPaymentMethod('card', this.card);

    if (error) {
      // Inform the customer that there was an error.

      const cardErrors = error.message;
      alert(cardErrors);
      this.loading = false;
    } else {

      // console.log('source', paymentMethod)
      this.loading = true;
      const fun = this.functions.httpsCallable('global_stripeCreateCharge_v2');
      try {

        let orderData = this.orderForm.orderObject.value;
        if (this.orderForm.orderObject.get('isFutureOrder').value == true) {
          orderData['futureOrderDateTime'] = this.orderForm.orderObject.get('futureOrderDateTime').value.unix();
        }
        
        console.info('before cloud function order object',this.orderForm.orderObject.value);
        e.preventDefault();
        this.confirmation = await fun({ source: paymentMethod.id, order: orderData }).toPromise();
        // console.info('after cloud function order object',this.orderForm.orderObject.value);

      } catch (err) {
        // console.log('orderobject before alert: ',this.orderForm.orderObject.value)
        alert(err);
        this.loading = false;
        // console.log('orderobject: ',this.orderForm.orderObject.value)
      }

      // console.log('this.confirmation: ',this.confirmation)
      if (this.confirmation) {
        // console.log('inside the if statement')
        this.loading = false;
        this.dialog.closeAll();

        this.analytics.logEvent('PURCHASE', {value: this.orderForm.orderObject.get('total').value});
        alert('SUCESS, now implement order status page')
      }
      

    }
    ///////close check out dialog
    


  }



}
