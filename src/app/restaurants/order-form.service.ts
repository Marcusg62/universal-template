import { Injectable, ApplicationRef, NgZone } from '@angular/core';

import { environment } from '../../environments/environment';

import { FormGroup, FormBuilder, AbstractControl, Validators, ValidationErrors, FormArray, FormControl } from '@angular/forms';
import { CartItem } from './Interfaces.model';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Restaurant, Coupon } from './Interfaces.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as dayjs from 'dayjs'
import * as timezone from 'dayjs/plugin/timezone' // import plugin
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
dayjs.extend(timezone)


@Injectable({
  providedIn: 'root'
})
export class OrderFormService {

  public user;
  public restaurant: Restaurant;
  public userDocData;
  public modifiers;
  public groups;
  public menuList = [];
  public freeItemsCoupons = [];
  public couponSelections = {};
  public loading = false;
  public restInfoLoading = false;
  deliveryFee = 0;
  tipPercent = 0.15;
  public orderObject: FormGroup;
  orderTimeMap = [];
  orderTimes = [];
  closeDays = [];
  restaurantDoc;
  // couponApplied = false;
  mode = 'test';
  // mode = 'prod';


  // close;
  canOrderNow = false;
  canOrderLunch = false;

  current_DateTime: dayjs.Dayjs;
  latest_OrderDateTime: dayjs.Dayjs;
  earliest_OrderDateTime: dayjs.Dayjs;

  selectedRestaurant: BehaviorSubject<string>;


  constructor(private route: ActivatedRoute, private _snackBar: MatSnackBar, private afAuth: AngularFireAuth, private ref: ApplicationRef, private afs: AngularFirestore, private fb: FormBuilder) {
    this.restInfoLoading = true;




    this.selectedRestaurant = new BehaviorSubject(this.route.snapshot.url[1]?.path ? this.route.snapshot.url[1].path : '');;
    const subscription = this.selectedRestaurant.subscribe(val => {

      // switch restaurant
      console.log('new restaurant', val)

      if (val) {

        this.restaurantDoc = afs.doc('restaurants/' + val).valueChanges();
        afs.doc('restaurants/' + val).valueChanges().subscribe((doc: Restaurant) => {
          this.restaurant = doc;

          dayjs.tz.setDefault(this.restaurant.timezone)

          this.current_DateTime = dayjs();
          this.earliest_OrderDateTime = dayjs();//time of now

          // console.log("restaurants:", this.restaurant)
          let i = 0;
          this.restaurant.orderStart.forEach(day => {
            if (doc.orderStart[i] != '' && doc.orderEnd[i] != '') {
              this.orderTimeMap[i] = this.createTimeList(doc.orderStart[i], doc.orderEnd[i]);
            }
            else {
              this.closeDays.push(i);
            }

            i++;
          });


          // update earliest order time to have correct time
          this.updateEarliestOrderTime();
          // console.log('order easliest time date: ', this.earliest_OrderDateTime)

          let lastTime = this.restaurant.orderEnd[this.current_DateTime.day()];// 10 pm
          let lastOrderDateTime = dayjs(lastTime, 'hh:mm a'); // TO DO: CHECK TO MAKE SURE THIS IS SET CORRECTLY, I BELIEVE IT SHOULD SET TO TODAY AT GIVEN TIME

          // if (this.current_DateTime.isAfter(lastOrderDateTime)) {

          //   let temp = moment().add(1, 'days');
          //   let stringStarter = temp.format('YYYY MM DD') + ' ';
          //   let times = this.getTimeList(temp);

          //   this.earliest_OrderDateTime = moment(stringStarter + times[temp.day()], 'YYYY MM DD hh:mm a').tz(this.restaurant.timezone).set('seconds', 0);
          // }
          this.checkOpen();

          // set coupon vars for free item selection
          doc.coupons.forEach((coupon: Coupon) => {
            this.couponSelections[coupon.couponId] = '';
          })
        });

        afs.doc(`public/groups/${val}/Groups`).valueChanges().subscribe((doc: any) => {
          this.groups = doc.GroupDetail;
        });

        afs.collection(`public/menu/${val}`).valueChanges().subscribe(val => {
          this.menuList = val;
        });


        this.afs.collection(`public/modifiers/${val}`).valueChanges().subscribe(val => {
          // console.log(val);
          this.modifiers = val;
        });

        // console.log("earliest order date time: ", this.earliest_OrderDateTime)
        this.orderObject = this.fb.group({
          order_time: ['',],
          mode: [this.mode,],
          restaurantID: [val,],
          order_ISO_time: ['',], //set in cloud function on server
          isFutureOrder: false,
          futureOrderDateTime: this.earliest_OrderDateTime,
          futureOrderTime: ['',],
          futureOrderDate: ['',],
          items: [[], [this.validLunchItems.bind(this), Validators.required]],
          deliveryAddress: ['',],
          aptNum: ['',],
          phoneNum: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
          first: ['', [Validators.required]],
          last: ['', [Validators.required]],
          email: ['', [Validators.email, Validators.required]],
          orderInstructions: ['', Validators.maxLength(156)],
          orderType: ['Pickup', [Validators.required]],
          addAptNum: [false,],
          coupons: new FormArray([]),
          // napkin: false,
          // utensil: false,
          subTotal: [0,],
          convenienceFee: [0],
          tipAmount: [0],
          tax: [0],
          total: [0],
          discount: [0],
          apiVersion: '2.0'

        },
          {
            validators: this.validOrderTime.bind(this)
          });

        this.afAuth.user.subscribe(async (val) => {
          // console.log('user change', val);
          this.user = val;
          if (val != null) {
            // console.log('user change', JSON.parse(JSON.stringify(val)));
            let tempVal = JSON.parse(JSON.stringify(val));
            this.updateUserData(tempVal);

          }
        });


        // this.orderObject.valueChanges.subscribe((val)=>{
        //   console.log(val)
        // })

        this.orderObject.get('futureOrderDateTime').valueChanges.subscribe((val: dayjs.Dayjs) => {

          // gets time list for today or selected day
          this.orderTimes = this.getTimeList(val);




          this.orderObject.get('items').updateValueAndValidity({ emitEvent: true });
          let orderEnd = dayjs();
          let orderEndTime = this.restaurant.orderEnd[orderEnd.day()];
          let starterString = orderEnd.format('YYYY MM DD') + ' ';
          orderEnd = dayjs(starterString + orderEndTime, 'YYYY MM DD hh:mm a');
          if (val.isAfter(orderEnd) || this.orderObject.get('futureOrderTime').value == '') {
            // if is after ordering time, update time
            // or if order time is unset

            let times = this.getTimeList(val)
            this.orderObject.patchValue({ 'futureOrderTime': times[0] }, { emitEvent: false });
          }




          this.updateCanOrderLunch(val);
          this.orderObject.get('items').updateValueAndValidity();

        });

        this.orderObject.get('futureOrderTime').valueChanges.subscribe(val => {
          let date = this.orderObject.get('futureOrderDateTime').value.format('YYYY MM DD') + ' ';
          let newDateTime = dayjs(date + val, 'YYYY MM DD hh:mm a')
          this.orderObject.patchValue({ 'futureOrderDateTime': newDateTime }, { emitEvent: false });
          this.updateCanOrderLunch(newDateTime);
        });

        // reset value and update validators
        this.orderObject.get('isFutureOrder').valueChanges.subscribe(val => {

          this.updateEarliestOrderTime();
          if (!this.orderObject.get('futureOrderDateTime').value) {
            this.orderObject.patchValue({ 'futureOrderDateTime': this.earliest_OrderDateTime });
          }
          if (val === true) {
            this.orderObject.get('futureOrderDateTime').setValidators(Validators.required);
          } else {
            this.orderObject.get('futureOrderDateTime').clearValidators();

            this.updateCanOrderLunch(dayjs());
          }
        });






        // reset validators
        this.orderObject.get('orderType').valueChanges.subscribe(val => {
          // console.log('checking delivery or pickup');
          if (val == 'Delivery') {
            this.orderObject.get('deliveryAddress').setValidators(Validators.required);
            this.orderObject.get('deliveryAddress').setAsyncValidators(this.validDeliveryAddress.bind(this));
            if (this.restaurant.deliveryMinSubtotal) {
              this.orderObject.get('subTotal').setValidators(Validators.min(this.restaurant.deliveryMinSubtotal));
            } else {
              this.orderObject.get('subTotal').setValidators(Validators.min(15));
            }

          } else {
            this.orderObject.get('aptNum').setValue('');
            this.orderObject.get('deliveryAddress').reset();
            this.orderObject.get('deliveryAddress').clearValidators();
            this.orderObject.get('deliveryAddress').clearAsyncValidators();
            this.orderObject.get('deliveryAddress').updateValueAndValidity();
            // this.orderObject.get('subTotal').setValidators(Validators.min(5));
          }
          this.calculateTotal();
        });


        this.orderObject.get('items').valueChanges.subscribe(val => {
          this.calculateTotal();
        });


        this.orderObject.get('coupons').valueChanges.subscribe(val => {
          this.calculateTotal();



        });
      }

    }); // end switch restaurant






    this.restInfoLoading = false;

  } // end constructor 


  checkOpen() {
    let orderDay: dayjs.Dayjs;
    let rightNow = dayjs();
    let stringStart = rightNow.format('YYYY MM DD') + ' ';
    // console.log('check open restaurantDoc', this.restaurant);
    if (this.closeDays.indexOf(rightNow.day()) != -1) {
      this.canOrderNow = false;
      this.orderObject.patchValue({ 'isFutureOrder': true });
    }
    else {
      let endTime = this.restaurant.orderEnd[rightNow.day()]
      let startTime = this.restaurant.orderStart[rightNow.day()]
      let endDateTime = dayjs(stringStart + endTime, 'YYYY MM DD hh:mm a')
      let startDateTime = dayjs(stringStart + startTime, 'YYYY MM DD hh:mm a')
      if (rightNow.isAfter(endDateTime) || rightNow.isBefore(startDateTime)) {
        this.canOrderNow = false;
        this.orderObject.patchValue({ 'isFutureOrder': true });
      } else {
        // console.log("not future order")
        this.canOrderNow = true;
        // this.orderObject.patchValue({ 'isFutureOrder': false });
      }
    }
    // let todayStartTime = this.restaurant.orderStart[currentDate.getDay()];
    // let todayEndTime = this.restaurant.orderEnd[currentDate.getDay()];
    // let start = new Date(currentDate);
    // let end = new Date(currentDate);
    // // console.log('today start time', todayStartTime);
    // // console.log('today start time', todayEndTime);
    // start.setHours(this.getHoursFromString(todayStartTime), this.getMinutesFromString(todayStartTime), 0, 0);
    // end.setHours(this.getHoursFromString(todayEndTime), this.getMinutesFromString(todayEndTime), 0, 0);

    // // console.log('today start time', start);
    // // console.log('today end time', end);
    // if (currentDate > end || currentDate < start) {
    //   this.canOrderNow = false;
    //   this.orderObject.patchValue({ 'isFutureOrder': true });
    // } else {
    //   this.canOrderNow = true;
    //   this.orderObject.patchValue({ 'isFutureOrder': false });
    // }


  }

  getMinute(timeString) {
    let time = timeString;
    let hours = Number(time.match(/^(\d+)/)[1]);
    let minutes = Number(time.match(/:(\d+)/)[1]);
    let AMPM = time.match(/\s(.*)$/)[1];
    if (AMPM == "pm" && hours < 12) hours = hours + 12;
    if (AMPM == "am" && hours == 12) hours = hours - 12;
    let sHours = hours.toString();
    let sMinutes = minutes.toString();
    if (hours < 10) sHours = "0" + sHours;
    if (minutes < 10) sMinutes = "0" + sMinutes;
    let totalMinutes = hours * 60 + minutes
    // alert(sHours + ":" + sMinutes + "@" + totalMinutes.toString());
    return totalMinutes
  }

  getMinutesFromString(timeString) {
    return timeString.match(/:(\d+)/)[1];
  }
  getHoursFromString(timeString: string) {
    let hours = Number(timeString.match(/^(\d+)/)[1]);
    // console.log('time sub string', );
    if (timeString.substring(timeString.length - 2) == 'pm' && timeString.substring(0, 2) != "12") {
      hours += 12;
    }
    return hours;
  }


  createTimeList(StartTime, EndTime) {

    let x = 10; // minutes interval
    let times = []; // time array
    let tt = this.getMinute(StartTime); // start time
    let endMinute = this.getMinute(EndTime);
    let ap = ['am', 'pm']; // AM-PM

    // loop to increment the time and push results in array
    for (let i = 0; tt < endMinute; i++) {
      let hh = Math.floor(tt / 60); // getting hours of day in 0-24 format
      let mm = (tt % 60); // getting minutes of the hour in 0-55 format
      let hourString = (hh % 12) === 0 ? '12' : (hh % 12).toString();
      times[i] = ("0" + hourString).slice(-2) + ':' + ("0" + mm).slice(-2) + ' ' + ap[Math.floor(hh / 12)];
      // pushing data in array in [00:00 - 12:00 AM/PM format]
      tt = tt + x;
    }

    return times;
  }

  setOrderType(val) {
    this.orderObject.patchValue({ 'orderType': val });
  }

  get cartItems() {
    return this.orderObject.get('items').value;
  }

  get cartLength() {
    return this.orderObject.get('items').value.length;
  }

  get isFutureOrder() {
    return this.orderObject.get('isFutureOrder').value;
  }

  sortItems() {
    let itemList = [...this.orderObject.get('items').value]
    console.log(typeof (itemList));
    console.log(itemList[0]);
    let newList = []
    let qtyList = []
    for (let i = 0; i < itemList.length; i++) {
      const e = itemList[i];
      qtyList.push(e.quantity);
      let { quantity, ...noQItem } = e;
      newList.push(noQItem);
    }
    console.log('qtyList', qtyList)
    for (let j = 0; j < newList.length; j++) {
      const e = newList[j];
      if (typeof (qtyList[j]) == 'number') {
        let timeStamp = (Date.now() + j).toString();
        let temp = {}
        temp["timeStamp"] = timeStamp
        temp['qty'] = qtyList[j];
        temp["item"] = newList[j]
        qtyList[j] = temp
        for (let i = j + 1; i < newList.length; i++) {
          const k = newList[i];
          if (this.deepEqual(e, k)) {
            let temp1 = {};
            temp1["timeStamp"] = timeStamp
            temp1['qty'] = qtyList[i];
            temp1["item"] = newList[i]
            qtyList[i] = temp1;
          }
        }
      }
      else {
        continue;
      }
    }


    console.log('qtyList after lable', qtyList)

    let itemMap = qtyList.reduce((obj, item) => {
      console.log('item: ', item)
      let qty = item.qty;
      if (!obj[item.timeStamp]) {
        obj[item.timeStamp] = { "item": item.item, "qty": qty };
      } else {
        console.log("obj[item.timeStamp].qty", obj[item.timeStamp].qty)
        obj[item.timeStamp] = { "item": item.item, "qty": obj[item.timeStamp].qty + qty };
      }
      console.log(obj);
      return obj;
    }, {})
    console.log("itemMap values:", Object.values(itemMap));
    let newItemList = Object.values(itemMap)
    for (let k = 0; k < newItemList.length; k++) {
      newItemList[k]['item']["quantity"] = newItemList[k]['qty']
      newItemList[k] = newItemList[k]['item'];
    }
    console.log("newItemList:", newItemList);
    console.log("groups:", this.groups);
    let sortedList = []
    for (let j = 0; j < this.groups.length; j++) {
      const e = this.groups[j];
      console.log('e', e)
      for (let i = 0; i < newItemList.length; i++) {
        const ele = newItemList[i];
        console.log('ele', ele)
        if (e["name"] == ele['group']) {
          sortedList.push(ele);
        }

      }
    }
    console.log("sortedList", sortedList);
    this.orderObject.patchValue({ 'items': sortedList });
  }

  deepEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      const val1 = object1[key];
      const val2 = object2[key];
      const areObjects = this.isObject(val1) && this.isObject(val2);
      if (
        areObjects && !this.deepEqual(val1, val2) ||
        !areObjects && val1 !== val2
      ) {
        return false;
      }
    }

    return true;
  }

  isObject(object) {
    return object != null && typeof object === 'object';
  }

  getPriceOfItem(menuItemFormValue) {
    //  console.log('menuItemForValue', menuItemFormValue);
    let startingPrice;
    // console.log('menuList', this.menuList);
    if (menuItemFormValue.size) {
      let bp = this.menuList.find(m => {
        return m.name == menuItemFormValue.name
      });
      // console.log('found ', bp);
      bp = bp.basePrices.find(t => { return t.type == menuItemFormValue.size });

      // console.log('found ', bp);
      startingPrice = bp.price;
    } else {
      let bp = this.menuList.find(m => {
        return m.name == menuItemFormValue.name
      });
      // console.log('found ', bp);
      bp = bp.basePrices[0];

      // console.log('found ', bp);
      startingPrice = bp.price;
    }


    let calculatedPrice = startingPrice;

    let checkList = [
      'name',
      'price',
      'quantity',
      'size',
      'instructions'
    ]
    // console.log('menuItemForm type: ', typeof (menuItemFormValue))

    for (const key in menuItemFormValue) {
      if (!checkList.includes(key) && menuItemFormValue[key] != "") {
        // not inside the checklist
        // console.log('key: ', key)
        // console.log('what is inside : ', menuItemFormValue[key])
        let mod;
        mod = this.modifiers.find(m => { return m.name == key });
        // // console.log('mod object: ', mod);
        if (mod.type == 'increasable_dropdown') {
          //  console.log('mod: ', mod);
          // console.log('key: ', key)
          //console.log('menuItemFormValue: ',menuItemFormValue)
          let options = []
          mod.options.forEach(p => {

            for (let index = 0; index < menuItemFormValue[key].length; index++) {
              let element = menuItemFormValue[key][index];
              if (p.value == element) {
                options.push(p)
              }

            }

          });
          //  (p => {
          //   let selectedOptions = [];
          //   for (let index = 0; index < menuItemFormValue[key].length; index++) {
          //     let element = menuItemFormValue[key][index];
          //     if (p.value == element) {
          //       selectedOptions.push(p)
          //     }

          //   }
          //   return selectedOptions
          // });
          // console.log('options : ', options);
          if (options) {

            for (let index = 0; index < options.length; index++) {
              let option = options[index];
              if (typeof (option.priceDiff) != 'number') {
                startingPrice += option.priceDiff[menuItemFormValue.size];

              } else {
                startingPrice += option.priceDiff;
              }
            }
            // console.log('size price diff', option.priceDiff[menuItemFormValue.size]);

          }
        }
        else if (mod.type == 'multi-dropdown') {
          // console.log('mod in multi-dropdown: ', mod);

          menuItemFormValue[key].forEach(element => {
            // console.log('selections : ', menuItemFormValue[key])
            // console.log('selection in the for loop: ', element)
            let option = mod.options.find(p => { return p.value == element });
            // console.log('option in the for loop: ', option);
            // console.log('size price diff', option.priceDiff[menuItemFormValue.size]);
            if (typeof (option.priceDiff) != 'number') {
              startingPrice += option.priceDiff[menuItemFormValue.size];

            } else {
              startingPrice += option.priceDiff;
            }
          });
          // for (const selection in menuItemForm[key]) { ////iterate through the selection array

          if (mod.name == 'Add_Veggie') {
            startingPrice += 2;
          }
          // }
        }
        else {
          let option = mod.options.find(p => { return p.value == menuItemFormValue[key] });
          if (option) {
            if (typeof (option.priceDiff) != 'number') {
              startingPrice += option.priceDiff[menuItemFormValue.size];

            } else {
              startingPrice += option.priceDiff;
            }
          }
        }

      }
    }

    calculatedPrice = (startingPrice * menuItemFormValue.quantity);



    // this._currentItemPrice.next(tempt);
    // this.finalItemPrice = tempt;
    return calculatedPrice;
  }

  addToCart(item: CartItem) {
    const temp: Array<any> = this.cartItems;
    temp.push(item);
    this.orderObject.patchValue({ 'items': temp });
    this.calculateTotal();
  }


  removeFromCart(item) {

    let temptarrayc = [];
    temptarrayc = this.cartItems;
    const index = temptarrayc.indexOf(item);
    temptarrayc.splice(index, 1);
    this.orderObject.patchValue({ 'items': temptarrayc });
    this.calculateTotal()
  }


  calculateTotal() {
    let subTotal = 0;
    let tax = 0;
    let convenienceFee = 0;
    let tip = 0;
    let total = 0;
    let discount = 0;
    const temp: Array<any> = this.cartItems;

    for (let i = 0; i < temp.length; i++) {
      subTotal += temp[i].price;
    }

    // calculate discount
    // console.log('calculate total', this.appliedCoupons.controls);
    // console.log('applied coupons', this.appliedCoupons)
    if (this.appliedCoupons.value.length > 0) {
      this.appliedCoupons.controls.forEach((coupon: any) => {
        // console.log('coupon', coupon.value)
        switch (coupon.value.type) {
          case 'percent':
            discount = (subTotal * (coupon.value.value / 100) * -1);
            console.log("discount: ", discount)
            break;
          case 'amount':
            // console.log('hit', coupon.value);
            discount = (coupon.value.value * -1);
            break;
          default:
            break;
        }
      });

    }


    // subTotal = subTotal + discount;

    tax = Math.trunc((subTotal) * this.restaurant.taxRate) / 100;

    let tempFee = 0;

    // added fee for restaurants ex. ThaiB add 10%
    if (this.restaurant.addConvenienceFee.active == true) {


      switch (this.restaurant.addConvenienceFee.type) {
        case 'number':
          for (let i = 0; i < this.restaurant.addConvenienceFee.fee.length; i++) {
            if (subTotal >= this.restaurant.addConvenienceFee.fee[i].min && subTotal <= this.restaurant.addConvenienceFee.fee[i].max) {
              tempFee = this.restaurant.addConvenienceFee.fee[i].number;
            }

          }

          break;
        case 'percent':
          for (let i = 0; i < this.restaurant.addConvenienceFee.fee.length; i++) {
            if (subTotal >= this.restaurant.addConvenienceFee.fee[i].min && subTotal <= this.restaurant.addConvenienceFee.fee[i].max) {
              let tempPercent = this.orderObject.get('subTotal').value + tax;
              tempPercent = tempPercent * (this.restaurant.addConvenienceFee.fee[i].number / 100);
              tempFee = tempPercent;
            }

          }

          break;
        default:
          break;
      }
    }
    // deliveryFee or pickupFee
    if (this.orderObject.get('orderType').value == 'Delivery') {
      tempFee += this.deliveryFee;
    } else {
      if (this.restaurant.pickupFee.active) {
        switch (this.restaurant.pickupFee.type) {
          case 'number':
            tempFee += this.restaurant.pickupFee.fee;
            break;
          case 'percent':
            tempFee += subTotal * (this.restaurant.pickupFee.fee / 100);
            break;
          default:
            break;
        }
      }
    }
    // console.log('patching temp fee', tempFee);
    this.orderObject.patchValue({ 'convenienceFee': tempFee, emitEvent: false });




    convenienceFee = this.orderObject.get('convenienceFee').value;
    tip = Math.trunc(this.tipPercent * subTotal * 100) / 100;
    total = subTotal + tax + convenienceFee + tip + discount;

    this.orderObject.patchValue({ 'discount': discount, emitEvent: false });
    this.orderObject.patchValue({ 'subTotal': subTotal, emitEvent: false });
    this.orderObject.patchValue({ 'tipAmount': tip, emitEvent: false });
    this.orderObject.patchValue({ 'tax': tax, emitEvent: false });
    this.orderObject.patchValue({ 'total': parseFloat(total.toFixed(2)), emitEvent: false });

    // discount = from coupons, percent or amount
    // subtotal = cost of items + discount // (discount is negative) 
    // tip amount = raw amount
    // tax = (subtotal + convenience fee) * tax rate
    // total = subtotal + tip + tax

    // console.log('o', this.orderObject.value);

    this.appliedCoupons.controls.forEach((control: AbstractControl) => {

      control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
    // update coupon suggestion
    this.checkAvailableCoupons();
  }

  // setInitialItemPrice(price) {

  //   // this._currentItemPrice.next(pxrice);
  // }

  async validDeliveryAddress(control: AbstractControl) {

    // TO DO: REIMPLIMENT THIS FUNCTION
  }


  handleMapResponse(response, status) {

    // TO DO: REIMPLIMENT THIS FUNCTION

  }

  async updateUserData(user) {

    // try {
    //   const userRef = this.afs.doc(`users/${environment.restaurantID}/users/${user.uid}`);

    //   const data = {
    //     uid: user.uid,
    //     email: user.email,
    //     lastLoginAt: new Date(),
    //     isAnonymous: this.user.isAnonymous,
    //     provider: this.user.isAnonymous ? 'anonymous' : user.providerData
    //   };
    //   await userRef.set(data, { merge: true });

    //   this.afs.doc(`users/${environment.restaurantID}/users/${user.uid}`).get().toPromise().then((val: any) => {
    //     this.userDocData = val;
    //     this.orderObject.patchValue({
    //       'first': val.first,
    //       'last': val.last,
    //       'email': val.email,
    //       'phoneNum': val.phoneNum
    //     });
    //   })

    // } catch (error) {
    //   console.warn('error updating user doc', error)
    // }
  }

  subtractHalfHour(timeString) {
    let hour = parseInt(timeString.split(':')[0]);
    let minute = parseInt(timeString.split(':')[1].split(' ')[0]);
    let ampm = timeString.split(':')[1].split(' ')[1];
    let resultHour;
    let resultMinute;
    if (ampm == 'am' && minute < 30) {
      resultHour = hour - 1;
      resultMinute = minute + 30;
    }
    else if (ampm == 'pm' && minute < 30 && hour != 12) {
      resultHour = hour + 12 - 1;
      resultMinute = minute + 30;
    }
    else if (ampm == 'pm' && minute < 30 && hour == 12) {
      resultHour = hour - 1;
      resultMinute = minute + 30;
    }
    else if (ampm == 'pm' && minute >= 30) {
      resultHour = hour + 12;
      resultMinute = minute - 30;
    }
    return [resultHour, resultMinute]
  }

  convertTimeToString(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let hourString;
    let minuteString;
    let newHours = hours % 12;
    newHours = newHours ? newHours : 12;
    let ampm = hours >= 12 ? 'pm' : 'am';
    let futureMinutes = (Math.floor(minutes / 10) + 1) * 10
    if (futureMinutes == 60) {
      minuteString = '00';
      hours += 1
    }
    else {
      if (futureMinutes.toString().length < 2) {
        minuteString = '0' + futureMinutes.toString();
      }
      else {
        minuteString = futureMinutes.toString();
      }
    }
    let futureHours = (hours + 2) % 12;

    futureHours = futureHours ? futureHours : 12;
    let futureAmpm = (hours + 1) >= 12 ? 'pm' : 'am';
    let timeString = ("0" + futureHours.toString()).slice(-2) + ':' + minuteString + ' ' + futureAmpm;
    return timeString;

  }

  validLunchItems(control: AbstractControl) {
    // console.log('checking items for lunch item', control);
    // console.log('menu list', this.menuList);

    let hasLunchItem = false;
    control.value.forEach(item => {

      if (item.size && item.size == 'Lunch') {
        hasLunchItem = true;
      }
      if (item.group != 'coupon') {
        let menuListItem = this.menuList.find(m => {
          return m.name == item.name;
        });

        let upper = menuListItem.group.toUpperCase();

        if (upper.includes('LUNCH')) {
          hasLunchItem = true;
        }
      }


    });

    // console.log('has lunch item? ', hasLunchItem);
    if (hasLunchItem && !this.canOrderLunch) {

      return { 'lunchItemError': true };

    } else {
      return null;
    }

  }

  minSubtotalValidation(couponControl: AbstractControl) {

    let coupon: Coupon = couponControl.value;
    if (this.orderObject.get('subTotal').value < coupon.minSubtotal) {
      return { minSubtotal: 'This coupon requires a subtotal of at least $' + coupon.minSubtotal.toFixed(2) };
    } else {
      return null;
    }
  }
  orderTypeValidation(couponControl: AbstractControl) {

    let coupon: Coupon = couponControl.value;
    if (coupon.orderType != null && this.orderObject.get('orderType').value.toUpperCase() != coupon.orderType.toUpperCase()) {
      return { orderType: 'The coupon ' + coupon.title + ' must be used with a ' + coupon.orderType + ' order. ' };
    } else {
      return null;
    }
  }
  mixableValidation(couponControl: AbstractControl) {

    let coupon: Coupon = couponControl.value;
    if (!coupon.mixable && this.orderObject.get('coupons').value.length > 1) {
      return { mixable: 'This coupon is not combinable with other coupons.' };
    } else {
      return null;
    }
  }

  get appliedCoupons() {
    return this.orderObject.get('coupons') as FormArray;
  }

  addCoupon(coupon: Coupon) {
    // console.log(coupon);
    // console.log('coupon var', this.couponSelections[coupon.couponId])
    let couponAdded = false;
    let errorMessage = '';

    // console.log(coupon);

    // check coupon limit 
    if (this.restaurant.limitOneCoupon == true && this.orderObject.get('coupons').value.length > 0) {

      errorMessage = 'Limit to one coupon. Remove the other coupon before adding a new one. ';
      couponAdded = false;

    } else {

      // check coupon start/enddate

      if (this.appliedCoupons.value.includes(coupon)) {
        errorMessage = 'You have already used this coupon.  ';
        couponAdded = false;
      } else {
        if (coupon.startDate != null && dayjs(coupon.endDate).isBefore(dayjs(this.current_DateTime))) { // TO DO CHECK IF THIS ISBEFORE IS WORKING CORRECTLY
          errorMessage = 'Coupon has not started yet. ';
          couponAdded = false;
        }
        else if (coupon.endDate != null && dayjs(coupon.endDate).isAfter(dayjs(this.current_DateTime))) { // TO DO CHECK IF THIS isAfter IS WORKING CORRECTLY
          errorMessage = 'Coupon period is no longer valid. ';
          couponAdded = false;
        }
        else {
          // coupon is in valid date

          // check if mixable

          if (!coupon.mixable && this.appliedCoupons.length > 0) {
            errorMessage = 'This coupon cannot be combined with other coupons. ';
            couponAdded = false;

          } else {

            // the coupon is mixable or no coupons have been added

            // coupon types
            let temp = <FormArray>this.orderObject.get('coupons');
            temp.push(new FormControl(coupon, [this.minSubtotalValidation.bind(this), this.orderTypeValidation.bind(this), this.mixableValidation.bind(this)]));

            switch (coupon.type) {
              case 'freeItem':
                // add free item
                let selectedFreeItem: CartItem = {
                  name: this.couponSelections[coupon.couponId] == '' ? coupon.freeItems[0] : this.couponSelections[coupon.couponId],
                  price: 0,
                  modifiers: [],
                  instructions: '',
                  priceDiff: [],
                  quantity: 1,
                  couponItem: true

                };

                // update coupon var for accurate removal next time, if need be
                if (this.couponSelections[coupon.couponId] == '') {
                  this.couponSelections[coupon.couponId] = coupon.freeItems[0]
                }

                this.addToCart(selectedFreeItem);
                break;
              case 'percent':
                // don't calculate price here, do it in calculateTotal()
                break;
              case 'amount':
                // don't calculate price here, do it in calculateTotal()
                break;
              default:
                console.error('unknown coupon type', coupon.type);
                break;
            }
            couponAdded = true;
          }
        }

      }


    }
    if (couponAdded) {
      // success
      this._snackBar.open('Coupon applied! 🎉', 'Cool!', {
        duration: 10000,
      });

    } else {
      // fail

      this._snackBar.open(errorMessage, 'Ok', {
        duration: 10000,
      });

    }

  }

  checkAvailableCoupons() {
    if (this.appliedCoupons.length == 0) {
      let temp = [];

      this.restaurant.coupons.forEach((coupon: Coupon) => {
        if (coupon.type == 'freeItem'
          && coupon.active == true
          && coupon.singleUse == false
          || coupon.type == 'freeItem'
          && coupon.active == true
          && coupon.singleUse == false
          && coupon.startDate == null
          && coupon.endDate == null
          || coupon.type == 'amount'
          && coupon.active == true
          && coupon.singleUse == false
          && coupon.startDate == null
          && coupon.endDate == null
          || coupon.type == 'percent'
          && coupon.active == true
          && coupon.singleUse == false
          && coupon.startDate == null
          && coupon.endDate == null


        ) {

          if (coupon.orderType == null || coupon.orderType == this.orderObject.get('orderType').value) {
            temp.push(coupon)

          }
        }
      });
      this.freeItemsCoupons = temp;
      // have list of free item coupons, sort ascending
      this.freeItemsCoupons.sort(function (a: Coupon, b: Coupon) { return a.minSubtotal - b.minSubtotal });
    }
  }

  removeCoupon(coupon: FormControl) {
    const index = this.appliedCoupons.controls.indexOf(coupon);

    if (index > -1) {
      this.appliedCoupons.removeAt(index);
    }
    if (coupon.value.type == 'freeItem') {

      let item = this.orderObject.get('items').value.find((item: CartItem) => {
        return item.price === 0 && item.name == this.couponSelections[coupon.value.couponId] && item.couponItem == true
      });
      this.removeFromCart(item);
    }

  }
  updateCouponSelection(e, coupon: Coupon) {
    this.couponSelections[coupon.couponId] = e.value;
  }

  validOrderTime(control: FormGroup) {

    if (control.get('isFutureOrder').value == false) {

      return null

    }

    try {

      if (control.get('isFutureOrder').value) {
        // need to validate future order date & time
        const futureDateTime: dayjs.Dayjs = control.get('futureOrderDateTime').value;

        const starterString = futureDateTime.format('YYYY MM DD') + ' ';
        const orderStart = dayjs(starterString + this.restaurant.orderStart[futureDateTime.day()], 'YYYY MM DD hh:mm a');
        const orderEnd = dayjs(starterString + this.restaurant.orderEnd[futureDateTime.day()], 'YYYY MM DD hh:mm a');

        if (futureDateTime.isBefore(orderStart)) {

          return { 'invalidOrderTime': 'The future order time is too early.' }

        } else if (futureDateTime.isAfter(orderEnd)) {

          return { 'invalidOrderTime': 'The future order time is too late.' }

        }

      } else {
        // need to current order date & time
        const orderDateTime = dayjs();

        const starterString = orderDateTime.format('YYYY MM DD') + ' ';
        const orderStart = dayjs(starterString + this.restaurant.orderStart[orderDateTime.day()], 'YYYY MM DD hh:mm a');
        const orderEnd = dayjs(starterString + this.restaurant.orderEnd[orderDateTime.day()], 'YYYY MM DD hh:mm a');
        if (orderDateTime.isBefore(this.earliest_OrderDateTime)) {

          return { 'invalidOrderTime': 'The future order time is too early.' }

        } else if (orderDateTime.isAfter(orderEnd)) {

          return { 'invalidOrderTime': 'The future order time is too late.' }

        }

      }
    } catch (error) {

    }
  }


  updateCanOrderLunch(orderDateTime: dayjs.Dayjs) {

    const timezone: string = this.restaurant.timezone;
    let stringStarter = orderDateTime.format('YYYY MM DD') + ' ';

    let lunchStart = dayjs(stringStarter + this.restaurant.lunchStart[orderDateTime.day()], 'YYYY MM DD hh:mm a').set('second', 0);
    let lunchCutoff = dayjs(stringStarter + this.restaurant.lunchEnd[orderDateTime.day()], 'YYYY MM DD hh:mm a')


    if (orderDateTime.isBefore(lunchStart) || orderDateTime.isAfter(lunchCutoff)) {
      this.canOrderLunch = false;
      // console.log('cannot order lunch')
    } else {
      this.canOrderLunch = true;
      // console.log('can order lunch')

    }
  }


  updateEarliestOrderTime() {
    // is it after order close?
    let orderDay: dayjs.Dayjs;
    let rightNow = dayjs();
    let stringStart = rightNow.format('YYYY MM DD') + ' ';

    if (this.closeDays.indexOf(rightNow.day()) != -1) {
      orderDay = dayjs();
      orderDay.add(1, 'day');
      while (this.closeDays.indexOf(orderDay.day()) != -1) {
        orderDay.add(1, 'day');
      }
    }
    else {

      let endTime = this.restaurant.orderEnd[rightNow.day()]
      let endDateTime = dayjs(stringStart + endTime, 'YYYY MM DD hh:mm a')

      //we need to check the isFutureOrder field to tell if there is future 
      //order time available today
      //For future order, if it's less than one hour before the close time, 
      //then today's date should not be an option 

      if (this.orderObject.get("isFutureOrder").value == false) {
        if (rightNow.isAfter(endDateTime)) {
          orderDay = dayjs();
          orderDay.add(1, 'day');
          //keep adding until we find the date it's open
          while (this.closeDays.indexOf(orderDay.day()) != -1) {
            orderDay.add(1, 'day');
          }
        } else {
          orderDay = dayjs();

        }
      } else {
        //For future order, if it's less than one hour before the close time, 
        //then today's date should not be an option 
        let temp = rightNow;
        temp.add(1, "hour")
        if (temp.isAfter(endDateTime)) {
          orderDay = dayjs();
          orderDay.add(1, 'day');
          //keep adding until we find the date it's open
          while (this.closeDays.indexOf(orderDay.day()) != -1) {
            orderDay.add(1, 'day');
          }
        } else {
          orderDay = dayjs();

        }
      }

    }
    // earliest future order date time
    let times = this.getTimeList(orderDay);
    let starterString = orderDay.format('YYYY MM DD') + ' ';
    this.earliest_OrderDateTime = dayjs(starterString + times[0], 'YYYY MM DD hh:mm a')
  }

  getTimeList(orderDate: dayjs.Dayjs) {
    let t = dayjs();
    if (orderDate.isSame(t, 'day')) {    // is it today or another day?
      // same day
      orderDate = dayjs(); // reset to get correct time

      const today = t.day();
      const timezone = this.restaurant.timezone;
      const orderEnd_Datetime = dayjs(this.restaurant.orderEnd[today], 'hh:mm a')

      const orderStart = dayjs(this.restaurant.orderStart[today], 'hh:mm a')

      if (orderDate.isBefore(orderStart)) {

        // not a valid order time
        console.warn('too early, cannot make asap order')
        this.orderObject.patchValue({ 'futureOrderDateTime': this.earliest_OrderDateTime }, { emitEvent: false });
        // return all times
        return this.orderTimeMap[orderDate.day()];

      } else if (orderDate.isAfter(orderEnd_Datetime)) {
        // not a valid order time
        console.warn('too late, cannot make asap order')


        // set to next day
        let tomorrow = orderDate.add(1, 'day');
        let times = this.getTimeList(tomorrow);
        let starterString = tomorrow.format('YYYY MM DD') + ' ';
        tomorrow = dayjs(starterString + times[0], 'YYYY MM DD hh:mm a')
        this.orderObject.patchValue({ 'futureOrderDateTime': tomorrow });

      }

      else {
        let tempDateTime = dayjs(orderDate).add(1, "hour");
        // '12:02 pm'
        const remainder = 10 - (tempDateTime.minute() % 10);
        // '12:10 pm'
        let tempTime = dayjs(tempDateTime).add(remainder, "minute").format("hh:mm a");
        // '12:20 pm'
        let removeTime_count = this.orderTimeMap[orderDate.day()].indexOf(tempTime); // the index is the number of items to remove from time list
        let tempList = Array.from(this.orderTimeMap[orderDate.day()]);
        if (removeTime_count != 0) {
          tempList.splice(0, removeTime_count);
        }
        return tempList;

      }

    }
    else {
      // different day - can be any time

      return this.orderTimeMap[orderDate.day()];

    }

  }


}