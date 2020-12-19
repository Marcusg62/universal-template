import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { OrderFormService } from '../restaurants/order-form.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss']
})
export class RestaurantComponent implements OnInit {

  constructor(private route: ActivatedRoute, private afs: AngularFirestore, public orderForm: OrderFormService) {

    this.orderForm.selectedRestaurant.next(this.route.snapshot.url[1].path)

  }

  ngOnInit(): void {
  }

}
