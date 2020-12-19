import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { OrderFormService } from '../order-form.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import * as dayjs from 'dayjs'
import { Subject } from 'rxjs';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {

  // cannotOrderNow = false;
  // addressInput;
  date = dayjs();
  minTime = '';
  maxTime = '';
  minDate = dayjs()
  maxDate = dayjs()
  loading = true;
  orderTimes = [];
  message = '';
  OrderTimerMap = [];
  dateFilter = date => !this.orderForm.closeDays.includes(date.day());
  futureOrderTime = new Subject<string>();
  public futureOrderTime$ = this.futureOrderTime.asObservable() //Has a $ 

  public futureOrderTime_sub;

  constructor(
    private dialog: MatDialog, public afAuth: AngularFireAuth, public orderForm: OrderFormService,
    private cd: ChangeDetectorRef, public dialogRef: MatDialogRef<OrderDetailsComponent>) {



    this.futureOrderTime_sub = this.futureOrderTime$.subscribe(val => {

      let stringStarter = this.orderForm.orderObject.get('futureOrderDateTime').value.format('YYYY MM DD') + ' ';
      let updatedDateTime: dayjs.Dayjs = dayjs(stringStarter + val, 'YYYY MM DD hh:mm a')

      this.orderForm.orderObject.patchValue({ 'futureOrderDateTime': updatedDateTime });
    });
    this.maxDate = dayjs().add(5, 'day');

    this.orderForm.orderObject.get('deliveryAddress').valueChanges.subscribe(val => {
      this.cd.detectChanges();
    });

    this.orderForm.orderObject.get('deliveryAddress').statusChanges.subscribe(val => {
      // console.log('status change', val);
      this.cd.detectChanges();
    })
  }


  ngOnInit() {
  }
  ngOnDestroy() {
    this.futureOrderTime_sub.unsubscribe();
  }

  getMaxMiles() {
    return Math.max.apply(Math, this.orderForm.restaurant.deliveryFees.map(function (o) { return o.max; }));

  }

  dayChanged(val) {

    let orderTimes = this.orderForm.getTimeList(val.value)
    this.orderForm.orderObject.patchValue({ 'futureOrderTime': orderTimes[0] });
  }

  ngAfterViewInit() {
    // console.log('orderTimeMap', this.orderForm.orderTimeMap[this.minDate.getDay()]);

  }
  updateAddress(e) {
    this.orderForm.orderObject.patchValue({ 'deliveryAddress': e });
  }


  // openLoginDialog() {
  //   const dialogRef = this.dialog.open(LoginDialogComponent, {
  //     width: '90vw',
  //     maxWidth: '400px',
  //     autoFocus: false,
  //   });
  // }


  runcd() {
    this.cd.detectChanges();
  }
  checkValidDetails() {
    if (this.orderForm.orderObject.get('deliveryAddress').invalid || this.orderForm.orderObject.get('futureOrderDateTime').invalid) {
      return;
    }
    else {
      this.dialogRef.close();
    }
  }
}
