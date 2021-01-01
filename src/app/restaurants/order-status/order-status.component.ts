import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { OrderFormService } from '../order-form.service';

@Component({
  selector: 'app-order-status',
  templateUrl: './order-status.component.html',
  styleUrls: ['./order-status.component.scss']
})
export class OrderStatusComponent implements OnInit {

  private orderDoc: AngularFirestoreDocument<any>;
  order: Observable<any>;

  constructor(public afs: AngularFirestore, public router: ActivatedRoute, public orderForm: OrderFormService) {

    let orderId = router.snapshot.url[2].path.split('-')
    console.log('orderId', orderId)


    this.orderDoc = this.afs.doc('internal/' + orderId[0] + '/order_archive/' + orderId[1]);
    this.order = this.orderDoc.valueChanges()

  }

  ngOnInit(): void {
  }

}
