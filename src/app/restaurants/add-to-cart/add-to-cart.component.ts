import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrderFormService } from '../order-form.service';
import { Observable } from 'rxjs';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { AngularFireAnalytics } from '@angular/fire/analytics';

@Component({
  selector: 'app-add-to-cart',
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.scss']
})
export class AddToCartComponent implements OnInit {

  public menuItemForm: FormGroup;
  public sizeOptions;
  public showPrice: Observable<number>;
  selectedModifiers = [];

  neededList = ['name', 'price', 'quantity', 'instructions', 'size','group']


  constructor(analytics: AngularFireAnalytics, private fb: FormBuilder, public dialogRef: MatDialogRef<AddToCartComponent>, @Inject(MAT_DIALOG_DATA) public data, public orderForm: OrderFormService) {

    analytics.logEvent('add_item_to_card', {item: data.menuItem.name});
    console.log('constructing new menuItemForm', this.data.menuItem);
    console.log("can order lunch",this.orderForm.canOrderLunch)

    // this.showPrice = this.orderForm.currentItemPrice;
    this.menuItemForm = this.fb.group({
      name: [data.menuItem.name, [Validators.required]],
      price: [data.menuItem.basePrices[0].price, [Validators.required]],
      group: data.menuItem.group,
      quantity: 1,
      instructions: ''
    });
    console.log('menuItemForm', this.menuItemForm.value);

    let denverTime = new Date().toLocaleString("en-US", { timeZone: "America/Denver" });
    let currentDate = new Date(denverTime);
    let containLunch = data.menuItem.basePrices.findIndex(bp => {
      return bp.type == 'Lunch';
    });
    this.sizeOptions = Array.from(data.menuItem.basePrices);
    if (data.menuItem.basePrices.length > 1) {

      if (this.orderForm.isFutureOrder) {
        if (containLunch != -1 && !orderForm.canOrderLunch) {
          // if true, only dinner, later than 3pm


          this.sizeOptions.splice(containLunch, 1);
          this.menuItemForm.patchValue({ 'price': this.sizeOptions[0].price })
          // this.orderForm.setInitialItemPrice(this.sizeOptions[0].price);
        }
        else {
          this.sizeOptions = data.menuItem.basePrices;
          // this.orderForm.setInitialItemPrice(this.sizeOptions[0].price);
        }
      }
      else {
        if (containLunch != -1 && !orderForm.canOrderLunch) {
          // if true, only dinner, later than 3pm


          // console.log('index of ', containLunch);

          this.sizeOptions = Array.from(data.menuItem.basePrices);

          this.sizeOptions.splice(containLunch, 1);
          // console.log('this.sizeOptions:', this.sizeOptions)

          this.menuItemForm.patchValue({ 'price': this.sizeOptions[0].price })
          // this.orderForm.setInitialItemPrice(this.sizeOptions[0].price);
        }
        else {
          this.sizeOptions = data.menuItem.basePrices;
          // this.orderForm.setInitialItemPrice(this.sizeOptions[0].price);
        }
      }



      this.menuItemForm.addControl('size', new FormControl(this.sizeOptions[0].type, Validators.required));
    }
    else {

      this.menuItemForm.addControl('size', new FormControl(this.sizeOptions[0].type, Validators.required));


    }

    this.addModifiers(this.sizeOptions[0].type)






    // console.log('This Menu Form!:', this.menuItemForm);

    this.menuItemForm.valueChanges.subscribe(val => {
      // console.log('menuItemForm changed', val);
      let item = val;
      this.menuItemForm.patchValue({ 'price': this.orderForm.getPriceOfItem(item) }, { emitEvent: false });
    });

    this.menuItemForm.get('size').valueChanges.subscribe(val => {
      this.addModifiers(val); // NOTE: @Jason addModifier() vs. addModifiers(). I changed addModifier() to addModifiers() so it is clear. 
    })




  }
  //for each modifier create a field in the item object, then send it to the html
  ngOnInit() {
  }

  addModifiers(size: string) {

    // clear modifiers that are not in this list

    let toRemove = Object.keys(this.menuItemForm.value).filter((el) => {
      return this.neededList.indexOf(el) < 0
    });

    for (const field in toRemove) {
      //console.log('field:',field)
      this.menuItemForm.removeControl(toRemove[field]);
    }

    // add modifiers respective to size
    this.selectedModifiers = []
    let bp = this.data.menuItem.basePrices.find(b => b.type == size);

    bp.modifiers.forEach(mod => {

      let fullMod = this.orderForm.modifiers.find(m => { return m.name == mod });

      if (fullMod.type == 'increasable_dropdown') {
        this.menuItemForm.addControl(fullMod.name, new FormArray([]));
      } else {
        this.menuItemForm.addControl(fullMod.name, new FormControl(''));
      }

      if (fullMod.isRequired == true) {
        this.menuItemForm.get(fullMod.name).setValidators(Validators.required);
      }
      if (fullMod.type == 'toggle') {
        this.menuItemForm.get(fullMod.name).setValue(fullMod.options[0].value);
      }
      this.menuItemForm.updateValueAndValidity();


    });




  }

  /*
  getModifiers
  This function returns a list of modifiers [full modifiers from modifier collection] 
  for the current size selection
  */
  getModifiers() {

    let mods = Object.keys(this.menuItemForm.value).filter(el => this.neededList.indexOf(el) < 0);
    let fullMods = [];
    mods.forEach(mod => {
      fullMods.push(this.orderForm.modifiers.find(m => { return m.name == mod }))
    });

    return fullMods;

  }

  addIncreasable(mod) {
    // console.log('mod.name',mod.name);  
    let modList = this.menuItemForm.get(mod.name) as FormArray;
    // console.log('modList',modList, 'type', typeof(modList));    
    modList.push(new FormControl(''));
    //this.menuItemForm.setControl(mod.name,new FormControl(modList))
  }
  removeIncreasable(mod, i) {
    let modList = this.menuItemForm.get(mod.name) as FormArray;
    modList.removeAt(i)
    //this.menuItemForm.setControl(mod.name,new FormControl(modList))
  }

  getField(name) {
    return this.menuItemForm.get(name) as FormArray;
  }

  get itemPrice() {
    return this.menuItemForm.get('price').value;
  }

  addToCart() {

    if (this.menuItemForm.invalid) {
      return;
    }

    console.log('item being pushed', this.menuItemForm.value);
    this.orderForm.addToCart(this.menuItemForm.value);
    this.dialogRef.close();

  }
  get itemQuantity() {
    return this.menuItemForm.get('quantity').value;
  }
  incQuant() {
    let oldval = this.menuItemForm.get('quantity').value;
    this.menuItemForm.patchValue({ quantity: oldval + 1 });
  }
  decQuant() {
    let oldval = this.menuItemForm.get('quantity').value;
    //don't let values be 0 or negative
    if (oldval <= 1) {
      return
    }
    else {
      this.menuItemForm.patchValue({ quantity: oldval - 1 });
    }

  }

  multiSelectLimitCheck(e, modName, n) {
    if (e.value.length > n) {
      const temp = e.value;
      temp.shift();
      this.menuItemForm.get(modName).setValue(temp);

    }
  }
  clearInstructions() {
    this.menuItemForm.get('instructions').setValue('');

  }

}
