import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireFunctions } from '@angular/fire/functions';
import { environment } from '../../../environments/environment'
import { DomSanitizer } from '@angular/platform-browser';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { MatDialog } from '@angular/material/dialog';
import { OrderFormService } from 'src/app/restaurants/order-form.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-propay',
  templateUrl: './propay.component.html',
  styleUrls: ['./propay.component.scss']
})
export class PropayComponent implements OnInit {

  public userData: any;
  public ExternalAccountID: string;
  public HostedTransactionIdentifier: string;
  public iframeURL: any;
  public loading: boolean = false;

  constructor(private router: Router, public orderForm: OrderFormService, public analytics: AngularFireAnalytics, private dialog: MatDialog, private sanitizer: DomSanitizer, private fns: AngularFireFunctions, private afAuth: AngularFireAuth, private afs: AngularFirestore) {

    this.sanitizer = sanitizer;
    this.afAuth.user.subscribe(user => {

      this.afs.doc('payment_profiles/' + user.uid).get().toPromise().then(doc => {
        if (doc.exists) {
          this.userData = doc.data()

          if (this.userData.paymentProfiles.propay.customerId) {
            // we have a payment profiles

          } else {
            // create payer
            this.createHPP()


          }
        }
        else {
          // create payer
          this.createHPP()
        }

      })
    })




    // create or get a payer?
    // create or get payer
    // create hpp indentifier

  }

  ngOnInit(): void {
  }


  async createHPP() {

    const callable = this.fns.httpsCallable('createHPP');
    let result = await callable({ Name: 'Some Customer', EmailAddress: 'marcus.gallegos62@gmail.com' }).toPromise();
    this.HostedTransactionIdentifier = result.HostedTransactionIdentifier;
    this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl('https://protectpaytest.propay.com/hpp/v2/' + this.HostedTransactionIdentifier)

  }

  public async iframeLoad(e) {

    let orderData = this.orderForm.orderObject.value;
    if (this.orderForm.orderObject.get('isFutureOrder').value == true) {
      orderData['futureOrderDateTime'] = this.orderForm.orderObject.get('futureOrderDateTime').value.unix();
    }

    const callable = this.fns.httpsCallable('getTransaction');
    let result = await callable({ hppId: this.HostedTransactionIdentifier, order: orderData }).toPromise();
    console.log('transactionresult', result)


    if (result.HostedTransaction?.AuthCode) {
      this.loading = false;
      this.dialog.closeAll();

      this.analytics.logEvent('PURCHASE', { value: this.orderForm.orderObject.get('total').value });
      this.router.navigate(['account', 'orderstatus', 'thaiHouse-13'], {replaceUrl: true})
    }

  }

}
