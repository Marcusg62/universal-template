import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

import { OrderFormService } from '../order-form.service';
// import { ClosedComponent } from "../closed/closed.component";
import { ActivatedRoute, Router } from '@angular/router';
import { Restaurant } from '../Interfaces.model';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})

export class MenuComponent implements OnInit {
  @Input() restaurant: Restaurant;
  @Input() modifiers: any;
  @Input() groups: any;
  @Input() menuItems: any;

  active;
  closedMessage;
  currentSection = 'Appetizer';
  isFirst;
  expanded = false;

  menuItems$: Observable<any>;
  modifiers$: Observable<any>


  constructor(public afs: AngularFirestore, public orderForm: OrderFormService, private route: ActivatedRoute, public dialog: MatDialog) {

    // this.groups = this.route.snapshot.data["groups"].GroupDetail;

    this.groups = this.afs.doc('public/groups/' + route.snapshot.url[1].path + '/Groups').valueChanges()
    this.menuItems = []
    this.menuItems$ = this.afs.collection('public/menu/' + route.snapshot.url[1].path).get().pipe(take(1))

    this.modifiers$ = this.afs.collection('public/modifiers/' + route.snapshot.url[1].path).get().pipe(take(1))
    this.menuItems$.subscribe(val => {
      val.docs.forEach(doc => {

        this.menuItems.push(doc.data())

      })
      this.orderForm.menuList = this.menuItems

    })

    this.modifiers$.subscribe(val => {
      val.docs.forEach(doc => {

        this.orderForm.modifiers.push(doc.data())

      })
    })

    this.groups.subscribe(val => {
      console.log('groups', val)
      this.orderForm.groups = val.GroupDetail
    })

  }

  public returnGroupArray(group) {
    return this.menuItems.filter(menuItem => menuItem.group == group);
  }

  onSectionChange(sectionId: string) {
    this.currentSection = sectionId;
  }

  ngOnInit() {
    // TO DO: Need to impliment another way for closed restaurants, dialog doesn't make sense anymore

  }

  openOrderDetails() {
    const dialogRef = this.dialog.open(OrderDetailsComponent, {
      width: '100%',
      maxWidth: '700px',
      autoFocus: false,
    });
  }




  // TO DO: implement ordering time for groups

  scrollToGroup(g) {
    document.getElementById(g).scrollIntoView(true);
    // console.log(document.getElementById(g).parentElement.parentElement.parentElement);
    document.getElementById(g).parentElement.parentElement.parentElement.scrollTop -= 100;
  }

}