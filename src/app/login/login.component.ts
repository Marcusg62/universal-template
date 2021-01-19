import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import 'firebase/auth'
import { OrderFormService } from '../restaurants/order-form.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore, public orderForm: OrderFormService) { }

  ngOnInit() {

    this.afAuth.user.subscribe(user => {
      if (user) {
        this.orderForm.updateUserData(user)


        this.afs.doc(`users/${user.uid}`).valueChanges().subscribe((val: any) => {
          this.orderForm.userDocData = val;
          console.log()
          this.orderForm.orderObject.patchValue({
            'first': val.first,
            'last': val.last,
            'email': val.email,
            'phoneNum': val.phoneNum
          });
        });



      }
    })



  }



  async googleSignin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      return this.oAuthLogin(provider);

    }
    catch (error) {
      // Handle Errors here.
      //console.log(error);
      if (error.code == 'auth/account-exists-with-different-credential') {
        //console.log(error.message);
        alert('Sign in Error: ' + error.email + ' ' + error.message);
      }
    }
  }

  async fbSignin() {
    const provider = new firebase.auth.FacebookAuthProvider();
    try {
      this.oAuthLogin(provider);

    }
    catch (error) {
      // Handle Errors here.
      //console.log(error);
      if (error.code == 'auth/account-exists-with-different-credential') {
        //console.log(error.message);
        alert('Sign in Error: ' + error.email + ' ' + error.message);
      }
    }
  }

  private async oAuthLogin(provider) {
    try {
      await this.afAuth.signInWithPopup(provider);

    } catch (error) {
      console.log(error);
      if (error.code == 'auth/account-exists-with-different-credential') {
        //console.log(error.message);
        alert('Sign in Error: ' + error.email + '\n ' + error.message);
      }

    }
  }

  async anonSignin() {
    const credential = await this.afAuth.signInAnonymously();
  }





}