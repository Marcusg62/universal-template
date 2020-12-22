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


  constructor(public orderForm: OrderFormService, private route: ActivatedRoute, public dialog: MatDialog) {

    this.modifiers = this.route.snapshot.data["modifiers"];
    this.groups = this.route.snapshot.data["groups"].GroupDetail;
    this.menuItems = this.route.snapshot.data["menuItems"];
    // console.log('menuitems', this.menuItems)
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