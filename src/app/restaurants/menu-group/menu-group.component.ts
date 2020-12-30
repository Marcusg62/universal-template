import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderFormService } from '../order-form.service';
import { MatDialog } from '@angular/material/dialog';
import { AddToCartComponent } from '../add-to-cart/add-to-cart.component';
import { AngularFirestore, docChanges } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { Observable } from 'rxjs';
// import { AddToOrderDialogComponent } from '../add-to-order-dialog/add-to-order-dialog.component';


@Component({
  selector: 'app-menu-group',
  templateUrl: './menu-group.component.html',
  styleUrls: ['./menu-group.component.scss']
})
export class MenuGroupComponent implements OnInit {

  @Input() modifiers: any;
  @Input() menuItems: any;
  @Input() group: any;

  menuItems$:Observable<any>;

  constructor(private route: ActivatedRoute, public afs: AngularFirestore, public dialog: MatDialog, public router: Router) {


    
  }

  ngOnInit(): void {
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