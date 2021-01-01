import { Component, OnInit } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { AngularFireAuth } from '@angular/fire/auth';
import { OrderFormService } from '../restaurants/order-form.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

  constructor(public orderForm: OrderFormService, public afAuth: AngularFireAuth) { }

  ngOnInit(): void {
  }

  async signout() {
    try {
      console.log('signing out')
      await this.afAuth.signOut()

    } catch (error) {
      console.error(error)
    }
  }

}
