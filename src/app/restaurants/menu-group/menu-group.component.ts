import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { OrderFormService } from '../order-form.service';
import { MatDialog } from '@angular/material/dialog';
import { AddToCartComponent } from '../add-to-cart/add-to-cart.component';
// import { AddToOrderDialogComponent } from '../add-to-order-dialog/add-to-order-dialog.component';


@Component({
  selector: 'app-menu-group',
  templateUrl: './menu-group.component.html',
  styleUrls: ['./menu-group.component.scss']
})
export class MenuGroupComponent implements OnInit {
  @Input() group: any;
  @Input() modifiers: any;
  @Input() menuItems: any;

  constructor(public dialog: MatDialog, public router: Router) {

    // console.log(router.url)

  }

  ngOnInit(): void {
  }

  returnGroupArray(group) {
    return this.menuItems.filter(menuItem => menuItem.group == group);
  }


  openItem(menuItem) {

    const dialogRef = this.dialog.open(AddToCartComponent, {
      autoFocus: false,
      width: '400px',
      maxWidth: '95vw',
      maxHeight: '100vh',
      height: "auto",
      data: { menuItem }
    });

  }


}